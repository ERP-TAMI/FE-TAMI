import { Table, type TableColumn } from "@/components/shared/Table";
import { PencilIcon, TrashBinIcon } from "@/icons";
import type { Workshop } from "@/types/workshop";

type WorkshopTableProps = {
  workshops: Workshop[];
  togglingId?: string;
  loading?: boolean;
  onEdit: (workshop: Workshop) => void;
  onDelete: (workshop: Workshop) => void;
  onToggleStatus: (workshop: Workshop) => void;
};

const capacityFormatter = new Intl.NumberFormat("vi-VN");

export function WorkshopTable({
  workshops,
  togglingId,
  loading = false,
  onEdit,
  onDelete,
  onToggleStatus,
}: WorkshopTableProps) {
  const columns: TableColumn<Workshop>[] = [
    {
      key: "workshopCode",
      header: "Mã xưởng",
      width: "w-[11%]",
      render: (workshop) => (
        <span className="block truncate font-semibold text-gray-900 dark:text-white">
          {workshop.workshopCode}
        </span>
      ),
    },
    {
      key: "name",
      header: "Tên xưởng",
      width: "w-[19%]",
      render: (workshop) => (
        <span
          title={workshop.name}
          className="block truncate font-medium text-gray-900 dark:text-white"
        >
          {workshop.name}
        </span>
      ),
    },
    {
      key: "manager",
      header: "Người quản lý",
      width: "w-[15%]",
      render: (workshop) => workshop.manager || <span className="text-gray-400">—</span>,
    },
    {
      key: "location",
      header: "Vị trí",
      width: "w-[15%]",
      render: (workshop) => workshop.location || <span className="text-gray-400">—</span>,
    },
    {
      key: "capacity",
      header: "Công suất/ngày",
      width: "w-[13%]",
      render: (workshop) => (
        <span className="font-semibold text-gray-900 tabular-nums dark:text-white">
          {capacityFormatter.format(workshop.capacity)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "w-[13%]",
      render: (workshop) => {
        const isToggling = togglingId === workshop.id;
        const isActive = workshop.status === "active";
        return (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              aria-label={`${isActive ? "Tắt" : "Bật"} ${workshop.name}`}
              onClick={() => onToggleStatus(workshop)}
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
      width: "w-[14%]",
      align: "center",
      render: (workshop) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(workshop)}
            title="Chỉnh sửa xưởng sản xuất"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <PencilIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Sửa</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(workshop)}
            title="Xóa xưởng sản xuất"
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
      tableClassName="min-w-[960px]"
      columns={columns}
      rows={workshops}
      getRowKey={(workshop) => workshop.id}
      loading={loading}
      emptyMessage="Không tìm thấy xưởng sản xuất phù hợp."
    />
  );
}
