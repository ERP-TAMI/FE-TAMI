import { Button, Modal } from "@/components/shared";
import type { MaterialGroup } from "@/types/material-group";

type MaterialGroupConfirmDialogProps = {
  materialGroup: MaterialGroup;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function MaterialGroupConfirmDialog({
  materialGroup,
  isSubmitting,
  onClose,
  onConfirm,
}: MaterialGroupConfirmDialogProps) {
  return (
    <Modal
      open
      title="Xóa nhóm vật tư"
      closeLabel="Đóng hộp xác nhận"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="danger" loading={isSubmitting} onClick={onConfirm}>
            Xóa
          </Button>
        </>
      }
    >
      <p className="text-theme-sm text-gray-600 dark:text-gray-300">
        Bạn có chắc muốn xóa “{materialGroup.name}”? Chỉ có thể xóa khi chưa có vật tư tham chiếu.
      </p>
    </Modal>
  );
}
