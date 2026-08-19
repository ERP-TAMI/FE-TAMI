import { Table } from "@/components/shared";
import type { BomLine } from "../types/bom.types";

export function BomLineTable({ lines }: { lines: BomLine[] }) {
  return (
    <Table
      rows={lines}
      getRowKey={(line) => line.id}
      emptyMessage="No material lines have been added to this BOM."
      columns={[
        { key: "order", header: "Order", render: (line) => line.orderIndex },
        {
          key: "material",
          header: "Material snapshot",
          render: (line) => line.materialNameSnapshot,
        },
        {
          key: "group",
          header: "Group snapshot",
          render: (line) => line.materialGroupSnapshot ?? "—",
        },
        { key: "unit", header: "Unit snapshot", render: (line) => line.unitSnapshot },
        { key: "consumption", header: "Consumption", render: (line) => line.consumptionPerUnit },
        { key: "cost", header: "Unit cost", render: (line) => line.unitCost ?? "—" },
      ]}
    />
  );
}
