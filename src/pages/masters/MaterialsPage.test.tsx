import { BrowserRouter } from "react-router-dom";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MaterialsPage from "./MaterialsPage";

const hooks = vi.hoisted(() => ({
  useMaterials: vi.fn(),
  useMaterialGroups: vi.fn(),
  useActiveUnits: vi.fn(),
  create: { isPending: false, error: null, mutateAsync: vi.fn(), reset: vi.fn() },
  update: { isPending: false, error: null, mutateAsync: vi.fn(), reset: vi.fn() },
  updateStatus: { isPending: false, error: null, mutateAsync: vi.fn() },
  remove: { isPending: false, error: null, mutateAsync: vi.fn() },
  createUnit: { isPending: false, error: null, mutateAsync: vi.fn() },
}));

vi.mock("@/hooks/useMaterials", () => ({
  useMaterials: hooks.useMaterials,
  useActiveUnits: hooks.useActiveUnits,
  useCreateMaterial: () => hooks.create,
  useUpdateMaterial: () => hooks.update,
  useUpdateMaterialStatus: () => hooks.updateStatus,
  useDeleteMaterial: () => hooks.remove,
  useCreateUnit: () => hooks.createUnit,
}));

vi.mock("@/hooks/useMaterialGroups", () => ({
  useMaterialGroups: hooks.useMaterialGroups,
}));

const material = {
  id: "42ee8a8f-23ff-4a65-9a7f-2ee535cab17f",
  materialCode: "FAB-001",
  materialName: "Vải chính",
  materialGroupId: null,
  materialGroupName: null,
  defaultUnitId: "0a989bfe-fb34-489c-b5fe-30f74a1dc09d",
  defaultUnitName: "Mét",
  defaultYieldPct: "2.5000",
  status: "active" as const,
  createdAt: "2026-08-23T00:00:00.000Z",
  updatedAt: "2026-08-23T00:00:00.000Z",
};

const activeGroup = {
  id: "c8404d89-315f-49e9-bf81-b05f0f410c4a",
  name: "Vải chính",
  status: "active" as const,
};
const inactiveGroup = {
  id: "a6f68dde-e16c-48d9-897d-12da46138288",
  name: "Nhóm lịch sử",
  status: "inactive" as const,
};

function renderPage() {
  return render(
    <BrowserRouter>
      <MaterialsPage />
    </BrowserRouter>,
  );
}

describe("MaterialsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.useMaterials.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [material],
      error: null,
      refetch: vi.fn(),
    });
    hooks.useMaterialGroups.mockImplementation((status?: string) => ({
      data: status === "active" ? [activeGroup] : [activeGroup, inactiveGroup],
    }));
    hooks.useActiveUnits.mockReturnValue({
      data: [
        {
          id: material.defaultUnitId,
          name: "Mét",
          status: "active",
        },
      ],
    });
  });

  afterEach(cleanup);

  it("sends search, group, and status filters to the list query", () => {
    renderPage();

    fireEvent.change(screen.getByLabelText("Tìm kiếm vật tư"), { target: { value: "FAB" } });
    fireEvent.change(screen.getByLabelText("Lọc theo nhóm vật tư"), {
      target: { value: inactiveGroup.id },
    });
    fireEvent.click(
      within(screen.getByRole("group", { name: "Lọc theo trạng thái" })).getByRole("button", {
        name: "Đang sử dụng",
      }),
    );

    expect(hooks.useMaterials).toHaveBeenLastCalledWith({
      search: "FAB",
      materialGroupId: inactiveGroup.id,
      status: "active",
    });
  });

  it("creates a material from the list screen", async () => {
    hooks.create.mutateAsync.mockResolvedValue(material);
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Tạo vật tư mới" }));
    expect(
      within(screen.getByLabelText("Nhóm vật tư")).queryByRole("option", {
        name: inactiveGroup.name,
      }),
    ).toBeNull();
    fireEvent.change(screen.getByLabelText("Nhóm vật tư"), { target: { value: activeGroup.id } });
    fireEvent.change(screen.getByLabelText("Đơn vị tính"), {
      target: { value: material.defaultUnitId },
    });
    fireEvent.change(screen.getByLabelText("Mã vật tư"), { target: { value: "FAB-002" } });
    fireEvent.change(screen.getByLabelText("Tên vật tư"), { target: { value: "Vải lót" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu vật tư" }));

    await waitFor(() => expect(hooks.create.mutateAsync).toHaveBeenCalled());
  });

  it("changes status only after confirmation", async () => {
    hooks.updateStatus.mutateAsync.mockResolvedValue({ ...material, status: "inactive" });
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Khóa" }));
    expect(hooks.updateStatus.mutateAsync).not.toHaveBeenCalled();
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Vô hiệu hóa" }),
    );

    await waitFor(() => {
      expect(hooks.updateStatus.mutateAsync).toHaveBeenCalledWith({
        id: material.id,
        status: "inactive",
      });
    });
  });

  it("opens detail and continues into the edit flow, sending only the changed field", async () => {
    hooks.update.mutateAsync.mockResolvedValue({ ...material, materialName: "Vải cập nhật" });
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: material.materialCode }));
    expect(screen.getByRole("heading", { name: "Chi tiết vật tư" })).toBeTruthy();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Chỉnh sửa" }));
    expect(screen.getByRole("heading", { name: "Chỉnh sửa vật tư" })).toBeTruthy();
    expect(screen.getByLabelText("Mã vật tư").hasAttribute("disabled")).toBe(true);

    fireEvent.change(screen.getByLabelText("Tên vật tư"), {
      target: { value: "Vải cập nhật" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu vật tư" }));

    await waitFor(() => {
      expect(hooks.update.mutateAsync).toHaveBeenCalledWith({
        id: material.id,
        input: { materialName: "Vải cập nhật" },
      });
    });
  });

  it("resets the create/update mutation state when the form is closed", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Tạo vật tư mới" }));
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));

    expect(hooks.create.reset).toHaveBeenCalled();
    expect(hooks.update.reset).toHaveBeenCalled();
  });

  it("deletes an unreferenced material only after confirmation", async () => {
    hooks.remove.mutateAsync.mockResolvedValue(undefined);
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Xóa" }));
    expect(hooks.remove.mutateAsync).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Xóa" }));

    await waitFor(() => {
      expect(hooks.remove.mutateAsync).toHaveBeenCalledWith(material.id);
    });
  });
});
