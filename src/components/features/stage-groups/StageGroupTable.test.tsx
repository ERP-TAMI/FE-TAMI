import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StageGroupTable } from "./StageGroupTable";
import type { StageGroup, StageGroupSummary } from "@/types/stage-group";

const mocks = vi.hoisted(() => ({ useStageGroup: vi.fn() }));

vi.mock("@/hooks/useStageGroups", () => ({ useStageGroup: mocks.useStageGroup }));

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

const detail: StageGroup = {
  ...group,
  items: [
    {
      stageId: "771c0dc2-cd59-44e3-9b16-cacb200f20e5",
      stageCode: "GD-BAN-DAN-DAY-NIT",
      stageName: "Bản đan dây nịt",
      description: "Bản đan dây nịt",
      ssv: "60.000",
      orderIndex: 0,
    },
    {
      stageId: "56cda798-0d5b-4ea9-9d95-036fcb6b92d0",
      stageCode: "GD-BE-DINH-DAU-DAY",
      stageName: "Bẻ đỉnh đầu dây",
      description: "Bẻ đỉnh đầu dây",
      ssv: "10.000",
      orderIndex: 1,
    },
  ],
};

describe("StageGroupTable", () => {
  beforeEach(() => {
    mocks.useStageGroup.mockReturnValue({
      data: detail,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
  });

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

  it("expands a group inline to show its full ordered stage list", () => {
    render(
      <StageGroupTable
        groups={[group]}
        activeStageIds={new Set([detail.items[0].stageId])}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleStatus={vi.fn()}
      />,
    );

    const expandButton = screen.getByRole("button", {
      name: `Xem các công đoạn của ${group.groupName}`,
    });
    expect(expandButton.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("GD-BAN-DAN-DAY-NIT")).toBeNull();

    fireEvent.click(expandButton);

    const region = screen.getByRole("region", {
      name: `Các công đoạn của ${group.groupName}`,
    });
    expect(mocks.useStageGroup).toHaveBeenCalledWith(group.id);
    expect(within(region).getByText("GD-BAN-DAN-DAY-NIT")).toBeTruthy();
    expect(within(region).getByText("GD-BE-DINH-DAU-DAY")).toBeTruthy();
    expect(within(region).getByText("60.000")).toBeTruthy();
    expect(within(region).getByText("Đang sử dụng")).toBeTruthy();
    expect(within(region).getByText("Đã tắt")).toBeTruthy();
    expect(expandButton.getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(
      screen.getByRole("button", { name: `Thu gọn các công đoạn của ${group.groupName}` }),
    );
    expect(
      screen.queryByRole("region", { name: `Các công đoạn của ${group.groupName}` }),
    ).toBeNull();
  });
});
