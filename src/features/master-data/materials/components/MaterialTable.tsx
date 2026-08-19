import { Button, Table } from "@/components/shared";
import type { Material } from "../types/material.types";

export function MaterialTable({
  materials,
  onEdit,
}: {
  materials: Material[];
  onEdit: (material: Material) => void;
}) {
  return (
    <Table
      rows={materials}
      getRowKey={(material) => material.id}
      emptyMessage="No materials have been created."
      columns={[
        {
          key: "code",
          header: "Code",
          render: (material) => <span className="font-medium">{material.materialCode}</span>,
        },
        { key: "name", header: "Name", render: (material) => material.materialName },
        {
          key: "status",
          header: "Status",
          render: (material) => (material.status === "active" ? "Active" : "Inactive"),
        },
        {
          key: "actions",
          header: "Actions",
          render: (material) => (
            <Button variant="ghost" size="sm" onClick={() => onEdit(material)}>
              Edit
            </Button>
          ),
        },
      ]}
    />
  );
}
