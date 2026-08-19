import { Button, Modal } from "@/components/shared";
import type { MaterialGroup } from "../types/material-group.types";

type Action = "status" | "delete";
type MaterialGroupConfirmDialogProps = {
  action: Action;
  materialGroup: MaterialGroup;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function MaterialGroupConfirmDialog({ action, materialGroup, isSubmitting, onClose, onConfirm }: MaterialGroupConfirmDialogProps) {
  const isDelete = action === "delete";
  const nextStatus = materialGroup.status === "active" ? "inactive" : "active";
  const title = isDelete ? "Delete material group" : `${nextStatus === "active" ? "Activate" : "Deactivate"} material group`;
  const message = isDelete
    ? `Delete ${materialGroup.name}? This is only possible when no material references it.`
    : `${nextStatus === "active" ? "Activate" : "Deactivate"} ${materialGroup.name}?`;

  return (
    <Modal
      open
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant={isDelete ? "danger" : "primary"} loading={isSubmitting} onClick={onConfirm}>
            {isDelete ? "Delete" : nextStatus === "active" ? "Activate" : "Deactivate"}
          </Button>
        </>
      }
    >
      <p className="text-theme-sm text-gray-600 dark:text-gray-300">{message}</p>
    </Modal>
  );
}
