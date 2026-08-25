import { Table, type TableColumn } from "@/components/shared/Table";
import { PencilIcon, TrashBinIcon } from "@/icons";
import type { StageGroupSummary } from "@/types/stage-group";

type StageGroupTableProps = {
  groups: StageGroupSummary[];
  togglingId?: string;
  loading?: boolean;
  onEdit: (group: StageGroupSummary) => void;
  onDelete: (group: StageGroupSummary) => void;
  onToggleStatus: (group: StageGroupSummary) => void;
};

export function StageGroupTable({
  groups,
  togglingId,
  loading = false,
  onEdit,
  onDelete,
  onToggleStatus,
}: StageGroupTableProps) {
  const columns: TableColumn<StageGroupSummary>[] = [
    {
      key: "code",
      header: "Mã nhóm",
      width: "w-[15%]",
      render: (group) => (
        <span
          title={group.groupCode}
          className="block truncate font-semibold text-gray-900 dark:text-white"
        >
          {group.groupCode}
        </span>
      ),
    },
    {
      key: "name",
      header: "Tên nhóm",
      width: "w-[20%]",
      render: (group) => (
        <span title={group.groupName} className="block truncate font-medium">
          {group.groupName}
        </span>
      ),
    },
    {
      key: "description",
      header: "Mô tả",
      width: "w-[20%]",
      render: (group) => (
        <span title={group.description ?? undefined} className="block truncate text-gray-500">
          {group.description || "—"}
        </span>
      ),
    },
    {
      key: "itemCount",
      header: "Số công đoạn",
      width: "w-[10%]",
      align: "center",
      render: (group) => <span className="font-semibold tabular-nums">{group.itemCount}</span>,
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "w-[17%]",
      align: "right",
      render: (group) => {
        const isToggling = togglingId === group.id;
        return (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onToggleStatus(group)}
              disabled={isToggling}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                group.status === "active" ? "bg-success-500" : "bg-gray-300 dark:bg-gray-700"
              } ${isToggling ? "opacity-50" : ""}`}
              title={
                group.status === "active" ? "Đang sử dụng (Bấm để tắt)" : "Đã tắt (Bấm để bật)"
              }
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-xs transition ${
                  group.status === "active" ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-theme-xs inline-block w-20 shrink-0 text-left whitespace-nowrap">
              {group.status === "active" ? "Đang sử dụng" : "Đã tắt"}
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
      render: (group) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(group)}
            title="Chỉnh sửa nhóm công đoạn"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <PencilIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Sửa</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(group)}
            title="Xóa nhóm công đoạn"
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
      tableClassName="min-w-[920px]"
      columns={columns}
      rows={groups}
      getRowKey={(group) => group.id}
      loading={loading}
      emptyMessage="Không tìm thấy nhóm công đoạn phù hợp."
    />
  );
}
