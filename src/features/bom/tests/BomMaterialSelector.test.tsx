import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BomMaterialSelector } from "../components/BomMaterialSelector";

const addLine = vi.fn();
const refetch = vi.fn();
let queryState: {
  data: { id: string; materialCode: string; materialName: string }[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
};

vi.mock("../hooks/useBomLines", () => ({
  useBomMaterialOptions: () => ({ ...queryState, refetch }),
  useAddBomLine: () => ({
    mutateAsync: addLine,
    isPending: false,
    error: null,
  }),
}));

describe("BomMaterialSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryState = {
      data: [
        { id: "c5ab824e-8e6d-42b0-8d9d-a02d34762d40", materialCode: "COT", materialName: "Cotton" },
      ],
      isLoading: false,
      isError: false,
      error: null,
    };
    addLine.mockResolvedValue({});
  });

  it("submits only material id and line values, never client snapshots", async () => {
    render(<BomMaterialSelector bomId="dc3a787f-aa4a-43ee-86c9-67871fdf6224" />);

    fireEvent.change(screen.getByLabelText("Material"), {
      target: { value: "c5ab824e-8e6d-42b0-8d9d-a02d34762d40" },
    });
    fireEvent.change(screen.getByLabelText("Consumption per unit"), {
      target: { value: "1.25" },
    });
    fireEvent.change(screen.getByLabelText("Order index"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Add BOM line" }));

    await waitFor(() =>
      expect(addLine).toHaveBeenCalledWith({
        materialId: "c5ab824e-8e6d-42b0-8d9d-a02d34762d40",
        consumptionPerUnit: 1.25,
        orderIndex: 2,
      }),
    );
  });

  it("shows material lookup errors and retries", () => {
    queryState = { data: [], isLoading: false, isError: true, error: new Error("offline") };
    render(<BomMaterialSelector bomId="dc3a787f-aa4a-43ee-86c9-67871fdf6224" />);

    fireEvent.click(screen.getByRole("button", { name: "Retry materials" }));
    expect(refetch).toHaveBeenCalled();
  });
});
