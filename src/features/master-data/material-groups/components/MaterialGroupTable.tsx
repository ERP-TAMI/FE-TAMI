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
      rows={materialGroups}
      getRowKey={(materialGroup) => materialGroup.id}
      emptyMessage="No material groups match this filter."
      columns={[
        {
          key: "name",
          header: "Name",
          render: (group) => <span className="font-medium">{group.name}</span>,
        },
        { key: "displayOrder", header: "Order", render: (group) => group.displayOrder },
        {
          key: "status",
          header: "Status",
          render: (group) => (
            <span className={group.status === "active" ? "text-success-600" : "text-gray-500"}>
              {group.status === "active" ? "Active" : "Inactive"}
            </span>
          ),
        },
        {
          key: "actions",
          header: "Actions",
          render: (group) => (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => onEdit(group)}>
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => onStatus(group)}>
                {group.status === "active" ? "Deactivate" : "Activate"}
              </Button>
              <Button variant="danger" size="sm" onClick={() => onDelete(group)}>
                Delete
              </Button>
            </div>
          ),
        },
      ]}
    />
  );
}
