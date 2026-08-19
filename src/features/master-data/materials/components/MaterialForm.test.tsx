import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MaterialForm } from "./MaterialForm";

describe("MaterialForm", () => {
  it("renders only active groups in the create selector", () => {
    render(
      <MaterialForm
        mode="create"
        activeGroups={[
          {
            id: "8a1c44f1-cd02-444c-8a4a-c2f74066fd5f",
            code: "FABRIC",
            name: "Fabric",
            displayOrder: 0,
            status: "active",
          },
        ]}
        activeUnits={[]}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole("option", { name: "FABRIC — Fabric" })).not.toBeNull();
    expect(screen.queryByText(/Inactive/)).toBeNull();
  });

  it("keeps the current inactive group visible when editing historical material", () => {
    render(
      <MaterialForm
        mode="edit"
        material={{
          id: "0a0c4447-8d8c-44dc-84bd-6300ed3ac4bf",
          materialCode: "COTTON",
          materialName: "Cotton",
          materialGroupId: "8a1c44f1-cd02-444c-8a4a-c2f74066fd5f",
          defaultUnitId: "8a1c44f1-cd02-444c-8a4a-c2f74066fd5e",
          defaultYieldPct: 0,
          lastUnitCost: 0,
          currentStock: 0,
          lowStockThreshold: 10,
          materialGroup: null,
          defaultUnit: null,
          status: "active",
        }}
        activeGroups={[]}
        historicalGroup={{
          id: "8a1c44f1-cd02-444c-8a4a-c2f74066fd5f",
          code: "FABRIC",
          name: "Fabric",
          displayOrder: 0,
          status: "inactive",
        }}
        activeUnits={[]}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole("option", { name: "FABRIC — Fabric (Inactive)" })).not.toBeNull();
  });
});
