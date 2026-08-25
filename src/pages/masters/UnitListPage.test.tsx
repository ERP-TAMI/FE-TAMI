import { BrowserRouter } from "react-router-dom";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import UnitListPage from "./UnitListPage";

const hooks = vi.hoisted(() => ({
  useUnits: vi.fn(),
  create: { isPending: false, error: null, mutateAsync: vi.fn(), reset: vi.fn() },
  update: { isPending: false, error: null, mutateAsync: vi.fn(), reset: vi.fn() },
  updateStatus: { isPending: false, error: null, mutateAsync: vi.fn() },
  remove: { isPending: false, error: null, mutateAsync: vi.fn() },
}));

vi.mock("@/hooks/useMaterials", () => ({
  useUnits: hooks.useUnits,
  useCreateUnit: () => hooks.create,
  useUpdateUnit: () => hooks.update,
  useUpdateUnitStatus: () => hooks.updateStatus,
  useDeleteUnit: () => hooks.remove,
}));

const unit = {
  id: "41fc8e1b-0441-463b-af3f-edf74592084d",
  name: "Mét",
  status: "active" as const,
};

function renderPage() {
  return render(
    <BrowserRouter>
      <UnitListPage />
    </BrowserRouter>,
  );
}

describe("UnitListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it("renders the loading state", () => {
    hooks.useUnits.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByLabelText("Đang tải danh sách đơn vị tính")).toBeTruthy();
  });

  it("renders an API error and retries on request", () => {
    const refetch = vi.fn();
    hooks.useUnits.mockReturnValue({
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
    hooks.useUnits.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText("Không tìm thấy đơn vị tính phù hợp.")).toBeTruthy();
  });

  it("creates a unit from the list screen", async () => {
    hooks.create.mutateAsync.mockResolvedValue({ ...unit, name: "Cuộn" });
    hooks.useUnits.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
      error: null,
      refetch: vi.fn(),
    });

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Tạo đơn vị tính mới" }));
    fireEvent.change(screen.getByLabelText("Tên đơn vị"), { target: { value: "Cuộn" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu đơn vị tính" }));

    await waitFor(() => {
      expect(hooks.create.mutateAsync).toHaveBeenCalledWith({
        name: "Cuộn",
      });
    });
  });

  it("edits a unit from the list screen", async () => {
    hooks.update.mutateAsync.mockResolvedValue({ ...unit, name: "Mét vải" });
    hooks.useUnits.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [unit],
      error: null,
      refetch: vi.fn(),
    });

    renderPage();
    fireEvent.click(within(screen.getByRole("table")).getByRole("button", { name: "Sửa" }));
    fireEvent.change(screen.getByLabelText("Tên đơn vị"), { target: { value: "Mét vải" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu đơn vị tính" }));

    await waitFor(() => {
      expect(hooks.update.mutateAsync).toHaveBeenCalledWith({
        id: unit.id,
        input: { name: "Mét vải" },
      });
    });
  });

  it("deactivates a unit without a confirmation dialog", async () => {
    hooks.updateStatus.mutateAsync.mockResolvedValue({ ...unit, status: "inactive" });
    hooks.useUnits.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [unit],
      error: null,
      refetch: vi.fn(),
    });

    renderPage();
    fireEvent.click(screen.getByTitle("Đang sử dụng (Bấm để tắt)"));

    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => {
      expect(hooks.updateStatus.mutateAsync).toHaveBeenCalledWith({
        id: unit.id,
        status: "inactive",
      });
    });
  });

  it("deletes a unit only after confirmation", async () => {
    hooks.remove.mutateAsync.mockResolvedValue(undefined);
    hooks.useUnits.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [unit],
      error: null,
      refetch: vi.fn(),
    });

    renderPage();
    fireEvent.click(within(screen.getByRole("table")).getByRole("button", { name: "Xóa" }));

    expect(hooks.remove.mutateAsync).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Xóa" }));

    await waitFor(() => {
      expect(hooks.remove.mutateAsync).toHaveBeenCalledWith(unit.id);
    });
  });

  it("resets the create/update mutation state when the form is closed", () => {
    hooks.useUnits.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
      error: null,
      refetch: vi.fn(),
    });

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Tạo đơn vị tính mới" }));
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));

    expect(hooks.create.reset).toHaveBeenCalled();
    expect(hooks.update.reset).toHaveBeenCalled();
  });

  it("searches and filters the unit list", () => {
    hooks.useUnits.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [unit, { ...unit, id: "second-unit", name: "Cuộn", status: "inactive" as const }],
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    fireEvent.change(screen.getByLabelText("Tìm kiếm đơn vị tính"), {
      target: { value: "Cuộn" },
    });
    expect(screen.getByText("Cuộn")).toBeTruthy();
    expect(screen.queryByText("Mét")).toBeNull();

    fireEvent.change(screen.getByLabelText("Tìm kiếm đơn vị tính"), { target: { value: "" } });
    const filterGroup = screen.getByRole("group", { name: "Lọc theo trạng thái" });
    fireEvent.click(within(filterGroup).getByRole("button", { name: "Đã tắt" }));
    expect(screen.getByText("Cuộn")).toBeTruthy();
    expect(screen.queryByText("Mét")).toBeNull();
  });
});
