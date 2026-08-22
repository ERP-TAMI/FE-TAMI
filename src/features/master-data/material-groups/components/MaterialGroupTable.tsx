import { Button, Table } from "@/components/shared";
import type { MaterialGroup } from "../types/material-group.types";

type MaterialGroupTableProps = {
  materialGroups: MaterialGroup[];
  onEdit: (materialGroup: MaterialGroup) => void;
  onStatus: (materialGroup: MaterialGroup) => void;
  onDelete: (materialGroup: MaterialGroup) => void;
};

export function MaterialGroupTable({
  materialGroups,
  onEdit,
  onStatus,
  onDelete,
}: MaterialGroupTableProps) {
  return (
    <Table
      embedded
      rows={materialGroups}
      getRowKey={(materialGroup) => materialGroup.id}
      emptyMessage="Không tìm thấy nhóm vật tư phù hợp."
      columns={[
        {
          key: "code",
          header: "Mã nhóm",
          render: (group) => (
            <span className="text-brand-600 dark:text-brand-400 font-medium" title={group.code}>
              {group.code}
            </span>
          ),
        },
        {
          key: "name",
          header: "Tên nhóm",
          render: (group) => (
            <span className="font-medium text-gray-900 dark:text-white">{group.name}</span>
          ),
        },
        {
          key: "displayOrder",
          header: "Thứ tự",
          align: "center",
          render: (group) => group.displayOrder,
        },
        {
          key: "status",
          header: "Trạng thái",
          render: (group) => (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                group.status === "active"
                  ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${
                  group.status === "active" ? "bg-success-500" : "bg-gray-400"
                }`}
              />
              {group.status === "active" ? "Đang hoạt động" : "Ngừng hoạt động"}
            </span>
          ),
        },
        {
          key: "actions",
          header: "Thao tác",
          align: "center",
          render: (group) => (
            <div className="flex items-center justify-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => onEdit(group)}>
                Sửa
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onStatus(group)}>
                {group.status === "active" ? "Ngừng hoạt động" : "Kích hoạt"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10"
                onClick={() => onDelete(group)}
              >
                Xóa
              </Button>
            </div>
          ),
        },
      ]}
    />
  );
}
