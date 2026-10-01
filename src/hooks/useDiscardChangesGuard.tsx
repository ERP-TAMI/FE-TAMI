import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

/**
 * Đóng modal tạo/sửa: có thay đổi chưa lưu thì hỏi lại trước, không thì đóng
 * luôn. Dùng ConfirmDialog (cũng là Modal) chứ không dùng UnsavedChangesDialog,
 * vì Modal đặt `inert` cho mọi thứ ngoài modal trên cùng — hộp cảnh báo không
 * portal sẽ không bấm được.
 */
export function useDiscardChangesGuard(isDirty: boolean, onClose: () => void) {
  const [isConfirming, setIsConfirming] = useState(false);

  const requestClose = () => {
    if (isDirty) setIsConfirming(true);
    else onClose();
  };

  const discardDialog = (
    <ConfirmDialog
      open={isConfirming}
      title="Bạn có thay đổi chưa được lưu"
      description="Các thay đổi hiện tại sẽ bị mất nếu bạn thoát."
      cancelLabel="Tiếp tục chỉnh sửa"
      confirmLabel="Bỏ thay đổi"
      variant="danger"
      onClose={() => setIsConfirming(false)}
      onConfirm={() => {
        setIsConfirming(false);
        onClose();
      }}
    />
  );

  return { requestClose, discardDialog };
}
