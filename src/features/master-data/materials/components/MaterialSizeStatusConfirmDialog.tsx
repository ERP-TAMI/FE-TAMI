import { Button, Modal } from "@/components/shared";
import type { MaterialSize } from "../types/material-size.types";

export function MaterialSizeStatusConfirmDialog({
  size,
  isSubmitting,
  onClose,
  onConfirm,
}: {
  size: MaterialSize;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const activating = size.status === "inactive";
  const action = activating ? "Activate" : "Deactivate";
  return (
    <Modal
      open
      title={`${action} size`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={isSubmitting} onClick={onConfirm}>
            {`${action} size`}
          </Button>
        </>
      }
    >
      <p className="text-theme-sm text-gray-600 dark:text-gray-300">
        {action} size <strong>{size.sizeCode}</strong>? Inactive sizes remain visible here for
        historical reference.
      </p>
    </Modal>
  );
}
