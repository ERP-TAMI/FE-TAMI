import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BomApproveModal,
  BomCreateRevisionModal,
  BomDiscontinueModal,
  BomForwardModal,
  BomPromoteRevisionModal,
  BomRejectModal,
} from "./BomWorkflowModals";

describe("NPL workflow modals", () => {
  afterEach(cleanup);

  const cases = [
    {
      name: "forward",
      renderModal: (onClose: () => void) => (
        <BomForwardModal isOpen currentStatus="wait_nvkh" onClose={onClose} onSubmit={vi.fn()} />
      ),
    },
    {
      name: "reject",
      renderModal: (onClose: () => void) => (
        <BomRejectModal isOpen currentStatus="wait_rd" onClose={onClose} onSubmit={vi.fn()} />
      ),
    },
    {
      name: "approve",
      renderModal: (onClose: () => void) => (
        <BomApproveModal isOpen bomCode="NPL-1" onClose={onClose} onSubmit={vi.fn()} />
      ),
    },
    {
      name: "discontinue",
      renderModal: (onClose: () => void) => (
        <BomDiscontinueModal isOpen bomCode="NPL-1" onClose={onClose} onSubmit={vi.fn()} />
      ),
    },
    {
      name: "create revision",
      renderModal: (onClose: () => void) => (
        <BomCreateRevisionModal isOpen currentRevNo={1} onClose={onClose} onSubmit={vi.fn()} />
      ),
    },
    {
      name: "promote revision",
      renderModal: (onClose: () => void) => (
        <BomPromoteRevisionModal
          isOpen
          targetRevisionNo={1}
          currentRevisionNo={2}
          currentStatus="closed"
          onClose={onClose}
          onSubmit={vi.fn()}
        />
      ),
    },
  ];

  it.each(cases)("asks before closing $name after entering a note", ({ renderModal }) => {
    const onClose = vi.fn();
    render(renderModal(onClose));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Đã sửa" } });
    fireEvent.click(document.querySelector('[data-modal-backdrop="true"]') as HTMLElement);

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText("Bạn có thay đổi chưa được lưu")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Bỏ thay đổi" }).className).toContain(
      "bg-error-500",
    );
    fireEvent.click(screen.getByRole("button", { name: "Bỏ thay đổi" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
