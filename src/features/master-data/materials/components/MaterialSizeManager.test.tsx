import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MaterialSizeManager } from "./MaterialSizeManager";

const createReset = vi.fn();
const updateReset = vi.fn();

vi.mock("../hooks/useMaterialSizes", () => ({
  useMaterialSizes: () => ({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useCreateMaterialSize: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    error: null,
    reset: createReset,
  }),
  useUpdateMaterialSize: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    error: null,
    reset: updateReset,
  }),
  useUpdateMaterialSizeStatus: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    error: null,
  }),
}));

describe("MaterialSizeManager", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("renders the explicit empty state", () => {
    render(
      <MaterialSizeManager
        material={{
          id: "c5ab824e-8e6d-42b0-8d9d-a02d34762d40",
          materialCode: "COTTON",
          materialName: "Cotton",
          materialGroupId: null,
          defaultUnitId: "75f6349c-6866-478c-866a-33c0148df9b6",
          defaultYieldPct: 0,
          lastUnitCost: 0,
          currentStock: 0,
          lowStockThreshold: 10,
          materialGroup: null,
          defaultUnit: null,
          status: "active",
        }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("No sizes have been created.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add size" })).toBeTruthy();
  });

  it("clears stale mutation errors before opening a new form", () => {
    render(
      <MaterialSizeManager
        material={{
          id: "c5ab824e-8e6d-42b0-8d9d-a02d34762d40",
          materialCode: "COTTON",
          materialName: "Cotton",
          materialGroupId: null,
          defaultUnitId: "75f6349c-6866-478c-866a-33c0148df9b6",
          defaultYieldPct: 0,
          lastUnitCost: 0,
          currentStock: 0,
          lowStockThreshold: 10,
          materialGroup: null,
          defaultUnit: null,
          status: "active",
        }}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add size" }));
    expect(createReset).toHaveBeenCalled();
    expect(updateReset).toHaveBeenCalled();
  });
});
