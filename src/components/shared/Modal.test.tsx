import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

afterEach(() => {
  cleanup();
  document.querySelector("[data-test-modal-trigger]")?.remove();
});

describe("Modal focus management", () => {
  it("moves focus into the dialog and restores it to the trigger on close", () => {
    const trigger = document.createElement("button");
    trigger.dataset.testModalTrigger = "true";
    trigger.textContent = "Mở hộp thoại";
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = render(
      <Modal open title="Chỉnh sửa xưởng" onClose={vi.fn()}>
        <input aria-label="Tên xưởng" />
      </Modal>,
    );

    const dialog = screen.getByRole("dialog", { name: "Chỉnh sửa xưởng" });
    expect(dialog.contains(document.activeElement)).toBe(true);

    rerender(
      <Modal open={false} title="Chỉnh sửa xưởng" onClose={vi.fn()}>
        <input aria-label="Tên xưởng" />
      </Modal>,
    );

    expect(document.activeElement).toBe(trigger);
  });

  it("wraps Tab and Shift+Tab inside the active dialog", () => {
    render(
      <Modal
        open
        title="Xác nhận"
        onClose={vi.fn()}
        footer={<button type="button">Xác nhận</button>}
      >
        <button type="button">Hủy</button>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog", { name: "Xác nhận" });
    const closeButton = within(dialog).getByRole("button", { name: "Đóng hộp thoại" });
    const confirmButton = within(dialog).getByRole("button", { name: "Xác nhận" });

    expect(document.activeElement).toBe(closeButton);
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(confirmButton);

    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(closeButton);
  });

  it("makes the background inert while open and restores its prior state", () => {
    const { container, rerender } = render(
      <>
        <button type="button">Nội dung nền</button>
        <Modal open title="Hộp thoại" onClose={vi.fn()}>
          Nội dung
        </Modal>
      </>,
    );

    expect(container.inert).toBe(true);

    rerender(
      <>
        <button type="button">Nội dung nền</button>
        <Modal open={false} title="Hộp thoại" onClose={vi.fn()}>
          Nội dung
        </Modal>
      </>,
    );

    expect(container.inert).not.toBe(true);
    expect(container.getAttribute("aria-hidden")).toBeNull();
  });

  it("uses a unique accessible title id for every dialog", () => {
    render(
      <>
        <Modal open title="Hộp thoại thứ nhất" onClose={vi.fn()}>
          Một
        </Modal>
        <Modal open title="Hộp thoại thứ hai" onClose={vi.fn()}>
          Hai
        </Modal>
      </>,
    );

    const first = screen.getByRole("dialog", { name: "Hộp thoại thứ nhất", hidden: true });
    const second = screen.getByRole("dialog", { name: "Hộp thoại thứ hai" });

    expect(first.getAttribute("aria-labelledby")).not.toBe(
      second.getAttribute("aria-labelledby"),
    );
  });
});
