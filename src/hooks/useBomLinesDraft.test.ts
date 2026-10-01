import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useBomLinesDraft } from "./useBomLinesDraft";
import type { BomLineItem } from "@/types/bom";

const line = (id: string, overrides: Partial<BomLineItem> = {}): BomLineItem => ({
  id,
  revisionId: "rev-1",
  materialId: `mat-${id}`,
  materialNameSnapshot: `Vật tư ${id}`,
  materialGroupId: null,
  materialGroupSnapshot: "Vải chính",
  unitId: null,
  unitSnapshot: "m",
  consumption: 1.5,
  unitCost: null,
  lineCost: null,
  note: null,
  orderIndex: 0,
  createdAt: "2026-09-18T00:00:00.000Z",
  updatedAt: "2026-09-18T00:00:00.000Z",
  ...overrides,
});

const serverLines = [line("a"), line("b", { consumption: 0 }), line("c", { unitCost: 100 })];

describe("useBomLinesDraft", () => {
  it("shows server rows until editing starts and is clean at the start", () => {
    const { result } = renderHook(() => useBomLinesDraft(serverLines, "technical"));
    expect(result.current.isEditing).toBe(false);
    expect(result.current.rows.map((r) => r.key)).toEqual(["a", "b", "c"]);
    expect(result.current.rows[1].consumption).toBe("");

    act(() => result.current.start());
    expect(result.current.isEditing).toBe(true);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.dirtyCount).toBe(0);
  });

  it("counts every kind of change once and clears on cancel", () => {
    const { result } = renderHook(() => useBomLinesDraft(serverLines, "technical"));
    act(() => result.current.start());

    act(() => result.current.setField("a", "consumption", "2"));
    act(() => result.current.setField("b", "note", "ghi chú"));
    act(() => result.current.removeRow("c"));
    act(() =>
      result.current.addMaterials([{ id: "mat-new", materialCode: "N-1", materialName: "Mới" }]),
    );
    expect(result.current.dirtyCount).toBe(4);

    act(() => result.current.cancel());
    expect(result.current.isEditing).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });

  it("treats a reorder as a single change and reverting a field as no change", () => {
    const { result } = renderHook(() => useBomLinesDraft(serverLines, "technical"));
    act(() => result.current.start());

    act(() => result.current.moveRow("a", 1));
    expect(result.current.rows.map((r) => r.key)).toEqual(["b", "a", "c"]);
    expect(result.current.dirtyCount).toBe(1);

    act(() => result.current.moveRow("a", -1));
    expect(result.current.dirtyCount).toBe(0);

    act(() => result.current.setField("a", "consumption", "9"));
    act(() => result.current.setField("a", "consumption", "1.5"));
    expect(result.current.isDirty).toBe(false);
  });

  it("ignores moves past either end", () => {
    const { result } = renderHook(() => useBomLinesDraft(serverLines, "technical"));
    act(() => result.current.start());
    act(() => result.current.moveRow("a", -1));
    act(() => result.current.moveRow("c", 1));
    expect(result.current.rows.map((r) => r.key)).toEqual(["a", "b", "c"]);
  });

  it("does not add a material that is already present and tracks the ids for the picker", () => {
    const { result } = renderHook(() => useBomLinesDraft(serverLines, "technical"));
    act(() => result.current.start());
    act(() =>
      result.current.addMaterials([
        { id: "mat-a", materialCode: "A", materialName: "Đã có" },
        { id: "mat-x", materialCode: "X", materialName: "Mới", defaultUnitName: "Cuộn" },
      ]),
    );
    expect(result.current.rows).toHaveLength(4);
    expect(result.current.existingMaterialIds.has("mat-a")).toBe(true);
    expect(result.current.existingMaterialIds.has("mat-x")).toBe(true);
    expect(result.current.rows[3]).toMatchObject({ isNew: true, unit: "Cuộn" });
  });

  it("builds the full-table payload: existing rows by lineId, new rows by materialId", () => {
    const { result } = renderHook(() => useBomLinesDraft(serverLines, "technical"));
    act(() => result.current.start());
    act(() => result.current.setField("b", "consumption", "2,5"));
    act(() => result.current.setField("a", "note", "  thân trước  "));
    act(() =>
      result.current.addMaterials([{ id: "mat-x", materialCode: "X", materialName: "Mới" }]),
    );

    expect(result.current.buildLinesPayload()).toEqual([
      { lineId: "a", materialId: undefined, consumption: 1.5, note: "thân trước" },
      { lineId: "b", materialId: undefined, consumption: 2.5, note: null },
      { lineId: "c", materialId: undefined, consumption: 1.5, note: null },
      { lineId: undefined, materialId: "mat-x", consumption: 0, note: null },
    ]);
  });

  it("in costs mode only dirty prices are sent, empty means null, values are rounded to 4 dp", () => {
    const { result } = renderHook(() => useBomLinesDraft(serverLines, "costs"));
    act(() => result.current.start());
    act(() => result.current.setField("a", "unitCost", "0.123456"));
    act(() => result.current.setField("c", "unitCost", ""));
    act(() => result.current.setField("b", "unitCost", "0"));

    expect(result.current.dirtyCount).toBe(3);
    expect(result.current.buildCostsPayload()).toEqual([
      { lineId: "a", unitCost: 0.1235 },
      { lineId: "b", unitCost: 0 },
      { lineId: "c", unitCost: null },
    ]);
  });

  it("in costs mode a technical edit does not make the draft dirty", () => {
    const { result } = renderHook(() => useBomLinesDraft(serverLines, "costs"));
    act(() => result.current.start());
    act(() => result.current.setField("a", "consumption", "99"));
    expect(result.current.isDirty).toBe(false);
  });
});
