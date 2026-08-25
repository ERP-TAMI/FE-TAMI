import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StageGroupTable } from "./StageGroupTable";
import type { StageGroupSummary } from "@/types/stage-group";

const group: StageGroupSummary = {
  id: "55392448-98f6-4d26-a61e-849c92923f6a",
  groupCode: "NS-1K",
  groupName: "NS% 1K",
  description: "Nhóm công đoạn may 1 kim",
  status: "active",
  itemCount: 29,
  createdAt: "2026-08-25T00:00:00.000Z",
  updatedAt: "2026-08-25T00:00:00.000Z",
};

const inactiveGroup: StageGroupSummary = {
  ...group,
  id: "6bd160ee-1771-40c0-95dc-2c308a525307",
  groupCode: "NS-VAT-SO",
  groupName: "Nhóm vắt sổ",
  status: "inactive",
};

describe("StageGroupTable", () => {
  afterEach(cleanup);

  it("moves the status content closer to the action buttons", () => {
    render(
      <StageGroupTable
        groups={[group, inactiveGroup]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleStatus={vi.fn()}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Trạng thái" }).className).toContain(
      "w-[17%] text-right",
    );
    expect(screen.getByRole("columnheader", { name: "Thao tác" }).className).toContain(
      "w-[18%] text-center",
    );
    expect(screen.getByTitle("Đang sử dụng (Bấm để tắt)").parentElement?.className).toContain(
      "justify-end",
    );
    expect(screen.getByText("Đang sử dụng").className).toContain("w-20");
    expect(screen.getByText("Đã tắt").className).toContain("w-20");
  });
});
