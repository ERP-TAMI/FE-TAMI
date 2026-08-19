import { Button, Table } from "@/components/shared";
import type { Material } from "../types/material.types";

export function MaterialTable({
  materials,
  onEdit,
  onStatus,
}: {
  materials: Material[];
  onEdit: (material: Material) => void;
  onStatus: (material: Material) => void;
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
          key: "group",
          header: "Material group",
          render: (material) =>
            material.materialGroup
              ? `${material.materialGroup.code} — ${material.materialGroup.name}`
              : "—",
        },
        {
          key: "unit",
          header: "Unit",
          render: (material) =>
            material.defaultUnit
              ? `${material.defaultUnit.code} — ${material.defaultUnit.name}`
              : "—",
        },
        { key: "stock", header: "Stock", render: (material) => material.currentStock },
        { key: "cost", header: "Last cost", render: (material) => material.lastUnitCost },
        { key: "threshold", header: "Low-stock", render: (material) => material.lowStockThreshold },
        {
          key: "status",
          header: "Status",
          render: (material) => (
            <span className={material.status === "active" ? "text-success-600" : "text-gray-500"}>
              {material.status === "active" ? "Active" : "Inactive"}
            </span>
          ),
        },
        {
          key: "actions",
          header: "Actions",
          render: (material) => (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => onEdit(material)}>
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => onStatus(material)}>
                {material.status === "active" ? "Deactivate" : "Activate"}
              </Button>
            </div>
          ),
        },
      ]}
    />
  );
}
