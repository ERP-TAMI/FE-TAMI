interface Props {
  isOpen: boolean;
  styleCode?: string;
  styleName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  styleCode,
  styleName,
  onConfirm,
  onCancel,
  isDeleting = false,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Xác nhận xóa Mẫu Fit
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
          Bạn có chắc chắn muốn xóa mẫu Fit{" "}
          <strong className="font-mono text-blue-600 dark:text-blue-400 break-all">
            {styleCode || styleName}
          </strong>{" "}
          không? Hành động này không thể hoàn tác.
        </p>

        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-lg border border-gray-300 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-lg bg-red-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isDeleting ? "Đang xóa..." : "Xóa Mẫu Fit"}
          </button>
        </div>
      </div>
    </div>
  );
}
