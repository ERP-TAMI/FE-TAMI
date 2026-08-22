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

    fireEvent.click(screen.getByRole("button", { name: "Lưu nhóm vật tư" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText("Tên nhóm là bắt buộc")).toBeTruthy();
  });

  it("submits the documented fields and displays a server duplicate-name error", async () => {
    const onSubmit = vi.fn();
    const { rerender } = render(
      <MaterialGroupForm
        mode="create"
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText("Tên nhóm"), { target: { value: "Fabric" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu nhóm vật tư" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ name: "Fabric", displayOrder: 0 });
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

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Cannot reach the Backend API.",
    );
  });

  it("rejects a negative display order", async () => {
    const onSubmit = vi.fn();
    render(
      <MaterialGroupForm
        mode="create"
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText("Tên nhóm"), { target: { value: "Fabric" } });
    fireEvent.change(screen.getByLabelText("Thứ tự hiển thị"), { target: { value: "-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu nhóm vật tư" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText("Thứ tự hiển thị không được âm")).toBeTruthy();
  });

  it("warns before closing a dirty form", () => {
    const onClose = vi.fn();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(
      <MaterialGroupForm mode="create" isSubmitting={false} onClose={onClose} onSubmit={vi.fn()} />,
    );

    fireEvent.change(screen.getByLabelText("Tên nhóm"), { target: { value: "Fabric" } });
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));

    expect(confirm).toHaveBeenCalledWith("Bạn có muốn hủy các thay đổi chưa lưu không?");
    expect(onClose).not.toHaveBeenCalled();
    confirm.mockRestore();
  });
});
