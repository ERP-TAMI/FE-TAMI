import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type SearchableSelectOption = {
  value: string;
  label: string;
  sublabel?: string;
};

interface Props {
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  /**
   * Chế độ tải theo trang: KHÔNG lọc `options` ở client — `options` đã là
   * kết quả trang hiện tại do component cha nạp qua `onSearchChange`/
   * `onLoadMore`. Dùng khi danh sách gốc quá lớn để tải hết một lần (vd:
   * hàng trăm Style) — trái với chế độ mặc định vẫn lọc toàn bộ `options`
   * ngay trên client (chỉ hợp với danh sách ngắn).
   */
  async?: boolean;
  /** Async mode: gọi (đã debounce ~300ms) mỗi khi ô tìm kiếm đổi giá trị. */
  onSearchChange?: (query: string) => void;
  /** Async mode: đang tải trang đầu tiên (chưa có kết quả nào để hiển thị). */
  isLoading?: boolean;
  /** Async mode: đang tải thêm trang kế tiếp (cuộn tới cuối danh sách). */
  isFetchingMore?: boolean;
  /** Async mode: còn trang tiếp theo để tải hay không. */
  hasMore?: boolean;
  /** Async mode: gọi khi người dùng cuộn gần tới cuối danh sách đang mở. */
  onLoadMore?: () => void;
}

const GAP = 4;
const VIEWPORT_MARGIN = 8;
const SEARCH_DEBOUNCE_MS = 300;
const LOAD_MORE_THRESHOLD_PX = 48;

/**
 * `<select>` tìm kiếm được — khi danh sách dài (vd: hàng trăm Style), gõ để
 * lọc thay vì cuộn tay qua từng dòng. Hỗ trợ 2 chế độ: lọc client (mặc định,
 * nhận nguyên mảng `options`) hoặc tải theo trang qua `async` (xem mô tả ở
 * prop `async` — tránh fetch hết danh mục lớn về máy khách cùng lúc).
 *
 * Menu render qua portal ra `document.body` và định vị `fixed` theo tọa độ
 * của ô input (giống `PoDocumentCategoryPicker`): để `absolute` trong cây DOM
 * tại chỗ thì bất kỳ tổ tiên nào có `overflow` (thân modal cuộn được) sẽ cắt
 * cụt menu.
 */
export function SearchableSelect({
  value,
  options,
  onChange,
  placeholder = "-- Chọn --",
  searchPlaceholder = "Gõ để tìm kiếm...",
  emptyMessage = "Không tìm thấy kết quả phù hợp.",
  disabled = false,
  error,
  className = "",
  async = false,
  onSearchChange,
  isLoading = false,
  isFetchingMore = false,
  hasMore = false,
  onLoadMore,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const filtered = useMemo(() => {
    if (async) return options;
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || (o.sublabel ?? "").toLowerCase().includes(q),
    );
  }, [async, options, query]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPos(null);
      return;
    }

    const place = () => {
      const trigger = triggerRef.current?.getBoundingClientRect();
      if (!trigger) return;

      const menuHeight = menuRef.current?.offsetHeight ?? 280;

      let top = trigger.bottom + GAP;
      if (top + menuHeight > window.innerHeight - VIEWPORT_MARGIN) {
        top = Math.max(VIEWPORT_MARGIN, trigger.top - GAP - menuHeight);
      }

      setMenuPos({ top, left: trigger.left, width: trigger.width });
    };

    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [isOpen, query, filtered.length]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setHighlightIndex(Math.max(0, options.findIndex((o) => o.value === value)));
      requestAnimationFrame(() => searchInputRef.current?.focus());
      if (async) onSearchChange?.("");
    } else {
      clearTimeout(debounceRef.current);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setHighlightIndex(0);
    if (!async) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearchChange?.(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // stopPropagation không đủ: Modal cha cũng lắng nghe Escape trên
        // `document`, và listener của Modal được đăng ký trước (mở modal
        // trước khi dropdown này mở) nên chạy trước ở bubble phase, đóng
        // luôn cả Modal. Bắt ở capture phase (xem addEventListener bên dưới)
        // + stopPropagation ở đây để chặn event trước khi tới bubble phase.
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const opt = filtered[highlightIndex];
        if (opt) {
          onChange(opt.value);
          setIsOpen(false);
          triggerRef.current?.focus();
        }
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [isOpen, filtered, highlightIndex, onChange]);

  const handleListScroll = () => {
    if (!async || !hasMore || isFetchingMore) return;
    const el = listRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - LOAD_MORE_THRESHOLD_PX) {
      onLoadMore?.();
    }
  };

  const showInitialLoading = async && isLoading && filtered.length === 0;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-4 py-3 text-left text-sm outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 dark:bg-gray-800 dark:disabled:bg-gray-900 ${
          error
            ? "border-error-400 focus:border-error-500 focus:ring-error-500/20 dark:border-error-500"
            : "border-gray-250 focus:border-brand-500 focus:ring-brand-500/20 dark:border-gray-800"
        } ${className}`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selected ? "text-gray-900 dark:text-white" : "text-gray-400"
          }`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {error && (
        <p className="mt-1.5 text-xs font-medium text-error-600 dark:text-error-400">{error}</p>
      )}

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              top: menuPos?.top ?? -9999,
              left: menuPos?.left ?? -9999,
              width: menuPos?.width ?? 320,
            }}
            className="fixed z-[100] flex max-h-80 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="border-b border-gray-100 p-2 dark:border-gray-700">
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <div
              ref={listRef}
              role="listbox"
              onScroll={handleListScroll}
              className="divide-y divide-gray-100 overflow-y-auto py-1 dark:divide-gray-700/60"
            >
              {showInitialLoading ? (
                <p className="px-3 py-4 text-center text-sm text-gray-400">Đang tải...</p>
              ) : filtered.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-gray-400 italic">
                  {emptyMessage}
                </p>
              ) : (
                <>
                  {filtered.map((opt, idx) => {
                    const isSelected = opt.value === value;
                    const isHighlighted = idx === highlightIndex;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onMouseEnter={() => setHighlightIndex(idx)}
                        onClick={() => {
                          onChange(opt.value);
                          setIsOpen(false);
                          triggerRef.current?.focus();
                        }}
                        className={`flex w-full flex-col items-start border-l-2 px-3 py-2.5 text-left transition-colors ${
                          isSelected
                            ? "border-l-brand-600 bg-brand-50 dark:bg-brand-950/40"
                            : isHighlighted
                              ? "border-l-brand-300 bg-gray-100 dark:border-l-brand-700 dark:bg-gray-700"
                              : "border-l-transparent"
                        }`}
                      >
                        <span
                          className={`truncate text-sm ${
                            isSelected
                              ? "font-semibold text-brand-700 dark:text-brand-300"
                              : "font-medium text-gray-900 dark:text-white"
                          }`}
                        >
                          {opt.label}
                        </span>
                        {opt.sublabel && (
                          <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {opt.sublabel}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {async && isFetchingMore && (
                    <p className="px-3 py-2.5 text-center text-xs text-gray-400">
                      Đang tải thêm...
                    </p>
                  )}
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
