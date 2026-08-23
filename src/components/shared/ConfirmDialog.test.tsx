import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  afterEach(cleanup);

  it("does not perform the action until the confirm button is clicked", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Xóa nhóm vật tư"
        description="Bạn có chắc muốn xóa?"
        confirmLabel="Xóa"
        variant="danger"
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Xóa" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("closes without confirming when the cancel button is clicked", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Kích hoạt nhóm vật tư"
        description="Bạn có chắc muốn kích hoạt?"
        confirmLabel="Kích hoạt"
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("renders nothing when closed", () => {
    render(
      <ConfirmDialog
        open={false}
        title="Xóa"
        description="..."
        confirmLabel="Xóa"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
