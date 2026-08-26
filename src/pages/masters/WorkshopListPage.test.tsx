import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WorkshopListPage from "./WorkshopListPage";

const hooks = vi.hoisted(() => ({
  useWorkshops: vi.fn(),
  create: { isPending: false, error: null as Error | null, mutateAsync: vi.fn(), reset: vi.fn() },
  update: { isPending: false, error: null as Error | null, mutateAsync: vi.fn(), reset: vi.fn() },
  updateStatus: { isPending: false, variables: undefined, mutateAsync: vi.fn() },
}));

vi.mock("@/hooks/useWorkshops", () => ({
  useWorkshops: hooks.useWorkshops,
  useCreateWorkshop: () => hooks.create,
  useUpdateWorkshop: () => hooks.update,
  useUpdateWorkshopStatus: () => hooks.updateStatus,
}));

const workshops = [
  {
    id: "f4ab3c98-2941-42e9-a92a-1e90f6087fd0",
    workshopCode: "X-01",
    name: "Xưởng May 1",
    manager: "Nguyễn Văn A",
    location: "Khu A",
    capacity: 500,
    status: "active" as const,
    createdAt: "2026-08-26T00:00:00.000Z",
    updatedAt: "2026-08-26T00:00:00.000Z",
  },
  {
    id: "c42ec89d-2cf3-49fb-80fc-1407b74eef04",
    workshopCode: "X-02",
    name: "Xưởng Cắt",
    manager: "Trần Thị B",
    location: null,
    capacity: 800,
    status: "inactive" as const,
    createdAt: "2026-08-26T00:00:00.000Z",
    updatedAt: "2026-08-26T00:00:00.000Z",
  },
];

const NativeRequest = globalThis.Request;

class RouterTestRequest extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    const { signal: _signal, ...compatibleInit } = init ?? {};
    super(input, compatibleInit);
  }
}

function renderPage(initialEntries = ["/masters/workshops"]) {
  vi.stubGlobal("Request", RouterTestRequest);
  const router = createMemoryRouter(
    [
      { path: "/masters/workshops", element: <WorkshopListPage /> },
      { path: "/dashboard", element: <h1>Dashboard target</h1> },
    ],
    { initialEntries, initialIndex: initialEntries.length - 1 },
  );
  return { router, ...render(<RouterProvider router={router} />) };
}

describe("WorkshopListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.create.error = null;
    hooks.update.error = null;
    hooks.useWorkshops.mockReturnValue({
      isLoading: false,
      isError: false,
      data: workshops,
      error: null,
      refetch: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders loading and retryable error states", () => {
    const refetch = vi.fn();
    hooks.useWorkshops.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
      error: null,
      refetch,
    });
    const { unmount } = renderPage();
    expect(screen.getByLabelText("Đang tải danh sách xưởng sản xuất")).toBeTruthy();
    unmount();

    hooks.useWorkshops.mockReturnValue({
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

  it("searches by code, name or manager and filters by status", () => {
    renderPage();

    fireEvent.change(screen.getByLabelText("Tìm kiếm xưởng sản xuất"), {
      target: { value: "trần" },
    });
    expect(screen.getByText("X-02")).toBeTruthy();
    expect(screen.queryByText("X-01")).toBeNull();

    fireEvent.change(screen.getByLabelText("Tìm kiếm xưởng sản xuất"), {
      target: { value: "" },
    });
    const filters = screen.getByRole("group", { name: "Lọc theo trạng thái" });
    fireEvent.click(within(filters).getByRole("button", { name: "Đang sử dụng" }));
    expect(screen.getByText("X-01")).toBeTruthy();
    expect(screen.queryByText("X-02")).toBeNull();
  });

  it("creates a workshop from the list screen", async () => {
    hooks.create.mutateAsync.mockResolvedValue(workshops[0]);
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Tạo xưởng sản xuất" }));
    fireEvent.change(screen.getByLabelText("Mã xưởng"), { target: { value: "X-09" } });
    fireEvent.change(screen.getByLabelText("Tên xưởng"), {
      target: { value: "Xưởng May Xuất Khẩu" },
    });
    fireEvent.change(screen.getByLabelText("Công suất/ngày"), { target: { value: "550" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu xưởng" }));

    await waitFor(() => {
      expect(hooks.create.mutateAsync).toHaveBeenCalledWith({
        workshopCode: "X-09",
        name: "Xưởng May Xuất Khẩu",
        manager: null,
        location: null,
        capacity: 550,
      });
    });
  });

  it("confirms before deactivating and activates directly", async () => {
    hooks.updateStatus.mutateAsync.mockResolvedValue({ ...workshops[0], status: "inactive" });
    renderPage();

    fireEvent.click(screen.getByRole("switch", { name: "Tắt Xưởng May 1" }));
    expect(hooks.updateStatus.mutateAsync).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Tắt xưởng" }));
    await waitFor(() => {
      expect(hooks.updateStatus.mutateAsync).toHaveBeenCalledWith({
        id: workshops[0].id,
        status: "inactive",
      });
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    hooks.updateStatus.mutateAsync.mockClear();
    fireEvent.click(screen.getByRole("switch", { name: "Bật Xưởng Cắt" }));
    await waitFor(() => {
      expect(hooks.updateStatus.mutateAsync).toHaveBeenCalledWith({
        id: workshops[1].id,
        status: "active",
      });
    });
  });

  it("does not offer a hard-delete action", () => {
    renderPage();
    expect(screen.queryByRole("button", { name: "Xóa" })).toBeNull();
  });

  it("blocks SPA navigation while the workshop form is dirty", async () => {
    const { router } = renderPage(["/dashboard", "/masters/workshops"]);
    fireEvent.click(screen.getByRole("button", { name: "Tạo xưởng sản xuất" }));
    fireEvent.change(screen.getByLabelText("Tên xưởng"), {
      target: { value: "Xưởng đang nhập" },
    });

    await act(() => router.navigate("/dashboard"));
    expect(router.state.location.pathname).toBe("/masters/workshops");
    expect(screen.getByRole("heading", { name: "Hủy các thay đổi?" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục chỉnh sửa" }));
    expect(screen.getByDisplayValue("Xưởng đang nhập")).toBeTruthy();

    await act(() => router.navigate("/dashboard"));
    fireEvent.click(screen.getByRole("button", { name: "Bỏ thay đổi" }));
    expect(await screen.findByRole("heading", { name: "Dashboard target" })).toBeTruthy();
  });

  it("clears stale mutation errors and scopes them to the active form mode", () => {
    hooks.create.error = new Error("create failed");
    renderPage();

    fireEvent.click(screen.getAllByRole("button", { name: "Sửa" })[0]);
    expect(screen.queryByText("create failed")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));

    expect(hooks.create.reset).toHaveBeenCalled();
    expect(hooks.update.reset).toHaveBeenCalled();
  });
});
