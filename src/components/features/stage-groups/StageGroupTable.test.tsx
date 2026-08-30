import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StageGroup, StageGroupSummary } from "@/types/stage-group";
import { StageGroupTable } from "./StageGroupTable";

const mocks = vi.hoisted(() => ({ useStageGroup: vi.fn() }));
vi.mock("@/hooks/useStageGroups", () => ({ useStageGroup: mocks.useStageGroup }));

const group: StageGroupSummary = {
  id: "55392448-98f6-4d26-a61e-849c92923f6a",
  groupCode: "NS-1K",
  groupName: "NS% 1K",
  description: "Nhóm công đoạn may 1 kim",
  status: "active",
  itemCount: 2,
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
      id: "771c0dc2-cd59-44e3-9b16-cacb200f20e5",
      itemName: "Bản đan dây nịt",
      description: "Bản đan dây nịt",
      ssv: "60.000",
      status: "active",
      orderIndex: 0,
    },
    {
      id: "56cda798-0d5b-4ea9-9d95-036fcb6b92d0",
      itemName: "Bẻ đỉnh đầu dây",
      description: "Bẻ đỉnh đầu dây",
      ssv: "10.000",
      status: "inactive",
      orderIndex: 1,
    },
  ],
};

function renderTable(overrides: Partial<React.ComponentProps<typeof StageGroupTable>> = {}) {
  const props: React.ComponentProps<typeof StageGroupTable> = {
    groups: [group],
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggleStatus: vi.fn(),
    onSaveItems: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
  render(<StageGroupTable {...props} />);
  fireEvent.click(screen.getByRole("button", { name: `Xem các công đoạn của ${group.groupName}` }));
  return props;
}

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

  it("keeps the group status aligned next to its actions", () => {
    render(
      <StageGroupTable
        groups={[group, inactiveGroup]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleStatus={vi.fn()}
        onSaveItems={vi.fn().mockResolvedValue(true)}
      />,
    );
    expect(screen.getByRole("columnheader", { name: "Trạng thái" }).className).toContain(
      "w-[15%] text-right",
    );
    expect(screen.getByRole("columnheader", { name: "Thao tác" }).className).toContain(
      "w-[24%] text-center",
    );
    expect(screen.getByTitle("Đang sử dụng (Bấm để tắt)").parentElement?.className).toContain(
      "justify-end",
    );
  });

  it("expands a group inline to show independent ordered child operations", () => {
    render(
      <StageGroupTable
        groups={[group]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleStatus={vi.fn()}
        onSaveItems={vi.fn().mockResolvedValue(true)}
      />,
    );
    const expandButton = screen.getByRole("button", {
      name: `Xem các công đoạn của ${group.groupName}`,
    });
    expect(expandButton.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(expandButton);
    const region = screen.getByRole("region", { name: `Các công đoạn của ${group.groupName}` });
    expect(mocks.useStageGroup).toHaveBeenCalledWith(group.id);
    expect(within(region).getAllByText("Bản đan dây nịt")).toHaveLength(2);
    expect(within(region).getAllByText("Bẻ đỉnh đầu dây")).toHaveLength(2);
    expect(within(region).getByText("60.000")).toBeTruthy();
    expect(within(region).getByText("Đang sử dụng")).toBeTruthy();
    expect(within(region).getByText("Đã tắt")).toBeTruthy();
    expect(within(region).queryByText(/GD-/)).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: `Thu gọn các công đoạn của ${group.groupName}` }),
    );
    expect(
      screen.queryByRole("region", { name: `Các công đoạn của ${group.groupName}` }),
    ).toBeNull();
  });

  it("edits the selected child name, description and SSV in its group", async () => {
    const onSaveItems = vi.fn().mockResolvedValue(true);
    renderTable({ onSaveItems });
    fireEvent.click(screen.getByRole("button", { name: "Sửa công đoạn con Bản đan dây nịt" }));
    fireEvent.change(screen.getByLabelText("Tên công đoạn con Bản đan dây nịt"), {
      target: { value: "Bản đan dây nịt chính" },
    });
    fireEvent.change(screen.getByLabelText("Mô tả công đoạn con Bản đan dây nịt"), {
      target: { value: "Mô tả mới" },
    });
    fireEvent.change(screen.getByLabelText("SSV cho Bản đan dây nịt"), {
      target: { value: "65.500" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu công đoạn con Bản đan dây nịt" }));
    await waitFor(() => {
      expect(onSaveItems).toHaveBeenCalledWith(group.id, [
        {
          id: detail.items[0].id,
          itemName: "Bản đan dây nịt chính",
          description: "Mô tả mới",
          ssv: "65.500",
          status: "active",
          orderIndex: 0,
        },
        { ...detail.items[1], orderIndex: 1 },
      ]);
    });
  });

  it("toggles only the selected child status", async () => {
    const onSaveItems = vi.fn().mockResolvedValue(true);
    renderTable({ onSaveItems });
    fireEvent.click(screen.getByRole("switch", { name: "Tắt công đoạn con Bản đan dây nịt" }));
    await waitFor(() => {
      expect(onSaveItems).toHaveBeenCalledWith(group.id, [
        { ...detail.items[0], status: "inactive", orderIndex: 0 },
        { ...detail.items[1], orderIndex: 1 },
      ]);
    });
  });

  it("deletes a child from only this group and compacts the remaining order", async () => {
    const onSaveItems = vi.fn().mockResolvedValue(true);
    renderTable({ onSaveItems });
    fireEvent.click(screen.getByRole("button", { name: "Xóa Bản đan dây nịt khỏi nhóm NS% 1K" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Xóa" }));
    await waitFor(() => {
      expect(onSaveItems).toHaveBeenCalledWith(group.id, [{ ...detail.items[1], orderIndex: 0 }]);
    });
  });
});
