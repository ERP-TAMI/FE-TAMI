import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StyleFormModal } from "./StyleFormModal";
import type { Style } from "@/types/style";

afterEach(() => {
  cleanup();
});

describe("StyleFormModal", () => {
  it("validates mandatory styleCode and styleName fields", () => {
    const handleSubmit = vi.fn();

    render(
      <StyleFormModal isOpen onClose={vi.fn()} onSubmit={handleSubmit} isSubmitting={false} />,
    );

    expect(screen.getByText("Tạo Mẫu Fit Mới")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Tạo Mới" }));

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("shows unsaved changes warning dialog when closing modified form", () => {
    const handleClose = vi.fn();

    render(
      <StyleFormModal isOpen onClose={handleClose} onSubmit={vi.fn()} isSubmitting={false} />,
    );

    fireEvent.change(screen.getByPlaceholderText("STY-000248"), {
      target: { value: "FIT-NEW" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Đóng" }));

    expect(screen.getByText("Bạn có thay đổi chưa được lưu")).toBeTruthy();
    expect(handleClose).not.toHaveBeenCalled();
  });

  it("chỉ có 2 lựa chọn trạng thái: Nháp và Hoạt động", () => {
    render(
      <StyleFormModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} isSubmitting={false} />,
    );

    const statusSelect = screen.getByLabelText("Trạng thái") as HTMLSelectElement;
    const optionLabels = Array.from(statusSelect.options).map((o) => o.textContent);

    expect(optionLabels).toEqual(["Nháp", "Hoạt động"]);
  });

  it("giữ nguyên trạng thái Hoạt động khi sửa mà không đổi trạng thái", () => {
    const activeStyle: Style = {
      id: "123",
      styleCode: "FIT-2026-001",
      styleName: "Áo Polo Nam",
      description: null,
      category: null,
      status: "active",
      baseImageVersionId: null,
      as3bCmBaseDays: 30,
      rowVersion: 1,
      createdBy: null,
      createdAt: new Date().toISOString(),
      updatedBy: null,
      updatedAt: new Date().toISOString(),
    };
    const handleSubmit = vi.fn();

    render(
      <StyleFormModal
        isOpen
        onClose={vi.fn()}
        onSubmit={handleSubmit}
        isSubmitting={false}
        styleToEdit={activeStyle}
      />,
    );

    expect((screen.getByLabelText("Trạng thái") as HTMLSelectElement).value).toBe("active");

    fireEvent.click(screen.getByRole("button", { name: "Lưu mẫu fit" }));

    expect(handleSubmit).toHaveBeenCalledWith(expect.objectContaining({ status: "active" }));
  });
});
