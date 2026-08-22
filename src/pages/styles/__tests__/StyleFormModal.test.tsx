import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StyleFormModal } from "../StyleFormModal";
import { stylesApi } from "@/features/styles/api/stylesApi";
import type { Style } from "@/types/style";

vi.mock("@/features/styles/api/stylesApi", () => ({
  stylesApi: {
    createStyle: vi.fn(),
    updateStyle: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("StyleFormModal", () => {
  it("validates mandatory styleCode and styleName fields", async () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    render(
      <StyleFormModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />,
    );

    expect(screen.getByText("Tạo Mẫu Fit Mới")).toBeTruthy();

    const submitBtn = screen.getByRole("button", { name: "Tạo Mới" });
    fireEvent.click(submitBtn);

    // Validation prevents submission if empty
    expect(stylesApi.createStyle).not.toHaveBeenCalled();
  });

  it("shows unsaved changes warning dialog when closing modified form", async () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    render(
      <StyleFormModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />,
    );

    const input = screen.getByPlaceholderText("STY-000248");
    fireEvent.change(input, { target: { value: "FIT-NEW" } });

    // Click close button
    const closeBtn = screen.getByRole("button", { name: "Đóng" });
    fireEvent.click(closeBtn);

    // Prompt for unsaved changes should appear
    expect(screen.getByText("Bạn có thay đổi chưa được lưu")).toBeTruthy();
    expect(handleClose).not.toHaveBeenCalled();
  });

  it("keeps the Approved status when editing a style without touching status", async () => {
    const approvedStyle: Style = {
      id: "123",
      styleCode: "FIT-2026-001",
      styleName: "Áo Polo Nam",
      description: null,
      category: null,
      status: "approved",
      baseImageVersionId: null,
      as3bCmBaseDays: 30,
      rowVersion: 1,
      createdBy: null,
      createdAt: new Date().toISOString(),
      updatedBy: null,
      updatedAt: new Date().toISOString(),
    };

    vi.mocked(stylesApi.updateStyle).mockResolvedValueOnce(approvedStyle);

    render(
      <StyleFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        styleToEdit={approvedStyle}
      />,
    );

    // Dropdown phải hiển thị đúng "Đã duyệt", không bị ép về Nháp
    const statusSelect = screen.getByLabelText("Trạng thái") as HTMLSelectElement;
    expect(statusSelect.value).toBe("approved");

    fireEvent.click(screen.getByRole("button", { name: "Lưu mẫu fit" }));

    expect(stylesApi.updateStyle).toHaveBeenCalledWith(
      "123",
      expect.objectContaining({ status: "approved" }),
    );
  });
});
