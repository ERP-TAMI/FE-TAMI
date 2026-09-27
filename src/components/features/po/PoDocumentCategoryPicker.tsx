import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PO_DOCUMENT_CATEGORIES, getDocumentCategoryInfo } from "@/lib/poDocuments";

interface Props {
  value: string;
  disabled?: boolean;
  isSaving?: boolean;
  /** Mép neo của menu so với nút bấm. */
  align?: "left" | "right";
  onChange: (purpose: string) => void;
}

const MENU_WIDTH = 176; // khớp với w-44
const GAP = 6;
const VIEWPORT_MARGIN = 8;

/**
 * Chọn phân loại cho một tài liệu PO.
 *
 * Thay cho `<select>` gốc: trình duyệt ép chiều rộng select theo option dài
 * nhất, nên một nhãn ngắn như "Khác" vẫn chiếm chỗ bằng "PO Chi tiết" và biến
 * cả cột thành một dãy hộp xám. Ở đây nút bấm ôm sát nhãn hiện tại và giữ đúng
 * màu badge của phân loại.
 *
 * Menu render qua portal ra `document.body` và định vị `fixed` theo tọa độ của
 * nút. Nếu để `absolute` trong cây DOM tại chỗ, bất kỳ tổ tiên nào có `overflow`
 * — thân modal cuộn được, ô danh sách tệp — đều cắt cụt menu.
 */
export function PoDocumentCategoryPicker({
  value,
  disabled = false,
  isSaving = false,
  align = "left",
  onChange,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Chạy trước khi trình duyệt vẽ: menu render lần đầu ở ngoài màn hình rồi
  // được đặt đúng chỗ ngay trong cùng một khung hình, nên không thấy nhấp nháy.
  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPos(null);
      return;
    }

    const place = () => {
      const trigger = triggerRef.current?.getBoundingClientRect();
      if (!trigger) return;

      const menuHeight = menuRef.current?.offsetHeight ?? 200;

      let top = trigger.bottom + GAP;
      // Không đủ chỗ bên dưới thì lật lên trên.
      if (top + menuHeight > window.innerHeight - VIEWPORT_MARGIN) {
        top = Math.max(VIEWPORT_MARGIN, trigger.top - GAP - menuHeight);
      }

      let left = align === "right" ? trigger.right - MENU_WIDTH : trigger.left;
      left = Math.min(
        Math.max(VIEWPORT_MARGIN, left),
        window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN,
      );

      setMenuPos({ top, left });
    };

    place();
    // capture: true để bắt cả cuộn của vùng cuộn bên trong, không chỉ window.
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [isOpen, align]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      // Menu nằm ngoài cây DOM của nút (portal), nên phải kiểm tra cả hai —
      // thiếu menuRef thì mousedown lên một mục sẽ đóng menu trước khi click
      // kịp bắn, và chọn phân loại sẽ không bao giờ ăn.
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const current = getDocumentCategoryInfo(value);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        disabled={disabled || isSaving}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Bấm để đổi phân loại tài liệu"
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-theme-xs font-semibold transition-all hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60 ${current.badgeClass} ${disabled ? "" : "cursor-pointer"}`}
      >
        {isSaving ? (
          <span
            className="h-3 w-3 shrink-0 animate-spin rounded-full border-[1.5px] border-current border-t-transparent"
            aria-hidden="true"
          />
        ) : null}
        <span>{current.shortLabel}</span>
        {!disabled && (
          <svg
            className={`h-3 w-3 shrink-0 opacity-60 transition-transform ${isOpen ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        )}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              top: menuPos?.top ?? -9999,
              left: menuPos?.left ?? -9999,
              width: MENU_WIDTH,
            }}
            // z cao hơn Modal (z-[90]) để không bị lớp phủ che.
            className="fixed z-[100] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-theme-lg dark:border-gray-700 dark:bg-gray-800"
          >
            {PO_DOCUMENT_CATEGORIES.map((cat) => {
              const isCurrent = cat.key === value;
              return (
                <button
                  key={cat.key}
                  type="button"
                  role="option"
                  aria-selected={isCurrent}
                  onClick={() => {
                    setIsOpen(false);
                    if (!isCurrent) onChange(cat.key);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/60 ${isCurrent ? "bg-gray-50 dark:bg-gray-700/40" : ""}`}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full border ${cat.badgeClass}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-theme-xs font-semibold text-gray-900 dark:text-white">
                    {cat.label}
                  </span>
                  {isCurrent && (
                    <svg
                      className="h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
