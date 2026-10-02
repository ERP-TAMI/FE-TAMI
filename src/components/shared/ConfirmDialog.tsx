import type { ReactNode } from "react";
import { Button } from "@/components/shared/Button";
import { Modal } from "@/components/shared/Modal";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  isSubmitting?: boolean;
  confirmDisabled?: boolean;
  closeOnClickOutside?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Hủy",
  variant = "primary",
  isSubmitting = false,
  confirmDisabled = false,
  closeOnClickOutside = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <Modal
      open
      title={title}
      closeLabel="Đóng hộp xác nhận"
      onClose={onClose}
      closeDisabled={isSubmitting}
      closeOnClickOutside={closeOnClickOutside}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            loading={isSubmitting}
            disabled={confirmDisabled}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-theme-sm text-gray-600 dark:text-gray-300">{description}</div>
    </Modal>
  );
}
