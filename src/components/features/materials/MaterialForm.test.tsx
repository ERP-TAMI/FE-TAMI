import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MaterialForm } from "./MaterialForm";
import { unitApi } from "@/api/unit.api";
import type { Material } from "@/types/material";

vi.mock("@/api/unit.api", () => ({
  unitApi: { list: vi.fn(), create: vi.fn() },
}));

const groups = [
  { id: "c8404d89-315f-49e9-bf81-b05f0f410c4a", name: "Vải chính", status: "active" as const },
];
const units = [
  {
    id: "0a989bfe-fb34-489c-b5fe-30f74a1dc09d",
    name: "Mét",
    status: "active" as const,
  },
];
const material: Material = {
  id: "42ee8a8f-23ff-4a65-9a7f-2ee535cab17f",
  materialCode: "FAB-001",
  materialName: "Vải chính",
  materialGroupId: groups[0].id,
  materialGroupName: groups[0].name,
  defaultUnitId: units[0].id,
  defaultUnitName: units[0].name,
  defaultYieldPct: "2.5000",
  status: "active",
  createdAt: "2026-08-23T00:00:00.000Z",
  updatedAt: "2026-08-23T00:00:00.000Z",
};

function renderForm(props: Partial<Parameters<typeof MaterialForm>[0]> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MaterialForm
        mode="create"
        materialGroups={groups}
        units={units}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        {...props}
      />
    </QueryClientProvider>,
  );
}

describe("MaterialForm", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("requires code, name, and an explicit unit before submitting", async () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    fireEvent.click(screen.getByRole("button", { name: "Lưu vật tư" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText("Mã vật tư là bắt buộc")).toBeTruthy();
    expect(screen.getByText("Tên vật tư là bắt buộc")).toBeTruthy();
    expect(screen.getByText("Đơn vị tính là bắt buộc")).toBeTruthy();
  });

  it("toggles the material code between locked and editable states", () => {
    renderForm({ mode: "edit", material });

    const codeInput = screen.getByLabelText("Mã vật tư") as HTMLInputElement;

    expect(codeInput.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Mở khóa mã vật tư" }));

    expect(codeInput.disabled).toBe(false);
    expect(document.activeElement).toBe(codeInput);
    expect(screen.getByRole("button", { name: "Khóa mã vật tư" })).toBeTruthy();
    expect(screen.getByText("Mã vật tư đang mở khóa và có thể chỉnh sửa.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Khóa mã vật tư" }));
    expect(codeInput.disabled).toBe(true);
  });

  it("does not pre-select a unit when creating a new material", () => {
    renderForm();

    expect(screen.getByLabelText("Đơn vị tính")).toHaveProperty("value", "");
  });

  it("labels the empty material group option as an unassigned group", () => {
    renderForm();

    expect(
      within(screen.getByLabelText("Nhóm vật tư")).getByRole("option", {
        name: "Không thuộc nhóm",
      }),
    ).toBeTruthy();
  });

  it("lists groups and units alphabetically by name", () => {
    renderForm({
      materialGroups: [
        { id: "1", name: "Vải lót", status: "active" as const },
        { id: "2", name: "Chỉ", status: "active" as const },
      ],
      units: [
        { id: "u1", name: "Mét", status: "active" as const },
        { id: "u2", name: "Cái", status: "active" as const },
      ],
    });

    const groupLabels = within(screen.getByLabelText("Nhóm vật tư"))
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(groupLabels).toEqual(["Không thuộc nhóm", "Chỉ", "Vải lót"]);

    const unitLabels = within(screen.getByLabelText("Đơn vị tính"))
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(unitLabels).toEqual(["Chọn đơn vị tính", "Cái", "Mét"]);
  });

  it("uses the shared confirmation dialog before discarding unsaved changes", () => {
    const onClose = vi.fn();
    renderForm({ onClose });

    fireEvent.change(screen.getByLabelText("Tên vật tư"), { target: { value: "Vải chính" } });
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Hủy các thay đổi?" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tiếp tục chỉnh sửa" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Bỏ thay đổi" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục chỉnh sửa" }));
    expect(screen.queryByRole("heading", { name: "Hủy các thay đổi?" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Tạo vật tư" })).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
    fireEvent.click(screen.getByRole("button", { name: "Bỏ thay đổi" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("submits trimmed text, chosen group/unit, and exact decimal strings on create", async () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    fireEvent.change(screen.getByLabelText("Mã vật tư"), { target: { value: " fab-001 " } });
    fireEvent.change(screen.getByLabelText("Tên vật tư"), { target: { value: " Vải chính " } });
    fireEvent.change(screen.getByLabelText("Nhóm vật tư"), { target: { value: groups[0].id } });
    fireEvent.change(screen.getByLabelText("Đơn vị tính"), { target: { value: units[0].id } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu vật tư" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        materialCode: "FAB-001",
        materialName: "Vải chính",
        materialGroupId: groups[0].id,
        defaultUnitId: units[0].id,
        defaultYieldPct: "0",
      });
    });
  });

  it("rejects negative numeric values", async () => {
    renderForm();

    fireEvent.change(screen.getByLabelText("Mã vật tư"), { target: { value: "FAB-001" } });
    fireEvent.change(screen.getByLabelText("Tên vật tư"), { target: { value: "Vải" } });
    fireEvent.change(screen.getByLabelText("Yield (%)"), { target: { value: "-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu vật tư" }));

    expect(
      await screen.findByText("Yield phải là số không âm, tối đa 4 chữ số thập phân"),
    ).toBeTruthy();
  });

  it("only submits the fields the user actually changed when editing", async () => {
    const onSubmit = vi.fn();
    renderForm({ mode: "edit", material, onSubmit });

    fireEvent.change(screen.getByLabelText("Tên vật tư"), {
      target: { value: "Vải chính (đổi tên)" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu vật tư" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ materialName: "Vải chính (đổi tên)" });
    });
  });

  it("submits a normalized material code after unlocking it", async () => {
    const onSubmit = vi.fn();
    renderForm({ mode: "edit", material, onSubmit });

    fireEvent.click(screen.getByRole("button", { name: "Mở khóa mã vật tư" }));
    fireEvent.change(screen.getByLabelText("Mã vật tư"), {
      target: { value: " fab-002 " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu vật tư" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ materialCode: "FAB-002" });
    });
  });

  it("lets the user create a new unit inline and auto-selects it", async () => {
    vi.mocked(unitApi.create).mockResolvedValue({
      id: "new-unit-id",
      name: "Cuộn",
      status: "active",
    });
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "+ Thêm đơn vị tính mới" }));
    fireEvent.change(screen.getByLabelText("Tên đơn vị"), { target: { value: "Cuộn" } });
    fireEvent.click(screen.getByRole("button", { name: "Tạo đơn vị" }));

    await waitFor(() => {
      expect(unitApi.create).toHaveBeenCalledWith({ name: "Cuộn" });
    });
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Thêm đơn vị tính mới" })).toBeNull();
    });
  });
});
