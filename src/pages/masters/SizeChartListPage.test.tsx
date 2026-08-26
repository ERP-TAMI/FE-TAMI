import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SizeChartListPage from "./SizeChartListPage";

const hooks = vi.hoisted(() => ({
  useSizeCharts: vi.fn(),
  create: { isPending: false, error: null as Error | null, mutateAsync: vi.fn(), reset: vi.fn() },
  update: { isPending: false, error: null as Error | null, mutateAsync: vi.fn(), reset: vi.fn() },
  updateStatus: { isPending: false, variables: undefined, mutateAsync: vi.fn() },
}));

vi.mock("@/hooks/useSizeCharts", () => ({
  useSizeCharts: hooks.useSizeCharts,
  useCreateSizeChart: () => hooks.create,
  useUpdateSizeChart: () => hooks.update,
  useUpdateSizeChartStatus: () => hooks.updateStatus,
}));

const sizeCharts = [
  {
    id: "f4ab3c98-2941-42e9-a92a-1e90f6087fd0",
    name: "Áo sơ mi nam",
    sizes: ["XS", "S", "M", "L"],
    status: "active" as const,
    createdAt: "2026-08-26T00:00:00.000Z",
    updatedAt: "2026-08-26T00:00:00.000Z",
  },
  {
    id: "c42ec89d-2cf3-49fb-80fc-1407b74eef04",
    name: "Quần trẻ em",
    sizes: ["2Y", "4Y", "6Y"],
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

function renderPage(initialEntries = ["/masters/size-charts"]) {
  vi.stubGlobal("Request", RouterTestRequest);
  const router = createMemoryRouter(
    [
      { path: "/masters/size-charts", element: <SizeChartListPage /> },
      { path: "/dashboard", element: <h1>Dashboard target</h1> },
    ],
    { initialEntries, initialIndex: initialEntries.length - 1 },
  );
  return { router, ...render(<RouterProvider router={router} />) };
}

describe("SizeChartListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.create.error = null;
    hooks.update.error = null;
    hooks.useSizeCharts.mockReturnValue({
      isLoading: false,
      isError: false,
      data: sizeCharts,
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
    hooks.useSizeCharts.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
      error: null,
      refetch,
    });
    const { unmount } = renderPage();
    expect(screen.getByLabelText("Đang tải danh sách bảng Size")).toBeTruthy();
    unmount();

    hooks.useSizeCharts.mockReturnValue({
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

  it("searches by chart name or size and filters by status", () => {
    renderPage();

    fireEvent.change(screen.getByLabelText("Tìm kiếm bảng Size"), {
      target: { value: "4y" },
    });
    expect(screen.getByText("Quần trẻ em")).toBeTruthy();
    expect(screen.queryByText("Áo sơ mi nam")).toBeNull();

    fireEvent.change(screen.getByLabelText("Tìm kiếm bảng Size"), { target: { value: "" } });
    const filters = screen.getByRole("group", { name: "Lọc theo trạng thái" });
    fireEvent.click(within(filters).getByRole("button", { name: "Đang sử dụng" }));
    expect(screen.getByText("Áo sơ mi nam")).toBeTruthy();
    expect(screen.queryByText("Quần trẻ em")).toBeNull();
  });

  it("creates a normalized size chart from the list screen", async () => {
    hooks.create.mutateAsync.mockResolvedValue(sizeCharts[0]);
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Tạo bảng Size" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Tên bảng Size"), {
      target: { value: "Áo thun" },
    });
    fireEvent.change(within(dialog).getByLabelText("Danh sách Size"), {
      target: { value: "S, M, L" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Tạo bảng Size" }));

    await waitFor(() => {
      expect(hooks.create.mutateAsync).toHaveBeenCalledWith({
        name: "Áo thun",
        sizes: ["S", "M", "L"],
      });
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("confirms before deactivating and activates directly", async () => {
    hooks.updateStatus.mutateAsync.mockResolvedValue({ ...sizeCharts[0], status: "inactive" });
    renderPage();

    fireEvent.click(screen.getByRole("switch", { name: "Tắt Áo sơ mi nam" }));
    expect(hooks.updateStatus.mutateAsync).not.toHaveBeenCalled();
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Tắt bảng Size" }),
    );
    await waitFor(() => {
      expect(hooks.updateStatus.mutateAsync).toHaveBeenCalledWith({
        id: sizeCharts[0].id,
        status: "inactive",
      });
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    hooks.updateStatus.mutateAsync.mockClear();
    fireEvent.click(screen.getByRole("switch", { name: "Bật Quần trẻ em" }));
    await waitFor(() => {
      expect(hooks.updateStatus.mutateAsync).toHaveBeenCalledWith({
        id: sizeCharts[1].id,
        status: "active",
      });
    });
  });

  it("has no hard-delete action", () => {
    renderPage();
    expect(screen.queryByRole("button", { name: /xóa/i })).toBeNull();
  });

  it("blocks SPA navigation while the form is dirty", async () => {
    const { router } = renderPage(["/dashboard", "/masters/size-charts"]);
    fireEvent.click(screen.getByRole("button", { name: "Tạo bảng Size" }));
    fireEvent.change(screen.getByLabelText("Tên bảng Size"), {
      target: { value: "Bảng đang nhập" },
    });

    await act(() => router.navigate("/dashboard"));
    expect(router.state.location.pathname).toBe("/masters/size-charts");
    expect(screen.getByRole("heading", { name: "Hủy các thay đổi?" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục chỉnh sửa" }));
    expect(screen.getByDisplayValue("Bảng đang nhập")).toBeTruthy();

    await act(() => router.navigate("/dashboard"));
    fireEvent.click(screen.getByRole("button", { name: "Bỏ thay đổi" }));
    expect(await screen.findByRole("heading", { name: "Dashboard target" })).toBeTruthy();
  });
});
