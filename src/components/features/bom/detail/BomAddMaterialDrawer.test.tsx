import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BomAddMaterialDrawer } from "./BomAddMaterialDrawer";

const mocks = vi.hoisted(() => ({
  useMaterials: vi.fn(),
  useMaterialGroups: vi.fn(),
}));

vi.mock("@/hooks/useMaterials", () => ({
  useMaterials: (...args: unknown[]) => mocks.useMaterials(...args),
}));
vi.mock("@/hooks/useMaterialGroups", () => ({
  useMaterialGroups: () => mocks.useMaterialGroups(),
}));

const material = (id: string, code: string, name: string) => ({
  id,
  materialCode: code,
  materialName: name,
  materialGroupId: "g1",
  materialGroupName: "Vải chính",
  defaultUnitId: null,
  defaultUnitName: "Mét",
  defaultYieldPct: "0",
  status: "active",
  createdAt: "",
  updatedAt: "",
});

describe("BomAddMaterialDrawer", () => {
  beforeEach(() => {
    mocks.useMaterials.mockReturnValue({
      data: {
        data: [material("m1", "VAI-1", "Vải một"), material("m2", "VAI-2", "Vải hai")],
        meta: { total: 2, page: 1, limit: 50, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mocks.useMaterialGroups.mockReturnValue({
      data: { data: [{ id: "g1", name: "Vải chính", status: "active" }] },
    });
  });

  afterEach(() => cleanup());

  it("hides materials that are already in the table so they cannot be picked twice", () => {
    render(
      <BomAddMaterialDrawer
        isOpen
        onClose={vi.fn()}
        existingMaterialIds={new Set(["m1"])}
        onAdd={vi.fn()}
      />,
    );
    expect(screen.queryByText("Vải một")).toBeNull();
    expect(screen.getByText("Vải hai")).toBeTruthy();
  });

  it("says so when every matching material is already in the table", () => {
    render(
      <BomAddMaterialDrawer
        isOpen
        onClose={vi.fn()}
        existingMaterialIds={new Set(["m1", "m2"])}
        onAdd={vi.fn()}
      />,
    );
    expect(screen.getByText("Mọi vật tư phù hợp đều đã có trong bảng")).toBeTruthy();
  });

  it("hands the picked materials back to the draft and closes, without any request", () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(
      <BomAddMaterialDrawer
        isOpen
        onClose={onClose}
        existingMaterialIds={new Set()}
        onAdd={onAdd}
      />,
    );

    fireEvent.click(screen.getByLabelText("Chọn Vải một"));
    fireEvent.click(screen.getByLabelText("Chọn Vải hai"));
    fireEvent.click(screen.getByRole("button", { name: "Thêm 2 vật tư" }));

    expect(onAdd).toHaveBeenCalledWith([
      expect.objectContaining({ id: "m1", materialCode: "VAI-1", defaultUnitName: "Mét" }),
      expect.objectContaining({ id: "m2", materialCode: "VAI-2" }),
    ]);
    expect(onClose).toHaveBeenCalled();
  });

  it("keeps the 'add' button disabled until something is selected", () => {
    render(
      <BomAddMaterialDrawer
        isOpen
        onClose={vi.fn()}
        existingMaterialIds={new Set()}
        onAdd={vi.fn()}
      />,
    );
    expect(
      (screen.getByRole("button", { name: "Thêm vật tư" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("asks before closing the drawer when materials are selected", () => {
    const onClose = vi.fn();
    const { container } = render(
      <BomAddMaterialDrawer
        isOpen
        onClose={onClose}
        existingMaterialIds={new Set()}
        onAdd={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByLabelText("Chọn Vải một"));
    fireEvent.click(container.firstElementChild as HTMLElement);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText("Bạn có thay đổi chưa được lưu")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Bỏ thay đổi" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("only asks the server for active materials and filters by the chosen group", () => {
    render(
      <BomAddMaterialDrawer
        isOpen
        onClose={vi.fn()}
        existingMaterialIds={new Set()}
        onAdd={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByDisplayValue("Tất cả nhóm"), { target: { value: "g1" } });

    const lastCall = mocks.useMaterials.mock.calls.at(-1)!;
    expect(lastCall[0]).toMatchObject({ status: "active", materialGroupId: "g1", limit: 50 });
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <BomAddMaterialDrawer
        isOpen={false}
        onClose={vi.fn()}
        existingMaterialIds={new Set()}
        onAdd={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});
