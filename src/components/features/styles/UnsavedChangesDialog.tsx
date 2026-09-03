interface Props {
  isOpen: boolean;
  onConfirmLeave: () => void;
  onCancel: () => void;
}

export function UnsavedChangesDialog({ isOpen, onConfirmLeave, onCancel }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-5 shadow-lg dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Bạn có thay đổi chưa được lưu
        </h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Các thay đổi hiện tại sẽ bị mất nếu bạn thoát.
        </p>

        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            Tiếp tục chỉnh sửa
          </button>
          <button
            type="button"
            onClick={onConfirmLeave}
            className="rounded-lg bg-red-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-red-700 transition-colors"
          >
            Bỏ thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
