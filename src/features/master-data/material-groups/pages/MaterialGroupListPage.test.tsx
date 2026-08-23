import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MaterialGroupListPage from "./MaterialGroupListPage";

const hooks = vi.hoisted(() => ({
  useMaterialGroups: vi.fn(),
  create: { isPending: false, error: null, mutateAsync: vi.fn() },
  update: { isPending: false, error: null, mutateAsync: vi.fn() },
  updateStatus: { isPending: false, error: null, mutateAsync: vi.fn() },
  remove: { isPending: false, error: null, mutateAsync: vi.fn() },
}));

vi.mock("../hooks/useMaterialGroups", () => ({
  useMaterialGroups: hooks.useMaterialGroups,
  useCreateMaterialGroup: () => hooks.create,
  useUpdateMaterialGroup: () => hooks.update,
  useUpdateMaterialGroupStatus: () => hooks.updateStatus,
  useDeleteMaterialGroup: () => hooks.remove,
}));

const materialGroup = {
  id: "e41a0a7d-28b1-4d78-9c26-b017f5c5f890",
  code: "FABRIC",
  name: "Fabric",
  status: "active" as const,
};

describe("MaterialGroupListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it("renders the loading state", () => {
    hooks.useMaterialGroups.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
      error: null,
      refetch: vi.fn(),
    });

    render(<MaterialGroupListPage />);

    expect(screen.getByLabelText("Đang tải danh sách nhóm vật tư")).toBeTruthy();
  });

  it("renders an API error and retries on request", () => {
    const refetch = vi.fn();
    hooks.useMaterialGroups.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      error: new Error("offline"),
      refetch,
    });

    render(<MaterialGroupListPage />);
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));

    expect(screen.getByText(/Không thể kết nối đến máy chủ/)).toBeTruthy();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("renders the empty state", () => {
    hooks.useMaterialGroups.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
      error: null,
      refetch: vi.fn(),
    });

    render(<MaterialGroupListPage />);

    expect(screen.getByText("Không tìm thấy nhóm vật tư phù hợp.")).toBeTruthy();
  });

  it("creates a material group from the list screen", async () => {
    hooks.create.mutateAsync.mockResolvedValue({
      ...materialGroup,
      name: "Accessories",
    });
    hooks.useMaterialGroups.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
      error: null,
      refetch: vi.fn(),
    });

    render(<MaterialGroupListPage />);
    fireEvent.click(screen.getByRole("button", { name: "Tạo nhóm vật tư mới" }));
    fireEvent.change(screen.getByLabelText("Tên nhóm"), { target: { value: "Accessories" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu nhóm vật tư" }));

    await waitFor(() => {
      expect(hooks.create.mutateAsync).toHaveBeenCalledWith({
        name: "Accessories",
      });
    });
  });

  it("edits a material group from the list screen", async () => {
    hooks.update.mutateAsync.mockResolvedValue({
      ...materialGroup,
      name: "Main fabric",
    });
    hooks.useMaterialGroups.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [materialGroup],
      error: null,
      refetch: vi.fn(),
    });

    render(<MaterialGroupListPage />);
    fireEvent.click(screen.getByRole("button", { name: "Sửa" }));
    fireEvent.change(screen.getByLabelText("Tên nhóm"), { target: { value: "Main fabric" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu nhóm vật tư" }));

    await waitFor(() => {
      expect(hooks.update.mutateAsync).toHaveBeenCalledWith({
        id: materialGroup.id,
        input: { name: "Main fabric" },
      });
    });
  });

  it("changes status only after confirmation", async () => {
    hooks.updateStatus.mutateAsync.mockResolvedValue({
      ...materialGroup,
      status: "inactive",
    });
    hooks.useMaterialGroups.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [materialGroup],
      error: null,
      refetch: vi.fn(),
    });

    render(<MaterialGroupListPage />);
    fireEvent.click(
      within(screen.getByRole("table")).getByRole("button", { name: "Ngừng hoạt động" }),
    );

    expect(hooks.updateStatus.mutateAsync).not.toHaveBeenCalled();
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Ngừng hoạt động" }),
    );

    await waitFor(() => {
      expect(hooks.updateStatus.mutateAsync).toHaveBeenCalledWith({
        id: materialGroup.id,
        status: "inactive",
      });
    });
  });

  it("ưu tiên danh sách và tìm kiếm nhóm vật tư theo mã hoặc tên", () => {
    hooks.useMaterialGroups.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [
        materialGroup,
        {
          ...materialGroup,
          id: "24b7062b-24d7-411d-8466-f3f2bbdd735e",
          code: "ACC",
          name: "Phụ liệu",
          status: "inactive",
        },
      ],
      error: null,
      refetch: vi.fn(),
    });

    render(<MaterialGroupListPage />);

    expect(screen.queryByLabelText("Tổng quan nhóm vật tư")).toBeNull();
    expect(screen.getByRole("heading", { name: "Danh sách nhóm vật tư" })).toBeTruthy();
    expect(
      screen.queryByText("Quản lý và sắp xếp các nhóm dùng để phân loại vật tư trong hệ thống."),
    ).toBeNull();
    expect(screen.queryByText("Tìm kiếm, lọc và quản lý các nhóm vật tư hiện có.")).toBeNull();
    expect(screen.queryByRole("group", { name: "Lọc theo trạng thái" })).toBeNull();

    fireEvent.change(screen.getByLabelText("Tìm kiếm nhóm vật tư"), {
      target: { value: "ACC" },
    });

    expect(screen.getByText("Phụ liệu")).toBeTruthy();
    expect(screen.queryByText("Fabric")).toBeNull();
  });

  it("phân trang danh sách và quay lại trang đầu khi tìm kiếm", () => {
    const materialGroups = Array.from({ length: 6 }, (_, index) => ({
      ...materialGroup,
      id: `e41a0a7d-28b1-4d78-9c26-b017f5c5f8${index}`,
      code: `GROUP-${index + 1}`,
      name: `Nhóm vật tư ${index + 1}`,
    }));
    hooks.useMaterialGroups.mockReturnValue({
      isLoading: false,
      isError: false,
      data: materialGroups,
      error: null,
      refetch: vi.fn(),
    });

    render(<MaterialGroupListPage />);

    expect(screen.getByText("Hiển thị 1–5 trên 6 nhóm vật tư")).toBeTruthy();
    expect(screen.queryByText("Nhóm vật tư 6")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Trang sau" }));
    expect(screen.getByText("Nhóm vật tư 6")).toBeTruthy();
    expect(screen.queryByText("Nhóm vật tư 1")).toBeNull();

    fireEvent.change(screen.getByLabelText("Tìm kiếm nhóm vật tư"), {
      target: { value: "GROUP-1" },
    });
    expect(screen.getByText("Nhóm vật tư 1")).toBeTruthy();
    expect(screen.getByText("Hiển thị 1–1 trên 1 nhóm vật tư")).toBeTruthy();
  });
});
