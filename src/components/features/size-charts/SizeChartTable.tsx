import { Table, type TableColumn } from "@/components/shared/Table";
import { PencilIcon, TrashBinIcon } from "@/icons";
import type { SizeChart } from "@/types/size-chart";

type SizeChartTableProps = {
  sizeCharts: SizeChart[];
  togglingId?: string;
  loading?: boolean;
  onEdit: (sizeChart: SizeChart) => void;
  onToggleStatus: (sizeChart: SizeChart) => void;
  onDelete: (sizeChart: SizeChart) => void;
};

export function SizeChartTable({
  sizeCharts,
  togglingId,
  loading = false,
  onEdit,
  onToggleStatus,
  onDelete,
}: SizeChartTableProps) {
  const columns: TableColumn<SizeChart>[] = [
    {
      key: "name",
      header: "Tên bảng Size",
      width: "w-[28%]",
      render: (sizeChart) => (
        <span
          title={sizeChart.name}
          className="block truncate font-semibold text-gray-900 dark:text-white"
        >
          {sizeChart.name}
        </span>
      ),
    },
    {
      key: "sizes",
      header: "Danh sách Size",
      width: "w-[32%]",
      render: (sizeChart) => (
        <div className="flex flex-wrap gap-1.5" aria-label={`${sizeChart.sizes.length} Size`}>
          {sizeChart.sizes.map((size, index) => (
            <span
              key={`${size}-${index}`}
              data-testid="size-label"
              className="text-theme-xs rounded-md border border-gray-200 bg-gray-50 px-2 py-1 font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              {size}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "w-[22%]",
      render: (sizeChart) => {
        const isToggling = togglingId === sizeChart.id;
        const isActive = sizeChart.status === "active";
        return (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              aria-label={`${isActive ? "Tắt" : "Bật"} ${sizeChart.name}`}
              onClick={() => onToggleStatus(sizeChart)}
              disabled={isToggling}
              className={`focus:ring-brand-500/20 relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:ring-3 focus:outline-none ${
                isActive ? "bg-success-500" : "bg-gray-300 dark:bg-gray-700"
              } ${isToggling ? "cursor-wait opacity-50" : "cursor-pointer"}`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-xs transition-transform ${
                  isActive ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <span
              className={
                isActive
                  ? "text-success-700 dark:text-success-400"
                  : "text-gray-500 dark:text-gray-400"
              }
            >
              {isActive ? "Đang sử dụng" : "Đã tắt"}
            </span>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Thao tác",
      width: "w-[18%]",
      align: "center",
      render: (sizeChart) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(sizeChart)}
            title="Chỉnh sửa bảng Size"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <PencilIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Sửa</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(sizeChart)}
            title="Xóa bảng Size"
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/60 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/60"
          >
            <TrashBinIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Xóa</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <Table
      embedded
      tableClassName="min-w-[760px]"
      columns={columns}
      rows={sizeCharts}
      getRowKey={(sizeChart) => sizeChart.id}
      loading={loading}
      emptyMessage="Không tìm thấy bảng Size phù hợp."
    />
  );
}
