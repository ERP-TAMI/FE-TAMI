import { ConfirmDialog } from "@/components/shared";
import type { ProductionDocSyncSelection } from "./productionDocSync";

interface Props {
  source: "fit" | "po";
  open: boolean;
  selection: ProductionDocSyncSelection;
  isSubmitting: boolean;
  isAccessoriesLoading?: boolean;
  isAccessoriesError?: boolean;
  onSelectionChange: (field: keyof ProductionDocSyncSelection, checked: boolean) => void;
  onConfirm: (selection: ProductionDocSyncSelection) => void;
  onClose: () => void;
}

export function ProductionDocSyncDialog({
  source,
  open,
  selection,
  isSubmitting,
  isAccessoriesLoading = false,
  isAccessoriesError = false,
  onSelectionChange,
  onConfirm,
  onClose,
}: Props) {
  const hasSelection = selection.image || selection.accessories;
  const accessoriesUnavailable = isAccessoriesLoading || isAccessoriesError;

  return (
    <ConfirmDialog
      open={open}
      title="Xác nhận đồng bộ tài liệu sản xuất"
      description={
        <div className="space-y-4">
          <p>
            {source === "fit"
              ? "Chọn nội dung muốn lấy từ Mẫu Fit và Fit BOM."
              : "Chọn nội dung muốn lấy từ sản phẩm và PO BOM."}{" "}
            Chỉ các mục được chọn mới bị thay đổi; mục không chọn sẽ được giữ nguyên.
          </p>
          <div className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <label className="flex cursor-pointer items-start gap-3 text-gray-800 dark:text-gray-200">
              <input
                type="checkbox"
                checked={selection.image}
                disabled={isSubmitting}
                onChange={(event) => onSelectionChange("image", event.target.checked)}
                className="text-brand-600 focus:ring-brand-500 mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300 disabled:cursor-not-allowed"
              />
              <span className="space-y-0.5">
                <span className="block text-sm font-semibold">
                  {source === "fit" ? "Ảnh và mô tả Mẫu Fit → Mục 1" : "Ảnh sản phẩm → Mục 1"}
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  {source === "fit"
                    ? "Dùng ảnh và mô tả hiện tại của Mẫu Fit; phần nào không có dữ liệu sẽ được xóa."
                    : "Dùng ảnh cấu trúc hiện tại của sản phẩm; nếu sản phẩm chưa có ảnh, ảnh ở Mục 1 sẽ được xóa."}
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 text-gray-800 dark:text-gray-200">
              <input
                type="checkbox"
                checked={selection.accessories}
                disabled={isSubmitting}
                onChange={(event) => onSelectionChange("accessories", event.target.checked)}
                className="text-brand-600 focus:ring-brand-500 mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300 disabled:cursor-not-allowed"
              />
              <span className="space-y-0.5">
                <span className="block text-sm font-semibold">
                  {source === "fit" ? "Fit BOM" : "PO BOM"} → Mục 2 PHỤ LIỆU
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  {source === "fit"
                    ? "Dùng tên vật tư của revision Fit BOM hiện hành, loại trùng và xếp theo tên; nếu không có vật tư, Mục 2 sẽ được xóa."
                    : "Dùng tên vật tư theo thứ tự của revision PO BOM hiện hành; nếu BOM không có vật tư, Mục 2 sẽ được xóa."}
                </span>
              </span>
            </label>
          </div>
          {selection.accessories && isAccessoriesLoading && (
            <p role="status" className="text-sm text-gray-500 dark:text-gray-400">
              Đang tải dữ liệu Nguyên phụ liệu…
            </p>
          )}
          {selection.accessories && isAccessoriesError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              Không tải được Nguyên phụ liệu. Bỏ chọn mục này để chỉ đồng bộ ảnh, hoặc tải lại trang
              để thử lại.
            </p>
          )}
          {!hasSelection && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              Chọn ít nhất một nội dung cần đồng bộ.
            </p>
          )}
        </div>
      }
      confirmLabel="Xác nhận đồng bộ"
      confirmDisabled={!hasSelection || (selection.accessories && accessoriesUnavailable)}
      isSubmitting={isSubmitting}
      onConfirm={() => onConfirm(selection)}
      onClose={onClose}
    />
  );
}
