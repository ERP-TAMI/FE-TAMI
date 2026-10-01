import { useCallback, useMemo, useState } from "react";
import type { BomLineItem, SaveBomCostItem, SaveBomLineRow } from "@/types/bom";

export type BomDraftMode = "technical" | "costs";

export interface DraftLine {
  key: string;
  lineId?: string;
  materialId: string | null;
  materialCode: string | null;
  materialName: string;
  materialGroup: string | null;
  unit: string;
  consumption: string;
  unitCost: string;
  note: string;
  isNew: boolean;
  lineCost: number | null;
  originalConsumption: string;
  originalUnitCost: string;
}

export interface DraftMaterial {
  id: string;
  materialCode: string;
  materialName: string;
  materialGroupName?: string | null;
  defaultUnitName?: string | null;
}

export function parseDecimal(raw: string | null | undefined): number | null {
  const text = (raw ?? "").trim().replace(",", ".");
  if (text === "") return null;
  const value = Number(text);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function fromLine(line: BomLineItem): DraftLine {
  const consumption =
    line.consumption && Number(line.consumption) > 0 ? String(line.consumption) : "";
  const unitCost = line.unitCost != null ? String(line.unitCost) : "";
  return {
    key: line.id,
    lineId: line.id,
    materialId: line.materialId,
    materialCode: line.materialCodeSnapshot ?? line.material?.materialCode ?? null,
    materialName: line.materialNameSnapshot,
    materialGroup: line.materialGroupSnapshot,
    unit: line.unitSnapshot,
    consumption,
    unitCost,
    note: line.note ?? "",
    isNew: false,
    lineCost: line.lineCost ?? null,
    originalConsumption: consumption,
    originalUnitCost: unitCost,
  };
}

let tempKeyCounter = 0;

export function useBomLinesDraft(serverLines: BomLineItem[], mode: BomDraftMode) {
  const serverRows = useMemo(() => serverLines.map(fromLine), [serverLines]);
  const [draft, setDraft] = useState<DraftLine[] | null>(null);

  const isEditing = draft !== null;
  const rows = draft ?? serverRows;

  const start = useCallback(() => setDraft(serverRows), [serverRows]);
  const cancel = useCallback(() => setDraft(null), []);
  const commit = useCallback(() => setDraft(null), []);

  const setField = useCallback(
    (key: string, field: "consumption" | "unitCost" | "note", value: string) => {
      setDraft((prev) =>
        prev ? prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)) : prev,
      );
    },
    [],
  );

  const removeRow = useCallback((key: string) => {
    setDraft((prev) => (prev ? prev.filter((row) => row.key !== key) : prev));
  }, []);

  const moveRow = useCallback((key: string, delta: -1 | 1) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const index = prev.findIndex((row) => row.key === key);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const addMaterials = useCallback((materials: DraftMaterial[]) => {
    setDraft((prev) => {
      const base = prev ?? [];
      const present = new Set(base.map((row) => row.materialId));
      const additions = materials
        .filter((material) => !present.has(material.id))
        .map<DraftLine>((material) => {
          tempKeyCounter += 1;
          return {
            key: `new-${tempKeyCounter}`,
            materialId: material.id,
            materialCode: material.materialCode,
            materialName: material.materialName,
            materialGroup: material.materialGroupName ?? null,
            unit: material.defaultUnitName ?? "",
            consumption: "",
            unitCost: "",
            note: "",
            isNew: true,
            lineCost: null,
            originalConsumption: "",
            originalUnitCost: "",
          };
        });
      return [...base, ...additions];
    });
  }, []);

  const existingMaterialIds = useMemo(
    () => new Set(rows.map((row) => row.materialId).filter((id): id is string => Boolean(id))),
    [rows],
  );

  const { isDirty, dirtyCount } = useMemo(() => {
    if (!draft) return { isDirty: false, dirtyCount: 0 };
    const serverByKey = new Map(serverRows.map((row) => [row.key, row]));
    const draftKeys = new Set(draft.map((row) => row.key));
    let count = 0;
    for (const row of draft) {
      const original = serverByKey.get(row.key);
      if (!original) {
        count += 1;
      } else if (
        mode === "costs"
          ? parseDecimal(row.unitCost) !== parseDecimal(original.unitCost)
          : parseDecimal(row.consumption) !== parseDecimal(original.consumption) ||
            row.note.trim() !== original.note.trim()
      ) {
        count += 1;
      }
    }
    for (const original of serverRows) {
      if (!draftKeys.has(original.key)) count += 1;
    }
    const keptDraftOrder = draft.filter((row) => serverByKey.has(row.key)).map((row) => row.key);
    const keptServerOrder = serverRows
      .filter((row) => draftKeys.has(row.key))
      .map((row) => row.key);
    if (keptDraftOrder.some((key, index) => key !== keptServerOrder[index])) count += 1;
    return { isDirty: count > 0, dirtyCount: count };
  }, [draft, serverRows, mode]);

  const buildLinesPayload = useCallback((): SaveBomLineRow[] => {
    return rows.map((row) => ({
      lineId: row.lineId,
      materialId: row.isNew ? (row.materialId ?? undefined) : undefined,
      consumption: parseDecimal(row.consumption) ?? 0,
      note: row.note.trim() ? row.note.trim() : null,
    }));
  }, [rows]);

  const buildCostsPayload = useCallback((): SaveBomCostItem[] => {
    const serverByKey = new Map(serverRows.map((row) => [row.key, row]));
    return rows.flatMap((row) => {
      const original = serverByKey.get(row.key);
      if (!original || !row.lineId) return [];
      const next = parseDecimal(row.unitCost);
      if (next === parseDecimal(original.unitCost)) return [];
      return [
        { lineId: row.lineId, unitCost: next === null ? null : Math.round(next * 10000) / 10000 },
      ];
    });
  }, [rows, serverRows]);

  return {
    rows,
    isEditing,
    isDirty,
    dirtyCount,
    start,
    cancel,
    commit,
    setField,
    removeRow,
    moveRow,
    addMaterials,
    existingMaterialIds,
    buildLinesPayload,
    buildCostsPayload,
  };
}
