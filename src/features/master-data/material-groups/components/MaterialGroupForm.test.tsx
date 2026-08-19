import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MaterialGroupForm } from "./MaterialGroupForm";

describe("MaterialGroupForm", () => {
  afterEach(cleanup);

  it("keeps submission blocked until required data is valid", async () => {
    const onSubmit = vi.fn();
    render(
      <MaterialGroupForm
        mode="create"
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save material group" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText("Code is required")).toBeTruthy();
    expect(await screen.findByText("Name is required")).toBeTruthy();
  });

  it("normalizes code and displays a server duplicate-name error", async () => {
    const onSubmit = vi.fn();
    const { rerender } = render(
      <MaterialGroupForm
        mode="create"
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText("Code"), { target: { value: " fabric " } });
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Fabric" } });
    fireEvent.click(screen.getByRole("button", { name: "Save material group" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ code: "FABRIC", name: "Fabric", displayOrder: 0 });
    });
    rerender(
      <MaterialGroupForm
        mode="create"
        isSubmitting={false}
        serverError="Material group name already exists"
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    expect(await screen.findByText("Material group name already exists")).toBeTruthy();
  });

  it("shows a general submission error when the API error does not belong to a field", async () => {
    render(
      <MaterialGroupForm
        mode="create"
        isSubmitting={false}
        serverError="Cannot reach the Backend API."
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect((await screen.findByRole("alert")).textContent).toContain("Cannot reach the Backend API.");
  });
});
