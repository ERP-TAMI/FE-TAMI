import { useEffect, type ReactNode } from "react";

export type ModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  onClose: () => void;
};

export function Modal({
  open,
  title,
  children,
  footer,
  closeLabel = "Đóng hộp thoại",
  onClose,
}: ModalProps) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label={closeLabel}
        className="absolute inset-0 cursor-default bg-gray-950/50"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="shadow-theme-lg relative z-10 w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="modal-title"
            className="text-theme-lg font-semibold text-gray-900 dark:text-white"
          >
            {title}
          </h2>
          <button
            type="button"
            aria-label={closeLabel}
            className="text-theme-xl leading-none text-gray-400 hover:text-gray-700 dark:hover:text-white"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="mt-5">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </section>
    </div>
  );
}
