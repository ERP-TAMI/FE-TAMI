import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MaterialSizeForm } from "./MaterialSizeForm";

describe("MaterialSizeForm", () => {
  afterEach(cleanup);

  it("validates required and non-negative fields", async () => {
    const onSubmit = vi.fn();
    render(
      <MaterialSizeForm
        mode="create"
        isSubmitting={false}
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText("Current stock"), { target: { value: "-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Save size" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText("Size is required")).toBeTruthy();
    expect(await screen.findByText("Value cannot be negative")).toBeTruthy();
  });

  it("uppercases the size code and submits all managed numeric fields", async () => {
    const onSubmit = vi.fn();
    render(
      <MaterialSizeForm
        mode="create"
        isSubmitting={false}
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText("Size"), { target: { value: " xl " } });
    fireEvent.change(screen.getByLabelText("Unit cost"), { target: { value: "2.5" } });
    fireEvent.change(screen.getByLabelText("Current stock"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("Low-stock threshold"), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save size" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        sizeCode: "XL",
        barcode: null,
        unitCost: 2.5,
        currentStock: 4,
        lowStockThreshold: 1,
      }),
    );
  });

  it("renders duplicate errors beside the size field", () => {
    render(
      <MaterialSizeForm
        mode="create"
        isSubmitting={false}
        serverError="Material size already exists"
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Size").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Material size already exists")).toBeTruthy();
  });

  it("warns before cancelling a dirty form", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const onCancel = vi.fn();
    render(
      <MaterialSizeForm
        mode="create"
        isSubmitting={false}
        onCancel={onCancel}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Size"), { target: { value: "M" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel size form" }));

    expect(confirm).toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
    confirm.mockRestore();
  });
});
