import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StyleFormModal } from "../StyleFormModal";
import { stylesApi } from "@/features/styles/api/stylesApi";

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

    const input = screen.getByPlaceholderText("VD: FIT-2026-001");
    fireEvent.change(input, { target: { value: "FIT-NEW" } });

    // Click close button
    const closeBtn = screen.getByRole("button", { name: "✕" });
    fireEvent.click(closeBtn);

    // Prompt for unsaved changes should appear
    expect(screen.getByText("⚠️ Dữ liệu chưa lưu!")).toBeTruthy();
    expect(handleClose).not.toHaveBeenCalled();
  });
});
