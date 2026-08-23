import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MaterialGroupTable } from "./MaterialGroupTable";
import type { MaterialGroup } from "@/types/material-group";

const materialGroup: MaterialGroup = {
  id: "e41a0a7d-28b1-4d78-9c26-b017f5c5f890",
  name: "Steel",
  status: "active",
};

describe("MaterialGroupTable", () => {
  afterEach(cleanup);

  it("renders an empty state", () => {
    render(
      <MaterialGroupTable
        materialGroups={[]}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Không tìm thấy nhóm vật tư phù hợp.")).not.toBeNull();
  });

  it("renders a row and only toggles status after the user clicks the switch", () => {
    const onToggleStatus = vi.fn();
    render(
      <MaterialGroupTable
        materialGroups={[materialGroup]}
        onEdit={vi.fn()}
        onToggleStatus={onToggleStatus}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Steel")).not.toBeNull();
    const headers = screen.getByRole("columnheader", { name: "Tên nhóm" }).closest("tr")
      ?.children;
    expect(Array.from(headers ?? []).map((header) => header.className)).toEqual([
      "w-[45%] px-5 py-3.5 font-semibold",
      "w-[25%] px-5 py-3.5 font-semibold",
      "w-[30%] px-5 py-3.5 text-center font-semibold",
    ]);

    expect(onToggleStatus).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByTitle("Đang hoạt động (Bấm để ngừng hoạt động)"),
    );
    expect(onToggleStatus).toHaveBeenCalledWith(materialGroup);
  });

  it("keeps a long name inside its column", () => {
    const longGroup = {
      ...materialGroup,
      name: "Nhóm vật tư có tên rất dài để kiểm tra hành vi cắt bớt trong bảng danh sách",
    };

    render(
      <MaterialGroupTable
        materialGroups={[longGroup]}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByTitle(longGroup.name).className).toContain("truncate");
  });

  it("edits and deletes a group through the action buttons", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <MaterialGroupTable
        materialGroups={[materialGroup]}
        onEdit={onEdit}
        onToggleStatus={vi.fn()}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sửa" }));
    expect(onEdit).toHaveBeenCalledWith(materialGroup);

    fireEvent.click(screen.getByRole("button", { name: "Xóa" }));
    expect(onDelete).toHaveBeenCalledWith(materialGroup);
  });
});
