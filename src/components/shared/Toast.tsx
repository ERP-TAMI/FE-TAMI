import { Button } from "@/components/shared/Button";

export type ToastProps = {
  open: boolean;
  message: string;
  closeLabel?: string;
  onClose: () => void;
};

export function Toast({ open, message, closeLabel = "Đóng thông báo", onClose }: ToastProps) {
  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="text-theme-sm shadow-theme-lg fixed right-4 bottom-4 z-50 flex max-w-sm items-center gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
    >
      <span>{message}</span>
      <Button variant="ghost" size="sm" onClick={onClose} aria-label={closeLabel}>
        ×
      </Button>
    </div>
  );
}
