import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SampleStatus } from "@/types/style-sample-round";

export const SAMPLE_STATUS_OPTIONS: { value: SampleStatus; label: string }[] = [
  { value: "working", label: "Đang làm" },
  { value: "approved", label: "Đạt" },
  { value: "needs_revision", label: "Chưa đạt" },
];

export function sampleStatusLabel(status: SampleStatus): string {
  return SAMPLE_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

const STATUS_BADGE_STYLES: Record<SampleStatus, string> = {
  working: "bg-gray-500 text-white border-gray-500 dark:bg-gray-600 dark:border-gray-600",
  approved:
    "bg-success-500 text-white border-success-500 dark:bg-success-600 dark:border-success-600",
  needs_revision:
    "bg-error-500 text-white border-error-500 dark:bg-error-600 dark:border-error-600",
};

const STATUS_MENU_WIDTH = 168;
const STATUS_MENU_GAP = 6;
const STATUS_MENU_VIEWPORT_MARGIN = 8;

/**
 * Đổi trạng thái đợt mẫu ngay tại chỗ.
 *
 * Thay cho `<select>` gốc: phần đóng có thể style theo màu badge, nhưng danh
 * sách option khi mở ra là UI mặc định của trình duyệt/OS, không style được.
 * Ở đây cả nút bấm lẫn menu đều tự vẽ (theo mẫu `PoDocumentCategoryPicker`),
 * menu render qua portal ra `document.body` và định vị `fixed` theo tọa độ
 * của nút để không bị cha có `overflow` cắt cụt.
 */
export function SampleStatusPicker({
  status,
  isSaving,
  onChange,
}: {
  status: SampleStatus;
  isSaving?: boolean;
  onChange: (status: SampleStatus) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPos(null);
      return;
    }

    const place = () => {
      const trigger = triggerRef.current?.getBoundingClientRect();
      if (!trigger) return;

      const menuHeight = menuRef.current?.offsetHeight ?? 150;

      let top = trigger.bottom + STATUS_MENU_GAP;
      if (top + menuHeight > window.innerHeight - STATUS_MENU_VIEWPORT_MARGIN) {
        top = Math.max(STATUS_MENU_VIEWPORT_MARGIN, trigger.top - STATUS_MENU_GAP - menuHeight);
      }

      const left = Math.min(
        Math.max(STATUS_MENU_VIEWPORT_MARGIN, trigger.left),
        window.innerWidth - STATUS_MENU_WIDTH - STATUS_MENU_VIEWPORT_MARGIN,
      );

      setMenuPos({ top, left });
    };

    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
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

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        disabled={isSaving}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Bấm để đổi trạng thái"
        className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-theme-xs font-semibold leading-none transition-all hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60 ${STATUS_BADGE_STYLES[status]} ${isSaving ? "" : "cursor-pointer"}`}
      >
        {isSaving && (
          <span
            className="h-3 w-3 shrink-0 animate-spin rounded-full border-[1.5px] border-current border-t-transparent"
            aria-hidden="true"
          />
        )}
        <span>{sampleStatusLabel(status)}</span>
        {!isSaving && (
          <svg
            className={`h-3 w-3 shrink-0 opacity-90 transition-transform ${isOpen ? "rotate-180" : ""}`}
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
              width: STATUS_MENU_WIDTH,
            }}
            className="fixed z-[100] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-theme-lg dark:border-gray-700 dark:bg-gray-800"
          >
            {SAMPLE_STATUS_OPTIONS.map((opt) => {
              const isCurrent = opt.value === status;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isCurrent}
                  onClick={() => {
                    setIsOpen(false);
                    if (!isCurrent) onChange(opt.value);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/60 ${isCurrent ? "bg-gray-50 dark:bg-gray-700/40" : ""}`}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${STATUS_BADGE_STYLES[opt.value]}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-theme-xs font-semibold text-gray-900 dark:text-white">
                    {opt.label}
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
