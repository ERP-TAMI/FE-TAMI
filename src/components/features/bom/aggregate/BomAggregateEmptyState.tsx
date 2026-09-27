import { Layers, RotateCcw } from "lucide-react";

interface BomAggregateEmptyStateProps {
  isFiltered: boolean;
  onClearFilters: () => void;
}

export function BomAggregateEmptyState({
  isFiltered,
  onClearFilters,
}: BomAggregateEmptyStateProps) {
  return (
    <div
      data-testid="bom-aggregate-empty"
      className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 dark:bg-gray-800/80 dark:text-gray-500">
        <Layers className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-white">
        Chưa có dữ liệu NPL
      </h3>
      <p className="mt-1.5 max-w-md text-xs text-gray-500 dark:text-gray-400">
        {isFiltered
          ? "Không có BOM PO đã đóng phù hợp với điều kiện lọc."
          : "Chưa có BOM PO nào ở trạng thái đã đóng (closed) để tổng hợp nhu cầu nguyên phụ liệu."}
      </p>

      {isFiltered && (
        <button
          type="button"
          data-testid="empty-state-clear-btn"
          onClick={onClearFilters}
          className="mt-5 inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-2xs transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Xóa bộ lọc</span>
        </button>
      )}
    </div>
  );
}
