import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MaterialSizeStatusConfirmDialog } from "./MaterialSizeStatusConfirmDialog";

const size = {
  id: "33b27a8c-d43d-46f6-a3c4-e40ae72ef3e8",
  materialId: "c5ab824e-8e6d-42b0-8d9d-a02d34762d40",
  sizeCode: "M",
  barcode: null,
  unitCost: 0,
  currentStock: 0,
  lowStockThreshold: 10,
  status: "active" as const,
};

describe("MaterialSizeStatusConfirmDialog", () => {
  it("requires explicit confirmation before changing status", () => {
    const onConfirm = vi.fn();
    render(
      <MaterialSizeStatusConfirmDialog
        size={size}
        isSubmitting={false}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Deactivate size" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
