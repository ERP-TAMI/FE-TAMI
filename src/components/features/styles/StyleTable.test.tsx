import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StyleTable } from "./StyleTable";
import type { Style } from "@/types/style";

const style: Style = {
  id: "123",
  styleCode: "FIT-2026-001",
  styleName: "Áo Polo Nam",
  description: null,
  category: "Áo Polo",
  status: "draft",
  baseImageVersionId: null,
  as3bCmBaseDays: 30,
  rowVersion: 1,
  createdBy: null,
  createdAt: new Date("2026-01-01").toISOString(),
  updatedBy: null,
  updatedAt: new Date("2026-01-01").toISOString(),
};

function renderWithRouter(ui: ReactNode) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe("StyleTable", () => {
  afterEach(cleanup);

  it("renders an empty state", () => {
    renderWithRouter(
      <StyleTable
        styles={[]}
        onToggleStatus={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Không tìm thấy Mẫu Fit nào.")).toBeTruthy();
  });

  it("renders a row and toggles status via the switch", () => {
    const onToggleStatus = vi.fn();
    renderWithRouter(
      <StyleTable
        styles={[style]}
        onToggleStatus={onToggleStatus}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Áo Polo Nam")).toBeTruthy();
    fireEvent.click(screen.getByTitle("Đang Nháp (Bấm để chuyển thành Hoạt động)"));
    expect(onToggleStatus).toHaveBeenCalledWith(style);
  });

  it("runs edit and delete callbacks through the action buttons", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    renderWithRouter(
      <StyleTable
        styles={[style]}
        onToggleStatus={vi.fn()}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sửa" }));
    expect(onEdit).toHaveBeenCalledWith(style);

    fireEvent.click(screen.getByRole("button", { name: "Xóa" }));
    expect(onDelete).toHaveBeenCalledWith(style);
  });
});
