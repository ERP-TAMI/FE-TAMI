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

export function MaterialGroupConfirmDialog({
  action,
  materialGroup,
  isSubmitting,
  onClose,
  onConfirm,
}: MaterialGroupConfirmDialogProps) {
  const isDelete = action === "delete";
  const nextStatus = materialGroup.status === "active" ? "inactive" : "active";
  const title = isDelete
    ? "Xóa nhóm vật tư"
    : nextStatus === "active"
      ? "Kích hoạt nhóm vật tư"
      : "Ngừng hoạt động nhóm vật tư";
  const message = isDelete
    ? `Bạn có chắc muốn xóa “${materialGroup.name}”? Chỉ có thể xóa khi chưa có vật tư tham chiếu.`
    : nextStatus === "active"
      ? `Bạn có chắc muốn kích hoạt lại nhóm “${materialGroup.name}”?`
      : `Bạn có chắc muốn ngừng hoạt động nhóm “${materialGroup.name}”?`;

  return (
    <Modal
      open
      title={title}
      closeLabel="Đóng hộp xác nhận"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant={isDelete ? "danger" : "primary"}
            loading={isSubmitting}
            onClick={onConfirm}
          >
            {isDelete ? "Xóa" : nextStatus === "active" ? "Kích hoạt" : "Ngừng hoạt động"}
          </Button>
        </>
      }
    >
      <p className="text-theme-sm text-gray-600 dark:text-gray-300">{message}</p>
    </Modal>
  );
}
