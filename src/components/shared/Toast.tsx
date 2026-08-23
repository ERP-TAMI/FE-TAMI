import { Button } from "@/components/shared/Button";

type ToastVariant = "neutral" | "success" | "error";

export type ToastProps = {
  open: boolean;
  message: string;
  variant?: ToastVariant;
  closeLabel?: string;
  onClose: () => void;
};

const variantClasses: Record<ToastVariant, string> = {
  neutral: "border-gray-200 bg-white text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200",
  success:
    "border-success-200 bg-success-50 text-success-700 dark:border-success-900/50 dark:bg-success-900/20 dark:text-success-200",
  error:
    "border-error-200 bg-error-50 text-error-700 dark:border-error-900/50 dark:bg-error-900/20 dark:text-error-200",
};

export function Toast({
  open,
  message,
  variant = "neutral",
  closeLabel = "Đóng thông báo",
  onClose,
}: ToastProps) {
  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`text-theme-sm shadow-theme-lg fixed right-4 bottom-4 z-50 flex max-w-sm items-center gap-4 rounded-xl border px-4 py-3 ${variantClasses[variant]}`}
    >
      <span>{message}</span>
      <Button variant="ghost" size="sm" onClick={onClose} aria-label={closeLabel}>
        ×
      </Button>
    </div>
  );
}
