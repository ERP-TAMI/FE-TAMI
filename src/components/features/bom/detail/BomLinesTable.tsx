import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Check,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Save,
} from "lucide-react";
import type { BomLineItem, CreateBomLinePayload, UpdateBomLinePayload } from "@/types/bom";
import {
  canAddBomLine,
  canDeleteBomLine,
  canReorderBomLines,
  canEditBomLines,
  canEditUnitCost,
  canEditTechnicalLines,
  canViewBomCost,
  formatVND,
  formatYield,
} from "@/lib/bomAccess";
import { useAuthStore } from "@/store/authStore";

interface BomLinesTableProps {
  lines: BomLineItem[];
  currentStatus?: string;
  isHistorical?: boolean;
  costPerUnit?: number | null;
  currentOrderQuantity?: number | null;
  currentOrderCost?: number | null;
  onAddLine: () => void;
  onEditLine: (line: BomLineItem) => void;
  onDeleteLine: (line: BomLineItem) => void;
  onReorderLines: (newLineIds: string[]) => void;
  isReordering?: boolean;
  onAddLineInline?: (payload: CreateBomLinePayload) => Promise<void> | void;
  onUpdateLineInline?: (lineId: string, payload: UpdateBomLinePayload) => Promise<void> | void;
  onSaveAllCosts?: (updates: { lineId: string; unitCost: number | null }[]) => Promise<string[]>;
  onDirtyStateChange?: (isDirty: boolean) => void;
  isEditingInModal?: boolean;
}

export function BomLinesTable({
  lines,
  currentStatus = "wait_nvkh",
  isHistorical = false,
  costPerUnit,
  currentOrderQuantity,
  currentOrderCost,
  onAddLine,
  onEditLine,
  onDeleteLine,
  onReorderLines,
  isReordering = false,
  onAddLineInline: _onAddLineInline,
  onUpdateLineInline,
  onSaveAllCosts,
  onDirtyStateChange,
  isEditingInModal = false,
}: BomLinesTableProps) {
  const user = useAuthStore((state) => state.user);

  const canViewCost = canViewBomCost(user);
  const allowAdd = canAddBomLine(user, currentStatus, isHistorical);
  const allowEdit = canEditBomLines(user, currentStatus, isHistorical);
  const allowDelete = canDeleteBomLine(user, currentStatus, isHistorical);
  const allowReorder = canReorderBomLines(user, currentStatus, isHistorical);
  const hasActions = allowEdit || allowDelete;

  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");

  // Inline Row Edit state (consumption/note for Technical, unitCost for Accounting)
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editConsumption, setEditConsumption] = useState("");
  const [editUnitCost, setEditUnitCost] = useState("");
  const [editNote, setEditNote] = useState("");
  const [isSavingInlineEdit, setIsSavingInlineEdit] = useState(false);

  const isAccounting = canEditUnitCost(user, currentStatus, isHistorical);
  const isTechnical = canEditTechnicalLines(user, currentStatus, isHistorical);

  // Local state for accounting price entries to allow quick, smooth inline editing
  const [localCosts, setLocalCosts] = useState<Record<string, string>>({});
  const [initialCosts, setInitialCosts] = useState<Record<string, string>>({});
  const [isSavingCosts, setIsSavingCosts] = useState(false);

  useEffect(() => {
    const serverMap: Record<string, string> = {};
    lines.forEach((l) => {
      if (l.unitCost != null && Number(l.unitCost) >= 0) {
        serverMap[l.id] = String(l.unitCost);
      }
    });
    setInitialCosts(serverMap);
    setLocalCosts((prev) => {
      // Merge with previous state to never discard user input while typing
      const merged: Record<string, string> = { ...serverMap };
      for (const lineId of Object.keys(prev)) {
        if (lines.some((l) => l.id === lineId) && prev[lineId] !== undefined) {
          merged[lineId] = prev[lineId];
        }
      }
      return merged;
    });
  }, [lines]);

  const normalizeDecimalInput = (raw: string): string => {
    let val = raw.replace(/,/g, ".");
    val = val.replace(/[^0-9.]/g, "");
    const parts = val.split(".");
    if (parts.length > 2) {
      val = parts[0] + "." + parts.slice(1).join("");
    }
    if (parts.length === 2 && parts[1].length > 4) {
      val = parts[0] + "." + parts[1].slice(0, 4);
    }
    return val;
  };

  const handleCostChange = (lineId: string, value: string) => {
    const normalized = normalizeDecimalInput(value);
    setLocalCosts((prev) => ({
      ...prev,
      [lineId]: normalized,
    }));
  };

  const dirtyLineIds = useMemo(() => {
    if (!isAccounting) return [];
    return lines
      .filter((line) => {
        const currentRaw = localCosts[line.id]?.trim() ?? "";
        const initialRaw = initialCosts[line.id]?.trim() ?? "";
        if (currentRaw === initialRaw) return false;
        const currentNum = currentRaw === "" ? null : parseFloat(currentRaw);
        const initialNum = initialRaw === "" ? null : parseFloat(initialRaw);
        if (currentNum == null && initialNum == null) return false;
        if (currentNum != null && initialNum != null && currentNum === initialNum) return false;
        return true;
      })
      .map((l) => l.id);
  }, [lines, localCosts, initialCosts, isAccounting]);

  const dirtyCount = dirtyLineIds.length;
  const hasUnsavedCosts = dirtyCount > 0;

  useEffect(() => {
    onDirtyStateChange?.(hasUnsavedCosts);
  }, [hasUnsavedCosts, onDirtyStateChange]);

  const handleSaveAllCosts = async () => {
    if (dirtyLineIds.length === 0) return;
    setIsSavingCosts(true);
    try {
      const updates = dirtyLineIds.map((lineId) => {
        const raw = localCosts[lineId]?.trim().replace(",", ".");
        const parsed = raw === "" || raw == null ? null : parseFloat(raw);
        const finalCost =
          parsed != null && !isNaN(parsed) && parsed >= 0
            ? Math.round(parsed * 10000) / 10000
            : null;
        return { lineId, unitCost: finalCost };
      });

      let failedLineIds: string[] = [];
      if (onSaveAllCosts) {
        failedLineIds = (await onSaveAllCosts(updates)) || [];
      } else if (onUpdateLineInline) {
        for (const { lineId, unitCost } of updates) {
          try {
            await onUpdateLineInline(lineId, { unitCost });
          } catch {
            failedLineIds.push(lineId);
          }
        }
      }

      setInitialCosts((prev) => {
        const next = { ...prev };
        updates.filter(({ lineId }) => !failedLineIds.includes(lineId)).forEach(({ lineId, unitCost }) => {
          if (unitCost != null) {
            next[lineId] = String(unitCost);
          } else {
            delete next[lineId];
          }
        });
        return next;
      });
      onDirtyStateChange?.(failedLineIds.length > 0);
    } finally {
      setIsSavingCosts(false);
    }
  };

  const handleCancelAllCosts = () => {
    setLocalCosts({ ...initialCosts });
    onDirtyStateChange?.(false);
  };

  const startInlineEdit = (line: BomLineItem) => {
    setEditingLineId(line.id);
    setEditConsumption(
      line.consumption && Number(line.consumption) > 0 ? String(line.consumption) : ""
    );
    setEditUnitCost(
      localCosts[line.id] !== undefined
        ? localCosts[line.id]
        : line.unitCost != null
        ? String(line.unitCost)
        : ""
    );
    setEditNote(line.note || "");
  };

  const cancelInlineEdit = () => {
    setEditingLineId(null);
  };

  const saveInlineEdit = async (line: BomLineItem) => {
    setIsSavingInlineEdit(true);
    try {
      if (onUpdateLineInline) {
        if (isAccounting) {
          const sanitized = editUnitCost.trim().replace(",", ".");
          const parsed = sanitized === "" ? null : parseFloat(sanitized);
          const finalCost =
            parsed != null && !isNaN(parsed) && parsed >= 0
              ? Math.round(parsed * 10000) / 10000
              : null;
          await onUpdateLineInline(line.id, {
            unitCost: finalCost,
          });
          setLocalCosts((prev) => ({
            ...prev,
            [line.id]: finalCost != null ? String(finalCost) : "",
          }));
        } else if (isTechnical) {
          const consumptionNum = parseFloat(editConsumption);
          if (isNaN(consumptionNum) || consumptionNum <= 0) {
            return;
          }
          await onUpdateLineInline(line.id, {
            consumption: consumptionNum,
            note: editNote.trim() || undefined,
          });
        }
      }
      setEditingLineId(null);
    } catch {
      // Handled by parent toast
    } finally {
      setIsSavingInlineEdit(false);
    }
  };

  const groups = useMemo(() => {
    const set = new Set<string>();
    lines.forEach((l) => {
      if (l.materialGroupSnapshot) set.add(l.materialGroupSnapshot);
    });
    return Array.from(set);
  }, [lines]);

  const filteredLines = useMemo(() => {
    return lines.filter((line) => {
      const matchSearch =
        !search ||
        (line.materialNameSnapshot &&
          line.materialNameSnapshot.toLowerCase().includes(search.toLowerCase())) ||
        (line.note && line.note.toLowerCase().includes(search.toLowerCase()));

      const matchGroup =
        selectedGroup === "all" || line.materialGroupSnapshot === selectedGroup;

      return matchSearch && matchGroup;
    });
  }, [lines, search, selectedGroup]);

  // Total line cost preview when dirty/editing
  const previewTotalLineCost = useMemo(() => {
    const rawSum = lines.reduce((sum, l) => {
      const isDirty = dirtyLineIds.includes(l.id) || (editingLineId === l.id && isAccounting);
      let costVal = 0;
      if (isDirty) {
        const rawCost =
          editingLineId === l.id && isAccounting
            ? parseFloat(editUnitCost.replace(",", "."))
            : localCosts[l.id] !== undefined
            ? parseFloat(localCosts[l.id].replace(",", "."))
            : l.unitCost != null
            ? Number(l.unitCost)
            : null;
        costVal = !isNaN(rawCost as number) && (rawCost as number) >= 0 ? (rawCost as number) : 0;
      } else {
        costVal = l.unitCost != null && Number(l.unitCost) >= 0 ? Number(l.unitCost) : 0;
      }
      const consumptionVal = Number(l.consumption) || 0;
      return sum + consumptionVal * costVal;
    }, 0);
    return Math.round(rawSum * 10000) / 10000;
  }, [lines, dirtyLineIds, editingLineId, isAccounting, editUnitCost, localCosts]);

  // Detect active filter — reorder is disabled while search/group is active
  // because sending a subset would leave other lines' orderIndex unchanged,
  // violating the unique constraint (revisionId, orderIndex) on the BE.
  const isFiltered = Boolean(search.trim() || selectedGroup !== "all");

  // Reorder helpers — always operate on the FULL lines list so every
  // orderIndex is re-assigned contiguously in a single request.
  const handleMoveUp = (idx: number) => {
    if (idx === 0 || isFiltered) return;
    const newLines = [...lines];
    const temp = newLines[idx];
    newLines[idx] = newLines[idx - 1];
    newLines[idx - 1] = temp;
    onReorderLines(newLines.map((l) => l.id));
  };

  const handleMoveDown = (idx: number) => {
    if (idx === lines.length - 1 || isFiltered) return;
    const newLines = [...lines];
    const temp = newLines[idx];
    newLines[idx] = newLines[idx + 1];
    newLines[idx + 1] = temp;
    onReorderLines(newLines.map((l) => l.id));
  };

  const totalCols = 6 + (canViewCost ? 2 : 0) + 1 + (hasActions ? 1 : 0);

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Toolbar */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[240px] max-w-sm flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tên vật tư, ghi chú..."
              className="w-full rounded-xl border border-gray-200/90 bg-white py-2 pl-9.5 pr-3.5 text-theme-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Group Filter Dropdown */}
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="rounded-xl border border-gray-200/90 bg-white px-3.5 py-2 text-theme-xs font-medium text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="all">Tất cả nhóm</option>
            {groups.map((grp) => (
              <option key={grp} value={grp}>
                {grp}
              </option>
            ))}
          </select>

          {(search || selectedGroup !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedGroup("all");
              }}
              className="inline-flex cursor-pointer items-center gap-1 text-theme-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Xóa lọc</span>
            </button>
          )}
        </div>

        {/* Action Button: + Thêm vật tư (Only if user is allowed to add lines) */}
        {allowAdd && (
          <button
            type="button"
            onClick={onAddLine}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-theme-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-700 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm vật tư</span>
          </button>
        )}
      </div>

      {/* 2. Table Container */}
      <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-theme-sm">
            <thead>
              <tr className="border-b border-gray-200/80 bg-gray-50/50 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                <th className="w-12 py-3.5 pl-4 pr-2 text-center">#</th>
                <th className="px-3.5 py-3.5">Nhóm</th>
                <th className="px-3.5 py-3.5">Mã</th>
                <th className="px-3.5 py-3.5">Nguyên liệu</th>
                <th className="px-3.5 py-3.5 text-center">ĐVT</th>
                <th className="px-3.5 py-3.5 text-center">Định mức</th>
                {canViewCost && (
                  <>
                    <th className="px-3.5 py-3.5 text-right font-bold text-gray-700 dark:text-gray-200">
                      Đơn giá (₫)
                    </th>
                    <th className="px-3.5 py-3.5 text-right font-bold text-blue-600 dark:text-blue-400">
                      Thành tiền (₫)
                    </th>
                  </>
                )}
                <th className="px-3.5 py-3.5">Ghi chú</th>
                {hasActions && <th className="w-24 py-3.5 pl-2 pr-4 text-center">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredLines.length === 0 ? (
                <tr>
                  <td
                    colSpan={totalCols}
                    className="py-12 text-center"
                  >
                    <div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {search || selectedGroup !== "all"
                          ? "Không tìm thấy nguyên phụ liệu phù hợp"
                          : "Chưa có dòng nguyên phụ liệu nào"}
                      </p>
                      <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                        {allowAdd
                          ? "Bấm nút '+ Thêm vật tư' ở trên để chọn nguyên phụ liệu từ danh mục."
                          : "Định mức này hiện chưa có vật tư nào."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLines.map((line, idx) => {
                  const matCode = line.materialNameSnapshot
                    ? line.materialNameSnapshot.split(" ")[0]
                    : "—";

                  const isDirtyLine =
                    dirtyLineIds.includes(line.id) || (editingLineId === line.id && isAccounting);

                  const rawCost =
                    editingLineId === line.id && isAccounting
                      ? parseFloat(editUnitCost.replace(",", "."))
                      : localCosts[line.id] !== undefined
                      ? parseFloat(localCosts[line.id].replace(",", "."))
                      : line.unitCost != null
                      ? Number(line.unitCost)
                      : null;
                  const currentUnitCost =
                    !isNaN(rawCost as number) && (rawCost as number) >= 0
                      ? (rawCost as number)
                      : null;
                  const consumptionVal = Number(line.consumption) || 0;

                  // Clean state: backend line.lineCost is single source of truth.
                  // Dirty state: local preview arithmetic.
                  const lineTotal = isDirtyLine
                    ? (currentUnitCost != null ? Math.round(consumptionVal * currentUnitCost * 10000) / 10000 : null)
                    : (line.lineCost !== undefined
                        ? (line.lineCost != null ? Number(line.lineCost) : null)
                        : (currentUnitCost != null ? Math.round(consumptionVal * currentUnitCost * 10000) / 10000 : null));

                  return (
                    <tr
                      key={line.id}
                      className="group transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/40"
                    >
                      {/* 1. STT (#) */}
                      <td className="py-3.5 pl-4 pr-2 text-center font-mono text-xs font-semibold text-gray-500">
                        <div className="flex items-center justify-center gap-1">
                          {allowReorder && (
                            <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                type="button"
                                disabled={idx === 0 || isReordering || isFiltered}
                                onClick={() => handleMoveUp(idx)}
                                className="cursor-pointer text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed"
                                title={isFiltered ? "Xóa bộ lọc để sắp xếp lại" : "Di chuyển lên"}
                              >
                                <ArrowUp className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === lines.length - 1 || isReordering || isFiltered}
                                onClick={() => handleMoveDown(idx)}
                                className="cursor-pointer text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed"
                                title={isFiltered ? "Xóa bộ lọc để sắp xếp lại" : "Di chuyển xuống"}
                              >
                                <ArrowDown className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                          <span>{idx + 1}</span>
                        </div>
                      </td>

                      {/* 2. Nhóm (Badge Pill) */}
                      <td className="px-3.5 py-3.5">
                        {line.materialGroupSnapshot ? (
                          <span className="inline-flex items-center rounded-full border border-blue-200/70 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
                            {line.materialGroupSnapshot}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* 3. Mã NPL */}
                      <td className="px-3.5 py-3.5 font-mono text-xs font-semibold text-gray-900 dark:text-gray-100">
                        {matCode}
                      </td>

                      {/* 4. Nguyên liệu (Tên NPL) */}
                      <td className="px-3.5 py-3.5">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {line.materialNameSnapshot}
                        </span>
                      </td>

                      {/* 5. ĐVT */}
                      <td className="px-3.5 py-3.5 text-center text-theme-xs font-medium text-gray-600 dark:text-gray-300">
                        {line.unitSnapshot || "—"}
                      </td>

                      {/* 6. Định mức */}
                      <td className="px-3.5 py-3.5 text-center font-mono text-theme-sm font-semibold text-gray-900 dark:text-white">
                        {editingLineId === line.id && isTechnical ? (
                          <input
                            type="number"
                            step="0.0001"
                            min="0"
                            placeholder="-"
                            value={editConsumption}
                            onChange={(e) => setEditConsumption(e.target.value)}
                            className="w-20 rounded-lg border border-brand-500 bg-white px-2 py-1 text-center font-mono text-xs font-bold text-gray-900 focus:outline-none dark:bg-gray-800 dark:text-white"
                          />
                        ) : (
                          <span
                            className={
                              line.consumption && Number(line.consumption) > 0
                                ? "text-gray-900 dark:text-white font-semibold"
                                : "text-gray-400 dark:text-gray-500 font-medium"
                            }
                          >
                            {formatYield(line.consumption)}
                          </span>
                        )}
                      </td>

                      {/* 7. Đơn giá (Visible when canViewCost) */}
                      {canViewCost && (
                        <td className="px-3.5 py-3.5 text-right font-mono text-theme-sm">
                          {isAccounting && !isEditingInModal ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="text"
                                inputMode="decimal"
                                placeholder="0.0000"
                                data-testid={`unit-cost-input-${line.id}`}
                                data-line-id={line.id}
                                value={
                                  editingLineId === line.id
                                    ? editUnitCost
                                    : localCosts[line.id] !== undefined
                                    ? localCosts[line.id]
                                    : line.unitCost != null
                                    ? String(line.unitCost)
                                    : ""
                                }
                                onChange={(e) => {
                                  if (editingLineId === line.id) {
                                    setEditUnitCost(normalizeDecimalInput(e.target.value));
                                  } else {
                                    handleCostChange(line.id, e.target.value);
                                  }
                                }}
                                className={`w-28 rounded-lg border bg-white px-2.5 py-1 text-right font-mono text-xs font-bold text-gray-900 focus:outline-none dark:bg-gray-800 dark:text-white ${
                                  dirtyLineIds.includes(line.id)
                                    ? "border-amber-500 ring-1 ring-amber-400 dark:border-amber-400"
                                    : "border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700"
                                }`}
                                title="Nhập đơn giá (₫)"
                              />
                              <span className="text-[11px] text-gray-400 font-medium">₫</span>
                            </div>
                          ) : (
                            <span className="font-mono text-xs font-semibold text-gray-900 dark:text-white">
                              {line.unitCost != null && Number(line.unitCost) >= 0 ? (
                                <>
                                  <span>{formatVND(line.unitCost)}</span>
                                </>
                              ) : isAccounting ? (
                                <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  Chưa nhập giá
                                </span>
                              ) : (
                                "—"
                              )}
                            </span>
                          )}
                        </td>
                      )}

                      {/* 8. Thành tiền (Visible when canViewCost) */}
                      {canViewCost && (
                        <td className="px-3.5 py-3.5 text-right font-mono text-theme-sm font-bold text-blue-600 dark:text-blue-400">
                          {lineTotal != null ? (
                            <div className="flex items-center justify-end gap-1.5">
                              {isDirtyLine && (
                                <span
                                  className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"
                                  title="Dự kiến"
                                >
                                  Dự kiến
                                </span>
                              )}
                              <span>{formatVND(lineTotal)}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 font-normal">—</span>
                          )}
                        </td>
                      )}

                      {/* 9. Ghi chú */}
                      <td className="px-3.5 py-3.5 text-theme-xs text-gray-500 dark:text-gray-400">
                        {editingLineId === line.id && isTechnical ? (
                          <input
                            type="text"
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                            placeholder="Ghi chú / vị trí tra..."
                          />
                        ) : (
                          line.note || "—"
                        )}
                      </td>

                      {/* 10. Thao tác */}
                      {hasActions && (
                        <td className="py-3.5 pl-2 pr-4 text-center">
                          <div className="relative flex items-center justify-center gap-1">
                            {editingLineId === line.id ? (
                              <>
                                <button
                                  type="button"
                                  disabled={isSavingInlineEdit}
                                  onClick={() => saveInlineEdit(line)}
                                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"
                                  title="Lưu dòng"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={isSavingInlineEdit}
                                  onClick={cancelInlineEdit}
                                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                                  title="Hủy"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                {allowEdit && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => startInlineEdit(line)}
                                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:text-brand-400 dark:hover:bg-brand-950/40"
                                      title="Sửa nhanh trực tiếp trên bảng"
                                    >
                                      <Sparkles className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onEditLine(line)}
                                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                                      title="Chỉnh sửa dòng vật tư"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                  </>
                                )}

                                {allowDelete && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteLine(line)}
                                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/30"
                                    title="Xóa dòng vật tư"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* 2.1 Summary Row for Total Cost (Visible when canViewCost) */}
            {canViewCost && lines.length > 0 && (
              <tfoot className="border-t-2 border-gray-200 bg-gray-50/70 font-semibold text-theme-xs dark:border-gray-800 dark:bg-gray-800/50">
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td colSpan={6} className="py-3 pl-4 pr-3.5 text-right text-gray-600 dark:text-gray-300">
                    SUB TOTAL (Tổng chi phí NPL / SP):
                  </td>
                  <td colSpan={2} className="px-3.5 py-3 text-right font-mono text-sm font-bold text-brand-700 dark:text-brand-300">
                    {dirtyCount > 0 ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                          Dự kiến
                        </span>
                        <span>{formatVND(previewTotalLineCost)}</span>
                      </div>
                    ) : (
                      (() => {
                        const effectiveCost =
                          costPerUnit !== undefined
                            ? costPerUnit
                            : lines.reduce((s, l) => s + (l.lineCost != null ? Number(l.lineCost) : 0), 0);
                        if (effectiveCost == null) {
                          return <span className="text-gray-400 font-normal">—</span>;
                        }
                        return (
                          <>
                            <span>{formatVND(effectiveCost)}</span>
                          </>
                        );
                      })()
                    )}
                  </td>
                  <td colSpan={hasActions ? 2 : 1}></td>
                </tr>
                {currentOrderQuantity != null && currentOrderQuantity > 0 && (
                  <tr>
                    <td colSpan={6} className="py-2.5 pl-4 pr-3.5 text-right text-gray-500 dark:text-gray-400">
                      Tổng chi phí đơn hàng ({currentOrderQuantity.toLocaleString("vi-VN")} SP):
                    </td>
                    <td colSpan={2} className="px-3.5 py-2.5 text-right font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {dirtyCount > 0 ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                            Dự kiến
                          </span>
                          <span>{formatVND(previewTotalLineCost * currentOrderQuantity)}</span>
                        </div>
                      ) : (
                        (() => {
                          const effectiveOrderCost =
                            currentOrderCost !== undefined
                              ? currentOrderCost
                              : costPerUnit != null
                              ? costPerUnit * currentOrderQuantity
                              : null;
                          if (effectiveOrderCost == null) {
                            return <span className="text-gray-400 font-normal">—</span>;
                          }
                          return (
                            <>
                            <span>{formatVND(effectiveOrderCost)}</span>
                            </>
                          );
                        })()
                      )}
                    </td>
                    <td colSpan={hasActions ? 2 : 1}></td>
                  </tr>
                )}
              </tfoot>
            )}
          </table>
        </div>

        {/* 3. Table Footer: Total Count & Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 px-4 py-3 text-theme-xs text-gray-500 dark:border-gray-800 dark:text-gray-400 gap-2">
          <div>
            Tổng cộng: <span className="font-bold text-gray-900 dark:text-white">{filteredLines.length}</span> vật tư
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 opacity-50 dark:border-gray-800 dark:bg-gray-900"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 font-bold text-white text-xs">
              1
            </span>
            <button
              type="button"
              disabled
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 opacity-50 dark:border-gray-800 dark:bg-gray-900"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <span className="ml-1 text-gray-400">10 / trang</span>
          </div>
        </div>
      </div>

      {/* 4. Sticky Floating Action Bar when hasUnsavedCosts */}
      {isAccounting && hasUnsavedCosts && (
        <div className="sticky bottom-4 z-30 w-full animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between rounded-2xl border border-amber-300/80 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-amber-700/60 dark:bg-gray-900/95">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-mono font-bold text-base">
                {dirtyCount}
              </div>
              <div>
                <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <span>Có {dirtyCount} đơn giá chưa lưu</span>
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                    Chờ lưu
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Các thay đổi chưa được ghi nhận vào cơ sở dữ liệu. Bấm &quot;Lưu nháp&quot; để lưu.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancelAllCosts}
                disabled={isSavingCosts}
                className="cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Hủy thay đổi
              </button>
              <button
                type="button"
                id="save-all-costs-floating-btn"
                data-testid="save-all-costs-floating-btn"
                onClick={handleSaveAllCosts}
                disabled={isSavingCosts}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isSavingCosts ? "Đang lưu..." : "Lưu nháp"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
