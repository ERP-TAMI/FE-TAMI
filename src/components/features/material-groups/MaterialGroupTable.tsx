import { Table, type TableColumn } from "@/components/shared/Table";
import { PencilIcon, TrashBinIcon } from "@/icons";
import type { MaterialGroup } from "@/types/material-group";

type MaterialGroupTableProps = {
  materialGroups: MaterialGroup[];
  togglingId?: string;
  loading?: boolean;
  onEdit: (materialGroup: MaterialGroup) => void;
  onToggleStatus: (materialGroup: MaterialGroup) => void;
  onDelete: (materialGroup: MaterialGroup) => void;
};

export function MaterialGroupTable({
  materialGroups,
  togglingId,
  loading = false,
  onEdit,
  onToggleStatus,
  onDelete,
}: MaterialGroupTableProps) {
  const columns: TableColumn<MaterialGroup>[] = [
    {
      key: "name",
      header: "Tên nhóm",
      width: "w-[45%]",
      render: (group) => (
        <span
          title={group.name}
          className="block max-w-full truncate font-medium text-gray-900 dark:text-white"
        >
          {group.name}
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "w-[25%]",
      render: (group) => {
        const isToggling = togglingId === group.id;
        return (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onToggleStatus(group)}
              disabled={isToggling}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                group.status === "active"
                  ? "bg-success-500"
                  : "bg-gray-300 dark:bg-gray-700"
              } ${isToggling ? "opacity-50" : ""}`}
              title={
                group.status === "active" ? "Đang sử dụng (Bấm để tắt)" : "Đã tắt (Bấm để bật)"
              }
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  group.status === "active" ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                group.status === "active"
                  ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {group.status === "active" ? "Đang sử dụng" : "Đã tắt"}
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
      render: (group) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(group)}
            title="Chỉnh sửa"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <PencilIcon className="h-3.5 w-3.5 shrink-0" />
            <span>Sửa</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(group)}
            title="Xóa nhóm vật tư"
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
      rows={materialGroups}
      getRowKey={(group) => group.id}
      loading={loading}
      emptyMessage="Không tìm thấy nhóm vật tư phù hợp."
    />
  );
}
