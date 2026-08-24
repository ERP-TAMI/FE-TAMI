import { Table, type TableColumn } from "@/components/shared/Table";
import { PencilIcon, TrashBinIcon } from "@/icons";
import type { Unit } from "@/types/material";

type UnitTableProps = {
  units: Unit[];
  togglingId?: string;
  loading?: boolean;
  onEdit: (unit: Unit) => void;
  onToggleStatus: (unit: Unit) => void;
  onDelete: (unit: Unit) => void;
};

export function UnitTable({
  units,
  togglingId,
  loading = false,
  onEdit,
  onToggleStatus,
  onDelete,
}: UnitTableProps) {
  const columns: TableColumn<Unit>[] = [
    {
      key: "name",
      header: "Tên đơn vị",
      width: "w-[45%]",
      render: (unit) => (
        <button
          type="button"
          onClick={() => onEdit(unit)}
          title={unit.name}
          className="hover:text-brand-600 dark:hover:text-brand-400 block max-w-full truncate text-left font-medium text-gray-900 dark:text-white"
        >
          {unit.name}
        </button>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "w-[25%]",
      render: (unit) => {
        const isToggling = togglingId === unit.id;
        return (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onToggleStatus(unit)}
              disabled={isToggling}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                unit.status === "active" ? "bg-success-500" : "bg-gray-300 dark:bg-gray-700"
              } ${isToggling ? "opacity-50" : ""}`}
              title={
                unit.status === "active" ? "Đang sử dụng (Bấm để tắt)" : "Đã tắt (Bấm để bật)"
              }
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  unit.status === "active" ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                unit.status === "active"
                  ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {unit.status === "active" ? "Đang sử dụng" : "Đã tắt"}
            </span>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Thao tác",
      width: "w-[30%]",
      align: "center",
      render: (unit) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(unit)}
            title="Chỉnh sửa"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <PencilIcon className="h-3.5 w-3.5 shrink-0" />
            <span>Sửa</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(unit)}
            title="Xóa đơn vị tính"
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/60 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/60"
          >
            <TrashBinIcon className="h-3.5 w-3.5 shrink-0" />
            <span>Xóa</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <Table
      embedded
      columns={columns}
      rows={units}
      getRowKey={(unit) => unit.id}
      loading={loading}
      emptyMessage="Không tìm thấy đơn vị tính phù hợp."
    />
  );
}
