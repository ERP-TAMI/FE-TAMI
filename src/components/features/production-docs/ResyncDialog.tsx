interface Props {
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ResyncDialog({ isPending, onConfirm, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 space-y-4 border border-gray-200 dark:border-gray-800">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Đồng bộ lại tài liệu?
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          Nội dung <strong>Section 1 (Mô tả hình dáng)</strong> và{" "}
          <strong>Section 2 (Phụ liệu)</strong> sẽ được cập nhật lại từ BOM và Mẫu
          Fit gốc. Các thay đổi chỉnh sửa thủ công tại hai phần này có thể bị ghi đè.
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
          >
            {isPending ? "Đang đồng bộ..." : "Đồng bộ lại"}
          </button>
        </div>
      </div>
    </div>
  );
}
