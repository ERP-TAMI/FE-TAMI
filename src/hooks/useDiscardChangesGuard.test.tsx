import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { useDiscardChangesGuard } from "./useDiscardChangesGuard";

function Harness({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState("");
  const { requestClose, discardDialog } = useDiscardChangesGuard(value !== "", onClose);
  return (
    <>
      <Modal open title="Sửa" onClose={requestClose} closeOnClickOutside>
        <input aria-label="Tên" value={value} onChange={(e) => setValue(e.target.value)} />
      </Modal>
      {discardDialog}
    </>
  );
}

const backdrop = () =>
  document.querySelector('[data-modal-backdrop="true"]') as HTMLElement;

describe("useDiscardChangesGuard", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("closes right away on outside click when nothing changed", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    fireEvent.click(backdrop());

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Bạn có thay đổi chưa được lưu")).toBeNull();
  });

  it("asks before discarding unsaved changes, and keeps editing on cancel", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    fireEvent.change(screen.getByLabelText("Tên"), { target: { value: "abc" } });

    fireEvent.click(backdrop());
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText("Bạn có thay đổi chưa được lưu")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục chỉnh sửa" }));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByText("Bạn có thay đổi chưa được lưu")).toBeNull();

    fireEvent.click(backdrop());
    fireEvent.click(screen.getByRole("button", { name: "Bỏ thay đổi" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
