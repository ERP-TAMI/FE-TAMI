import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BomCopyFitModal } from "./BomCopyFitModal";

const api = vi.hoisted(() => ({
  getBoms: vi.fn(),
  getBomById: vi.fn(),
  getRevisions: vi.fn(),
}));

vi.mock("@/api/boms.api", () => ({ bomsApi: api }));

describe("BomCopyFitModal", () => {
  beforeEach(() => {
    api.getBoms.mockResolvedValue({
      data: [{ id: "fit-1", type: "fit", style: { id: "style-1" } }],
    });
    api.getBomById.mockResolvedValue({
      id: "fit-1",
      type: "fit",
      currentRevision: { id: "rev-2", revisionNo: 2, status: "closed" },
    });
    api.getRevisions.mockResolvedValue([
      { id: "rev-1", revisionNo: 1, status: "closed" },
      { id: "rev-2", revisionNo: 2, status: "closed" },
    ]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("closes on outside click when unchanged and confirms a changed source revision", async () => {
    const onClose = vi.fn();
    const props = { isOpen: true, styleId: "style-1", onClose, onSubmit: vi.fn() };
    const { rerender } = render(<BomCopyFitModal {...props} />);
    await waitFor(() => expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("rev-2"));
    fireEvent.click(document.querySelector('[data-modal-backdrop="true"]') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<BomCopyFitModal {...props} isOpen={false} />);
    rerender(<BomCopyFitModal {...props} />);
    await waitFor(() => expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("rev-2"));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "rev-1" } });
    fireEvent.click(document.querySelector('[data-modal-backdrop="true"]') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Bạn có thay đổi chưa được lưu")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Bỏ thay đổi" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
