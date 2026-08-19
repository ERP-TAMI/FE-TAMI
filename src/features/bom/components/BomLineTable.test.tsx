import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BomLineTable } from "./BomLineTable";

describe("BomLineTable", () => {
  it("renders the snapshots returned by the API", () => {
    render(
      <BomLineTable
        lines={[
          {
            id: "bbf24018-1dca-40bc-bfcb-3d438b90a43e",
            billOfMaterialId: "dc3a787f-aa4a-43ee-86c9-67871fdf6224",
            materialId: "c5ab824e-8e6d-42b0-8d9d-a02d34762d40",
            materialNameSnapshot: "Historical cotton",
            materialGroupSnapshot: "Historical fabric",
            unitSnapshot: "Historical metre",
            consumptionPerUnit: 1.25,
            unitCost: 12.5,
            orderIndex: 0,
          },
        ]}
      />,
    );

    expect(screen.getByText("Historical cotton")).toBeTruthy();
    expect(screen.getByText("Historical fabric")).toBeTruthy();
    expect(screen.getByText("Historical metre")).toBeTruthy();
  });
});
