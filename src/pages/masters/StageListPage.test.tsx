import { BrowserRouter } from "react-router-dom";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StageListPage from "./StageListPage";

const hooks = vi.hoisted(() => ({
  useStages: vi.fn(),
  create: { isPending: false, error: null, mutateAsync: vi.fn() },
  update: { isPending: false, error: null, mutateAsync: vi.fn() },
  updateStatus: { isPending: false, variables: undefined, mutateAsync: vi.fn() },
  updateSsvBulk: { isPending: false, error: null, mutateAsync: vi.fn() },
}));

vi.mock("@/hooks/useStages", () => ({
  useStages: hooks.useStages,
  useCreateStage: () => hooks.create,
  useUpdateStage: () => hooks.update,
  useUpdateStageStatus: () => hooks.updateStatus,
  useUpdateStageSsvBulk: () => hooks.updateSsvBulk,
}));

const stages = [
  {
    id: "64bfc097-69d1-43f5-af97-cb0e7428f7df",
    stageCode: "GD-CAT",
    stageName: "Cắt vải",
    description: "Cắt chi tiết theo sơ đồ",
    ssv: "12.500",
    status: "active" as const,
  },
  {
    id: "771c0dc2-cd59-44e3-9b16-cacb200f20e5",
    stageCode: "GD-MAY",
    stageName: "May thân trước",
    description: null,
    ssv: "8.250",
    status: "inactive" as const,
  },
];

function renderPage() {
  return render(
    <BrowserRouter>
      <StageListPage />
    </BrowserRouter>,
  );
}

describe("StageListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.useStages.mockReturnValue({
      isLoading: false,
      isError: false,
      data: stages,
      error: null,
      refetch: vi.fn(),
    });
  });

  afterEach(cleanup);

  it("renders loading and retryable error states", () => {
    const refetch = vi.fn();
    hooks.useStages.mockReturnValueOnce({
      isLoading: true,
      isError: false,
      data: undefined,
      error: null,
      refetch,
    });
    const { unmount } = renderPage();
    expect(screen.getByLabelText("Đang tải danh sách công đoạn")).toBeTruthy();
    unmount();

    hooks.useStages.mockReturnValueOnce({
      isLoading: false,
      isError: true,
      data: undefined,
      error: new Error("offline"),
      refetch,
    });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("searches by code or name and filters by status", () => {
    renderPage();

    fireEvent.change(screen.getByLabelText("Tìm kiếm công đoạn"), {
      target: { value: "may" },
    });
    expect(screen.getByText("GD-MAY")).toBeTruthy();
    expect(screen.queryByText("GD-CAT")).toBeNull();

    fireEvent.change(screen.getByLabelText("Tìm kiếm công đoạn"), { target: { value: "" } });
    const filters = screen.getByRole("group", { name: "Lọc theo trạng thái" });
    fireEvent.click(within(filters).getByRole("button", { name: "Đang sử dụng" }));
    expect(screen.getByText("GD-CAT")).toBeTruthy();
    expect(screen.queryByText("GD-MAY")).toBeNull();
  });

  it("creates a stage from the list screen", async () => {
    hooks.create.mutateAsync.mockResolvedValue(stages[0]);
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Tạo công đoạn mới" }));
    fireEvent.change(screen.getByLabelText("Mã công đoạn"), { target: { value: "GD-UI" } });
    fireEvent.change(screen.getByLabelText("Tên công đoạn"), {
      target: { value: "Ủi thành phẩm" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu công đoạn" }));

    await waitFor(() => {
      expect(hooks.create.mutateAsync).toHaveBeenCalledWith({
        stageCode: "GD-UI",
        stageName: "Ủi thành phẩm",
        description: null,
        ssv: "0",
      });
    });
  });

  it("edits mutable fields without sending the immutable stage code", async () => {
    hooks.update.mutateAsync.mockResolvedValue({ ...stages[0], stageName: "Cắt laser" });
    renderPage();

    fireEvent.click(screen.getAllByRole("button", { name: "Sửa" })[0]);
    fireEvent.change(screen.getByLabelText("Tên công đoạn"), { target: { value: "Cắt laser" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu công đoạn" }));

    await waitFor(() => {
      expect(hooks.update.mutateAsync).toHaveBeenCalledWith({
        id: stages[0].id,
        input: {
          stageName: "Cắt laser",
          description: "Cắt chi tiết theo sơ đồ",
          ssv: "12.500",
        },
      });
    });
  });

  it("toggles status without a confirmation dialog", async () => {
    hooks.updateStatus.mutateAsync.mockResolvedValue({ ...stages[0], status: "inactive" });
    renderPage();

    fireEvent.click(screen.getByTitle("Đang sử dụng (Bấm để tắt)"));

    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => {
      expect(hooks.updateStatus.mutateAsync).toHaveBeenCalledWith({
        id: stages[0].id,
        status: "inactive",
      });
    });
  });

  it("sends only changed rows when saving SSV in bulk", async () => {
    hooks.updateSsvBulk.mutateAsync.mockResolvedValue([{ ...stages[0], ssv: "13.000" }]);
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Sửa SSV" }));
    fireEvent.change(screen.getByLabelText("SSV cho GD-CAT"), { target: { value: "13.000" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu SSV" }));

    await waitFor(() => {
      expect(hooks.updateSsvBulk.mutateAsync).toHaveBeenCalledWith({
        items: [{ id: stages[0].id, ssv: "13.000" }],
      });
    });
  });

  it("blocks bulk save when an SSV value is invalid", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Sửa SSV" }));
    fireEvent.change(screen.getByLabelText("SSV cho GD-CAT"), { target: { value: "-1" } });

    expect(screen.getByText("SSV không hợp lệ")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Lưu SSV" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(hooks.updateSsvBulk.mutateAsync).not.toHaveBeenCalled();
  });

  it("confirms before discarding changed bulk SSV values", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Sửa SSV" }));
    fireEvent.change(screen.getByLabelText("SSV cho GD-CAT"), { target: { value: "13.000" } });
    fireEvent.click(screen.getByRole("button", { name: "Hủy sửa SSV" }));

    expect(screen.getByRole("heading", { name: "Hủy sửa SSV?" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Bỏ thay đổi" }));
    expect(screen.queryByLabelText("SSV cho GD-CAT")).toBeNull();
    expect(screen.getByRole("button", { name: "Sửa SSV" })).toBeTruthy();
  });

  it("paginates the stage list", () => {
    hooks.useStages.mockReturnValue({
      isLoading: false,
      isError: false,
      data: Array.from({ length: 11 }, (_, index) => ({
        ...stages[0],
        id: `64bfc097-69d1-43f5-af97-cb0e7428f7${String(index).padStart(2, "0")}`,
        stageCode: `GD-${String(index + 1).padStart(2, "0")}`,
      })),
      error: null,
      refetch: vi.fn(),
    });
    renderPage();

    expect(screen.getByText("Hiển thị 1–10 trên 11 công đoạn")).toBeTruthy();
    expect(screen.queryByText("GD-11")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Trang sau" }));
    expect(screen.getByText("GD-11")).toBeTruthy();
  });
});
