import { BrowserRouter } from "react-router-dom";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StageGroupListPage from "./StageGroupListPage";

const mocks = vi.hoisted(() => ({
  useStageGroups: vi.fn(),
  useStageGroup: vi.fn(),
  useStages: vi.fn(),
  create: { isPending: false, error: null, mutateAsync: vi.fn(), reset: vi.fn() },
  update: { isPending: false, error: null, mutateAsync: vi.fn(), reset: vi.fn() },
  updateStatus: { isPending: false, variables: undefined, mutateAsync: vi.fn() },
}));

vi.mock("@/hooks/useStageGroups", () => ({
  useStageGroups: mocks.useStageGroups,
  useStageGroup: mocks.useStageGroup,
  useCreateStageGroup: () => mocks.create,
  useUpdateStageGroup: () => mocks.update,
  useUpdateStageGroupStatus: () => mocks.updateStatus,
}));
vi.mock("@/hooks/useStages", () => ({ useStages: mocks.useStages }));

const stage = {
  id: "771c0dc2-cd59-44e3-9b16-cacb200f20e5",
  stageCode: "GD-MAY",
  stageName: "May thân",
  description: null,
  ssv: "12.500",
  status: "active" as const,
};
const summary = {
  id: "64bfc097-69d1-43f5-af97-cb0e7428f7df",
  groupCode: "NC-MAY",
  groupName: "Nhóm may",
  description: null,
  status: "active" as const,
  itemCount: 1,
  createdAt: "2026-08-24T01:00:00.000Z",
  updatedAt: "2026-08-24T01:00:00.000Z",
};
const detail = {
  ...summary,
  items: [
    {
      stageId: stage.id,
      stageCode: stage.stageCode,
      stageName: stage.stageName,
      description: stage.description,
      ssv: stage.ssv,
      orderIndex: 0,
    },
  ],
};

function renderPage() {
  return render(
    <BrowserRouter>
      <StageGroupListPage />
    </BrowserRouter>,
  );
}

describe("StageGroupListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useStageGroups.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [summary],
      error: null,
      refetch: vi.fn(),
    });
    mocks.useStageGroup.mockReturnValue({
      isLoading: false,
      isError: false,
      data: detail,
      error: null,
    });
    mocks.useStages.mockReturnValue({ data: [stage], error: null });
  });

  afterEach(cleanup);

  it("creates a group with an ordered child stage", async () => {
    mocks.create.mutateAsync.mockResolvedValue(detail);
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Tạo nhóm công đoạn" }));
    fireEvent.change(screen.getByLabelText("Mã nhóm công đoạn"), {
      target: { value: "NC-MAY" },
    });
    fireEvent.change(screen.getByLabelText("Tên nhóm công đoạn"), {
      target: { value: "Nhóm may" },
    });
    fireEvent.change(screen.getByLabelText("Chọn công đoạn"), {
      target: { value: stage.id },
    });
    fireEvent.click(screen.getByRole("button", { name: "Thêm công đoạn" }));
    fireEvent.click(screen.getByRole("button", { name: "Lưu nhóm công đoạn" }));

    await waitFor(() => {
      expect(mocks.create.mutateAsync).toHaveBeenCalledWith({
        groupCode: "NC-MAY",
        groupName: "Nhóm may",
        description: null,
        items: [{ stageId: stage.id, orderIndex: 0 }],
      });
    });
  });

  it("loads detail before editing and omits the immutable group code", async () => {
    mocks.update.mutateAsync.mockResolvedValue(detail);
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Sửa" }));
    expect(mocks.useStageGroup).toHaveBeenLastCalledWith(summary.id);
    fireEvent.change(screen.getByLabelText("Tên nhóm công đoạn"), {
      target: { value: "Nhóm may chính" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu nhóm công đoạn" }));

    await waitFor(() => {
      expect(mocks.update.mutateAsync).toHaveBeenCalledWith({
        id: summary.id,
        input: {
          groupName: "Nhóm may chính",
          description: null,
          items: [{ stageId: stage.id, orderIndex: 0 }],
        },
      });
    });
  });

  it("changes status through the dedicated mutation", async () => {
    mocks.updateStatus.mutateAsync.mockResolvedValue({ ...detail, status: "inactive" });
    renderPage();

    fireEvent.click(screen.getByTitle("Đang sử dụng (Bấm để tắt)"));

    await waitFor(() => {
      expect(mocks.updateStatus.mutateAsync).toHaveBeenCalledWith({
        id: summary.id,
        status: "inactive",
      });
    });
  });
});
