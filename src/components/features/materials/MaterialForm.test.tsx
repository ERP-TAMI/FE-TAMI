import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MaterialForm } from "./MaterialForm";

const groups = [
  { id: "c8404d89-315f-49e9-bf81-b05f0f410c4a", name: "Vải chính", status: "active" as const },
];
const units = [
  {
    id: "0a989bfe-fb34-489c-b5fe-30f74a1dc09d",
    code: "M",
    name: "Mét",
    decimalScale: 4,
    status: "active" as const,
  },
];

describe("MaterialForm", () => {
  afterEach(cleanup);

  it("requires code, name, and unit", async () => {
    const onSubmit = vi.fn();
    render(
      <MaterialForm
        mode="create"
        materialGroups={groups}
        units={units}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText("Đơn vị tính"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu vật tư" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText("Mã vật tư là bắt buộc")).toBeTruthy();
    expect(screen.getByText("Tên vật tư là bắt buộc")).toBeTruthy();
    expect(screen.getByText("Đơn vị tính là bắt buộc")).toBeTruthy();
  });

  it("labels the empty material group option as an unassigned group", () => {
    render(
      <MaterialForm
        mode="create"
        materialGroups={groups}
        units={units}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole("option", { name: "Không thuộc nhóm" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Không chọn nhóm" })).toBeNull();
  });

  it("uses the shared confirmation dialog before discarding unsaved changes", () => {
    const onClose = vi.fn();
    render(
      <MaterialForm
        mode="create"
        materialGroups={groups}
        units={units}
        isSubmitting={false}
        onClose={onClose}
        onSubmit={vi.fn()}
      />,
    );

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

  it("submits trimmed text and exact decimal strings", async () => {
    const onSubmit = vi.fn();
    render(
      <MaterialForm
        mode="create"
        materialGroups={groups}
        units={units}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText("Mã vật tư"), { target: { value: " fab-001 " } });
    fireEvent.change(screen.getByLabelText("Tên vật tư"), { target: { value: " Vải chính " } });
    fireEvent.change(screen.getByLabelText("Nhóm vật tư"), { target: { value: groups[0].id } });
    fireEvent.change(screen.getByLabelText("Đơn giá gần nhất"), {
      target: { value: "9007199254740991.01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu vật tư" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        materialCode: "FAB-001",
        materialName: "Vải chính",
        materialGroupId: groups[0].id,
        defaultUnitId: units[0].id,
        defaultYieldPct: "0",
        lastUnitCost: "9007199254740991.01",
        currentStock: "0",
        lowStockThreshold: "10",
      });
    });
  });

  it("rejects negative numeric values", async () => {
    render(
      <MaterialForm
        mode="create"
        materialGroups={groups}
        units={units}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Mã vật tư"), { target: { value: "FAB-001" } });
    fireEvent.change(screen.getByLabelText("Tên vật tư"), { target: { value: "Vải" } });
    fireEvent.change(screen.getByLabelText("Tồn kho hiện tại"), { target: { value: "-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu vật tư" }));

    expect(
      await screen.findByText("Tồn kho phải là số không âm, tối đa 4 chữ số thập phân"),
    ).toBeTruthy();
  });
});
