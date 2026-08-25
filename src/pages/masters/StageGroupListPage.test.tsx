import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StageGroupListPage from "./StageGroupListPage";

const NativeRequest = globalThis.Request;

class RouterTestRequest extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    const { signal: _signal, ...compatibleInit } = init ?? {};
    super(input, compatibleInit);
  }
}

const mocks = vi.hoisted(() => ({
  useStageGroups: vi.fn(),
  useStageGroup: vi.fn(),
  create: { isPending: false, error: null, mutateAsync: vi.fn(), reset: vi.fn() },
  update: { isPending: false, error: null, mutateAsync: vi.fn(), reset: vi.fn() },
  updateStatus: { isPending: false, variables: undefined, mutateAsync: vi.fn() },
  remove: { isPending: false, mutateAsync: vi.fn() },
}));

vi.mock("@/hooks/useStageGroups", () => ({
  useStageGroups: mocks.useStageGroups,
  useStageGroup: mocks.useStageGroup,
  useCreateStageGroup: () => mocks.create,
  useUpdateStageGroup: () => mocks.update,
  useUpdateStageGroupStatus: () => mocks.updateStatus,
  useDeleteStageGroup: () => mocks.remove,
}));

const summary = {
  id: "64bfc097-69d1-43f5-af97-cb0e7428f7df",
  groupCode: "NS-MAY",
  groupName: "Nhóm may",
  description: null,
  status: "active" as const,
  itemCount: 2,
  createdAt: "2026-08-24T01:00:00.000Z",
  updatedAt: "2026-08-24T01:00:00.000Z",
};
const detail = {
  ...summary,
  items: [
    {
      id: "771c0dc2-cd59-44e3-9b16-cacb200f20e5",
      itemName: "May thân",
      description: "May thân áo",
      ssv: "12.500",
      status: "active" as const,
      orderIndex: 0,
    },
    {
      id: "56cda798-0d5b-4ea9-9d95-036fcb6b92d0",
      itemName: "May lưng",
      description: null,
      ssv: "10.000",
      status: "active" as const,
      orderIndex: 1,
    },
  ],
};

function renderPage(initialEntries = ["/masters/stage-groups"]) {
  vi.stubGlobal("Request", RouterTestRequest);
  const router = createMemoryRouter(
    [
      { path: "/masters/stage-groups", element: <StageGroupListPage /> },
      { path: "/dashboard", element: <h1>Dashboard target</h1> },
    ],
    { initialEntries, initialIndex: initialEntries.length - 1 },
  );
  return { router, ...render(<RouterProvider router={router} />) };
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
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("creates a group with a directly entered child operation", async () => {
    mocks.create.mutateAsync.mockResolvedValue(detail);
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Tạo nhóm công đoạn" }));
    fireEvent.change(screen.getByLabelText("Mã nhóm công đoạn"), { target: { value: "NS-MAY" } });
    fireEvent.change(screen.getByLabelText("Tên nhóm công đoạn"), {
      target: { value: "Nhóm may" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Thêm công đoạn con" }));
    fireEvent.change(screen.getByLabelText("Tên công đoạn con ở vị trí 1"), {
      target: { value: "May thân" },
    });
    fireEvent.change(screen.getByLabelText("Mô tả công đoạn con ở vị trí 1"), {
      target: { value: "May thân áo" },
    });
    fireEvent.change(screen.getByLabelText("SSV cho May thân"), { target: { value: "12.500" } });
    fireEvent.click(screen.getByRole("button", { name: "Hoàn tất sửa công đoạn May thân" }));
    fireEvent.click(screen.getByRole("button", { name: "Tạo Nhóm Công Đoạn" }));
    await waitFor(() => {
      expect(mocks.create.mutateAsync).toHaveBeenCalledWith({
        groupCode: "NS-MAY",
        groupName: "Nhóm may",
        description: null,
        items: [
          {
            itemName: "May thân",
            description: "May thân áo",
            ssv: "12.500",
            status: "active",
            orderIndex: 0,
          },
        ],
      });
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("loads detail before editing, retains child IDs and omits immutable group code", async () => {
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
          items: detail.items,
        },
      });
    });
  });

  it("changes group status through its dedicated mutation", async () => {
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

  it("edits an independent child from the expanded row", async () => {
    mocks.update.mutateAsync.mockResolvedValue(detail);
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Xem các công đoạn của Nhóm may" }));
    fireEvent.click(screen.getByRole("button", { name: "Sửa công đoạn con May thân" }));
    fireEvent.change(screen.getByLabelText("Tên công đoạn con May thân"), {
      target: { value: "May thân chính" },
    });
    fireEvent.change(screen.getByLabelText("SSV cho May thân"), { target: { value: "15.750" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu công đoạn con May thân" }));
    await waitFor(() => {
      expect(mocks.update.mutateAsync).toHaveBeenCalledWith({
        id: summary.id,
        input: {
          items: [
            { ...detail.items[0], itemName: "May thân chính", ssv: "15.750" },
            detail.items[1],
          ],
        },
      });
    });
  });

  it("edits SSV for every child operation in the selected group at once", async () => {
    mocks.update.mutateAsync.mockResolvedValue(detail);
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Sửa SSV nhóm Nhóm may" }));

    const dialog = screen.getByRole("dialog", { name: "Sửa SSV - Nhóm may" });
    expect(within(dialog).getByDisplayValue("12.500")).toBeTruthy();
    expect(within(dialog).getByDisplayValue("10.000")).toBeTruthy();

    fireEvent.change(within(dialog).getByLabelText("SSV cho công đoạn con May thân"), {
      target: { value: "15.250" },
    });
    fireEvent.change(within(dialog).getByLabelText("SSV cho công đoạn con May lưng"), {
      target: { value: "11.750" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu SSV" }));

    await waitFor(() => {
      expect(mocks.update.mutateAsync).toHaveBeenCalledWith({
        id: summary.id,
        input: {
          items: [
            { ...detail.items[0], ssv: "15.250" },
            { ...detail.items[1], ssv: "11.750" },
          ],
        },
      });
      expect(screen.queryByRole("dialog", { name: "Sửa SSV - Nhóm may" })).toBeNull();
    });
  });

  it("toggles an independent child status through the group update", async () => {
    mocks.update.mutateAsync.mockResolvedValue(detail);
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Xem các công đoạn của Nhóm may" }));
    fireEvent.click(screen.getByRole("switch", { name: "Tắt công đoạn con May thân" }));
    await waitFor(() => {
      expect(mocks.update.mutateAsync).toHaveBeenCalledWith({
        id: summary.id,
        input: { items: [{ ...detail.items[0], status: "inactive" }, detail.items[1]] },
      });
    });
  });

  it("deletes a stage group only after confirmation", async () => {
    mocks.remove.mutateAsync.mockResolvedValue(undefined);
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Xóa" }));
    expect(mocks.remove.mutateAsync).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Xóa" }));
    await waitFor(() => expect(mocks.remove.mutateAsync).toHaveBeenCalledWith(summary.id));
  });

  it("blocks browser back and SPA navigation while the form is dirty", async () => {
    const { router } = renderPage(["/dashboard", "/masters/stage-groups"]);
    fireEvent.click(screen.getByRole("button", { name: "Tạo nhóm công đoạn" }));
    fireEvent.change(screen.getByLabelText("Tên nhóm công đoạn"), {
      target: { value: "Nhóm đang nhập" },
    });
    await act(() => router.navigate(-1));
    expect(router.state.location.pathname).toBe("/masters/stage-groups");
    expect(screen.getByRole("heading", { name: "Hủy các thay đổi?" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục chỉnh sửa" }));
    expect(screen.getByDisplayValue("Nhóm đang nhập")).toBeTruthy();
    await act(() => router.navigate("/dashboard"));
    expect(screen.getByRole("heading", { name: "Hủy các thay đổi?" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Bỏ thay đổi" }));
    expect(await screen.findByRole("heading", { name: "Dashboard target" })).toBeTruthy();
  });
});
