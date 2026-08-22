import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MaterialGroupTable } from "./MaterialGroupTable";
import type { MaterialGroup } from "../types/material-group.types";

const materialGroup: MaterialGroup = {
  id: "e41a0a7d-28b1-4d78-9c26-b017f5c5f890",
  code: "STEEL",
  name: "Steel",
  displayOrder: 10,
  status: "active",
};

describe("MaterialGroupTable", () => {
  it("renders an empty state", () => {
    render(
      <MaterialGroupTable
        materialGroups={[]}
        onEdit={vi.fn()}
        onStatus={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Không tìm thấy nhóm vật tư phù hợp.")).not.toBeNull();
  });

  it("renders a row and only runs its action after the user clicks", () => {
    const onStatus = vi.fn();
    render(
      <MaterialGroupTable
        materialGroups={[materialGroup]}
        onEdit={vi.fn()}
        onStatus={onStatus}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Steel")).not.toBeNull();
    const columns = screen.getByText("Steel").closest("table")?.querySelectorAll("col");
    expect(Array.from(columns ?? []).map((column) => column.className)).toEqual([
      "w-1/6",
      "w-1/6",
      "w-1/6",
      "w-1/6",
      "w-1/3",
    ]);
    expect(onStatus).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Ngừng hoạt động" }));
    expect(onStatus).toHaveBeenCalledWith(materialGroup);
  });

  it("keeps long codes and names inside their columns", () => {
    const longGroup = {
      ...materialGroup,
      code: "MG-1D42638C2CAF4F03AFC79285B7C47AD99",
      name: "Nhóm vật tư có tên rất dài",
    };

    render(
      <MaterialGroupTable
        materialGroups={[longGroup]}
        onEdit={vi.fn()}
        onStatus={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByTitle(longGroup.code).className).toContain("truncate");
    expect(screen.getByTitle(longGroup.name).className).toContain("truncate");
  });
});
