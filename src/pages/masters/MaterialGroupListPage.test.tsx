import { BrowserRouter } from "react-router-dom";
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

vi.mock("@/hooks/useMaterialGroups", () => ({
  useMaterialGroups: hooks.useMaterialGroups,
  useCreateMaterialGroup: () => hooks.create,
  useUpdateMaterialGroup: () => hooks.update,
  useUpdateMaterialGroupStatus: () => hooks.updateStatus,
  useDeleteMaterialGroup: () => hooks.remove,
}));

const materialGroup = {
  id: "e41a0a7d-28b1-4d78-9c26-b017f5c5f890",
  name: "Fabric",
  status: "active" as const,
};

function renderPage() {
  return render(
    <BrowserRouter>
      <MaterialGroupListPage />
    </BrowserRouter>,
  );
}

const emptyMeta = { total: 0, page: 1, limit: 10, totalPages: 1 };

function metaFor(items: unknown[], page = 1) {
  return { total: items.length, page, limit: 10, totalPages: Math.max(1, Math.ceil(items.length / 10)) };
}

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

    renderPage();

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

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));

    expect(screen.getByText(/Không thể kết nối đến máy chủ/)).toBeTruthy();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("renders the empty state", () => {
    hooks.useMaterialGroups.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: [], meta: emptyMeta },
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

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
      data: { data: [], meta: emptyMeta },
      error: null,
      refetch: vi.fn(),
    });

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Tạo nhóm vật tư mới" }));
    fireEvent.change(screen.getByLabelText("Tên nhóm"), { target: { value: "Accessories" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu nhóm vật tư" }));

    await waitFor(() => {
      expect(hooks.create.mutateAsync).toHaveBeenCalledWith({
        name: "Accessories",
      });
    });
  });

  it("warns via native confirm before closing the form on outside click when dirty", () => {
    hooks.useMaterialGroups.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: [], meta: emptyMeta },
      error: null,
      refetch: vi.fn(),
    });

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Tạo nhóm vật tư mới" }));
    fireEvent.change(screen.getByLabelText("Tên nhóm"), { target: { value: "Accessories" } });

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(document.querySelector('[data-modal-backdrop="true"]')!);
    expect(confirmSpy).toHaveBeenCalledWith("Bạn có muốn hủy các thay đổi chưa lưu không?");
    expect(screen.getByRole("heading", { name: "Tạo nhóm vật tư" })).toBeTruthy();

    confirmSpy.mockReturnValue(true);
    fireEvent.click(document.querySelector('[data-modal-backdrop="true"]')!);
    expect(screen.queryByRole("heading", { name: "Tạo nhóm vật tư" })).toBeNull();
    confirmSpy.mockRestore();
  });

  it("edits a material group from the list screen", async () => {
    hooks.update.mutateAsync.mockResolvedValue({
      ...materialGroup,
      name: "Main fabric",
    });
    hooks.useMaterialGroups.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: [materialGroup], meta: metaFor([materialGroup]) },
      error: null,
      refetch: vi.fn(),
    });

    renderPage();
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

  it("opens detail and continues into the edit flow", async () => {
    hooks.update.mutateAsync.mockResolvedValue({ ...materialGroup, name: "Main fabric" });
    hooks.useMaterialGroups.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: [materialGroup], meta: metaFor([materialGroup]) },
      error: null,
      refetch: vi.fn(),
    });

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: materialGroup.name }));
    expect(screen.getByRole("heading", { name: "Chi tiết nhóm vật tư" })).toBeTruthy();
    const detailDialog = within(screen.getByRole("dialog"));
    expect(detailDialog.getByText(materialGroup.name)).toBeTruthy();
    fireEvent.click(detailDialog.getByRole("button", { name: "Chỉnh sửa" }));
    expect(screen.getByRole("heading", { name: "Chỉnh sửa nhóm vật tư" })).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Tên nhóm"), { target: { value: "Main fabric" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu nhóm vật tư" }));

    await waitFor(() => {
      expect(hooks.update.mutateAsync).toHaveBeenCalledWith({
        id: materialGroup.id,
        input: { name: "Main fabric" },
      });
    });
  });

  it("toggles status immediately without a confirmation dialog", async () => {
    hooks.updateStatus.mutateAsync.mockResolvedValue({
      ...materialGroup,
      status: "inactive",
    });
    hooks.useMaterialGroups.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: [materialGroup], meta: metaFor([materialGroup]) },
      error: null,
      refetch: vi.fn(),
    });

    renderPage();
    fireEvent.click(screen.getByTitle("Đang sử dụng (Bấm để tắt)"));

    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => {
      expect(hooks.updateStatus.mutateAsync).toHaveBeenCalledWith({
        id: materialGroup.id,
        status: "inactive",
      });
    });
  });

  it("deletes a group only after confirmation", async () => {
    hooks.remove.mutateAsync.mockResolvedValue(undefined);
    hooks.useMaterialGroups.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: [materialGroup], meta: metaFor([materialGroup]) },
      error: null,
      refetch: vi.fn(),
    });

    renderPage();
    fireEvent.click(within(screen.getByRole("table")).getByRole("button", { name: "Xóa" }));

    expect(hooks.remove.mutateAsync).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Xóa" }));

    await waitFor(() => {
      expect(hooks.remove.mutateAsync).toHaveBeenCalledWith(materialGroup.id);
    });
  });

  it("sends search text to the backend query", () => {
    hooks.useMaterialGroups.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: [materialGroup], meta: metaFor([materialGroup]) },
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    fireEvent.change(screen.getByLabelText("Tìm kiếm nhóm vật tư"), {
      target: { value: "Phụ" },
    });

    expect(hooks.useMaterialGroups).toHaveBeenLastCalledWith({
      search: "Phụ",
      page: 1,
      limit: 10,
    });
  });

  it("sends the status filter to the backend query", () => {
    hooks.useMaterialGroups.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: [materialGroup], meta: metaFor([materialGroup]) },
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    const filterGroup = screen.getByRole("group", { name: "Lọc theo trạng thái" });
    fireEvent.click(within(filterGroup).getByRole("button", { name: "Đã tắt" }));

    expect(hooks.useMaterialGroups).toHaveBeenLastCalledWith({
      status: "inactive",
      page: 1,
      limit: 10,
    });
  });

  it("paginates the list using backend metadata and resets to page 1 when searching", () => {
    const materialGroups = Array.from({ length: 6 }, (_, index) => ({
      ...materialGroup,
      id: `e41a0a7d-28b1-4d78-9c26-b017f5c5f8${index}`,
      name: `Nhóm vật tư ${index + 1}`,
    }));
    hooks.useMaterialGroups.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: materialGroups, meta: { total: 6, page: 1, limit: 10, totalPages: 1 } },
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText("Hiển thị 1–6 trên 6 nhóm vật tư")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Tìm kiếm nhóm vật tư"), {
      target: { value: "Nhóm vật tư 1" },
    });
    expect(hooks.useMaterialGroups).toHaveBeenLastCalledWith({
      search: "Nhóm vật tư 1",
      page: 1,
      limit: 10,
    });
  });
});
