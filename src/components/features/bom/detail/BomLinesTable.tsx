import { memo, useMemo, useState, type ReactNode } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Save,
  Download,
} from "lucide-react";
import { formatUSD, formatYield, canViewBomCost } from "@/lib/bomAccess";
import { parseDecimal, type BomDraftMode, type DraftLine } from "@/hooks/useBomLinesDraft";
import { useAuthStore } from "@/store/authStore";

type EditableField = "consumption" | "unitCost" | "note";

interface BomLinesTableProps {
  rows: DraftLine[];
  bomCode: string;
  mode: BomDraftMode;
  canEdit: boolean;
  isEditing: boolean;
  isSaving?: boolean;
  dirtyCount: number;
  costPerUnit?: number | null;
  currentOrderQuantity?: number | null;
  currentOrderCost?: number | null;
  historySlot?: ReactNode;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onAddMaterial: () => void;
  onChangeField: (key: string, field: EditableField, value: string) => void;
  onRemove: (key: string) => void;
  onMove: (key: string, delta: -1 | 1) => void;
}

function normalizeDecimalInput(raw: string): string {
  let val = raw.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const parts = val.split(".");
  if (parts.length > 2) val = parts[0] + "." + parts.slice(1).join("");
  const decimals = val.split(".")[1];
  if (decimals && decimals.length > 4) val = val.split(".")[0] + "." + decimals.slice(0, 4);
  return val;
}

function exportRowsToCsv(rows: DraftLine[], bomCode: string, canViewCost: boolean) {
  const headers = [
    "#",
    "Nhóm",
    "Mã",
    "Nguyên liệu",
    "ĐVT",
    "Định mức",
    ...(canViewCost ? ["Đơn giá ($)", "Thành tiền ($)"] : []),
    "Ghi chú",
  ];
  const body = rows.map((row, idx) => [
    idx + 1,
    row.materialGroup || "",
    row.materialCode || "",
    row.materialName,
    row.unit,
    formatYield(parseDecimal(row.consumption)),
    ...(canViewCost
      ? [
          parseDecimal(row.unitCost) != null ? formatUSD(parseDecimal(row.unitCost)) : "",
          row.lineCost != null ? formatUSD(row.lineCost) : "",
        ]
      : []),
    row.note || "",
  ]);

  const csvContent =
    "﻿" +
    [headers, ...body]
      .map((cells) => cells.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `NPL_${bomCode}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface LineRowProps {
  row: DraftLine;
  position: number;
  total: number;
  mode: BomDraftMode;
  isEditing: boolean;
  canViewCost: boolean;
  reorderDisabled: boolean;
  onChangeField: BomLinesTableProps["onChangeField"];
  onRemove: BomLinesTableProps["onRemove"];
  onMove: BomLinesTableProps["onMove"];
}

const LineRow = memo(function LineRow({
  row,
  position,
  total,
  mode,
  isEditing,
  canViewCost,
  reorderDisabled,
  onChangeField,
  onRemove,
  onMove,
}: LineRowProps) {
  const editTechnical = isEditing && mode === "technical";
  const editCost = isEditing && mode === "costs";
  const consumption = parseDecimal(row.consumption);
  const unitCost = parseDecimal(row.unitCost);
  const isRowDirty =
    isEditing &&
    (row.isNew ||
      row.consumption !== row.originalConsumption ||
      row.unitCost !== row.originalUnitCost);
  const lineTotal = isRowDirty
    ? consumption != null && unitCost != null
      ? Math.round(consumption * unitCost * 10000) / 10000
      : null
    : row.lineCost;
  const code = row.materialCode || (row.materialName ? row.materialName.split(" ")[0] : "—");

  return (
    <tr
      data-testid={`bom-line-row-${row.key}`}
      className={`group transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/40 ${
        row.isNew ? "bg-emerald-50/40 dark:bg-emerald-950/10" : ""
      }`}
    >
      <td className="py-3.5 pr-2 pl-4 text-center font-mono text-xs font-semibold text-gray-500">
        <div className="flex items-center justify-center gap-1">
          {editTechnical && (
            <div className="flex flex-col">
              <button
                type="button"
                disabled={position === 0 || reorderDisabled}
                onClick={() => onMove(row.key, -1)}
                className="cursor-pointer text-gray-400 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-20"
                title={reorderDisabled ? "Xóa bộ lọc để sắp xếp lại" : "Di chuyển lên"}
              >
                <ArrowUp className="h-3 w-3" />
              </button>
              <button
                type="button"
                disabled={position === total - 1 || reorderDisabled}
                onClick={() => onMove(row.key, 1)}
                className="cursor-pointer text-gray-400 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-20"
                title={reorderDisabled ? "Xóa bộ lọc để sắp xếp lại" : "Di chuyển xuống"}
              >
                <ArrowDown className="h-3 w-3" />
              </button>
            </div>
          )}
          <span>{position + 1}</span>
        </div>
      </td>

      <td className="px-3.5 py-3.5">
        {row.materialGroup ? (
          <span className="inline-flex items-center rounded-full border border-blue-200/70 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-blue-700 uppercase dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
            {row.materialGroup}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>

      <td className="px-3.5 py-3.5 font-mono text-xs font-semibold text-gray-900 dark:text-gray-100">
        {code}
      </td>

      <td className="px-3.5 py-3.5">
        <span className="font-semibold text-gray-900 dark:text-white">{row.materialName}</span>
        {row.isNew && (
          <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            Mới
          </span>
        )}
      </td>

      <td className="text-theme-xs px-3.5 py-3.5 text-center font-medium text-gray-600 dark:text-gray-300">
        {row.unit || "—"}
      </td>

      <td className="text-theme-sm px-3.5 py-3.5 text-center font-mono font-semibold text-gray-900 dark:text-white">
        {editTechnical ? (
          <input
            type="text"
            inputMode="decimal"
            placeholder="-"
            data-testid={`consumption-input-${row.key}`}
            value={row.consumption}
            onChange={(e) =>
              onChangeField(row.key, "consumption", normalizeDecimalInput(e.target.value))
            }
            className="border-brand-500 w-20 rounded-lg border bg-white px-2 py-1 text-center font-mono text-xs font-bold text-gray-900 focus:outline-none dark:bg-gray-800 dark:text-white"
          />
        ) : (
          <span
            className={
              consumption && consumption > 0
                ? "font-semibold text-gray-900 dark:text-white"
                : "font-medium text-gray-400 dark:text-gray-500"
            }
          >
            {formatYield(consumption)}
          </span>
        )}
      </td>

      {canViewCost && (
        <td className="text-theme-sm px-3.5 py-3.5 text-right font-mono">
          {editCost ? (
            <div className="flex items-center justify-end gap-1">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.0000"
                data-testid={`unit-cost-input-${row.key}`}
                data-line-id={row.key}
                value={row.unitCost}
                onChange={(e) =>
                  onChangeField(row.key, "unitCost", normalizeDecimalInput(e.target.value))
                }
                className="focus:border-brand-500 focus:ring-brand-500 w-28 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-right font-mono text-xs font-bold text-gray-900 focus:ring-1 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                title="Nhập đơn giá ($)"
              />
              <span className="text-[11px] font-medium text-gray-400">$</span>
            </div>
          ) : (
            <span className="font-mono text-xs font-semibold text-gray-900 dark:text-white">
              {unitCost != null ? formatUSD(unitCost) : "—"}
            </span>
          )}
        </td>
      )}

      {canViewCost && (
        <td className="text-theme-sm px-3.5 py-3.5 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
          {lineTotal != null ? (
            <span>{formatUSD(lineTotal)}</span>
          ) : (
            <span className="font-normal text-gray-400">—</span>
          )}
        </td>
      )}

      <td className="text-theme-xs px-3.5 py-3.5 text-gray-500 dark:text-gray-400">
        {editTechnical ? (
          <input
            type="text"
            data-testid={`note-input-${row.key}`}
            value={row.note}
            onChange={(e) => onChangeField(row.key, "note", e.target.value)}
            className="focus:border-brand-500 w-full rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            placeholder="Ghi chú / vị trí tra..."
          />
        ) : (
          row.note || "—"
        )}
      </td>

      {editTechnical && (
        <td className="py-3.5 pr-4 pl-2 text-center">
          <button
            type="button"
            onClick={() => onRemove(row.key)}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/30"
            title="Xóa dòng vật tư"
            aria-label={`Xóa ${row.materialName}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </td>
      )}
    </tr>
  );
});

export function BomLinesTable({
  rows,
  bomCode,
  mode,
  canEdit,
  isEditing,
  isSaving = false,
  dirtyCount,
  costPerUnit,
  currentOrderQuantity,
  currentOrderCost,
  historySlot,
  onStartEdit,
  onCancel,
  onSave,
  onAddMaterial,
  onChangeField,
  onRemove,
  onMove,
}: BomLinesTableProps) {
  const user = useAuthStore((state) => state.user);
  const canViewCost = canViewBomCost(user);
  const editTechnical = isEditing && mode === "technical";

  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");

  const groups = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((row) => {
      if (row.materialGroup) set.add(row.materialGroup);
    });
    return Array.from(set);
  }, [rows]);

  const isFiltered = Boolean(search.trim() || selectedGroup !== "all");

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .map((row, position) => ({ row, position }))
      .filter(({ row }) => {
        const matchSearch =
          !q ||
          row.materialName.toLowerCase().includes(q) ||
          (row.materialCode ?? "").toLowerCase().includes(q) ||
          row.note.toLowerCase().includes(q);
        const matchGroup = selectedGroup === "all" || row.materialGroup === selectedGroup;
        return matchSearch && matchGroup;
      });
  }, [rows, search, selectedGroup]);

  const previewTotal = useMemo(() => {
    const sum = rows.reduce((acc, row) => {
      const consumption = parseDecimal(row.consumption) ?? 0;
      const unitCost = parseDecimal(row.unitCost) ?? 0;
      return acc + consumption * unitCost;
    }, 0);
    return Math.round(sum * 10000) / 10000;
  }, [rows]);

  const showPreview = isEditing && dirtyCount > 0;
  const actionColumn = editTechnical;
  const totalCols = 6 + (canViewCost ? 2 : 0) + 1 + (actionColumn ? 1 : 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative max-w-sm min-w-[240px] flex-1">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tên vật tư, ghi chú..."
              className="text-theme-sm focus:border-brand-500 w-full rounded-xl border border-gray-200/90 bg-white py-2 pr-3.5 pl-9.5 text-gray-800 placeholder-gray-400 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="text-theme-xs focus:border-brand-500 rounded-xl border border-gray-200/90 bg-white px-3.5 py-2 font-medium text-gray-700 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="all">Tất cả nhóm</option>
            {groups.map((grp) => (
              <option key={grp} value={grp}>
                {grp}
              </option>
            ))}
          </select>

          {isFiltered && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedGroup("all");
              }}
              className="text-theme-xs inline-flex cursor-pointer items-center gap-1 font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Xóa lọc</span>
            </button>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          {historySlot}

          {rows.length > 0 && !isEditing && (
            <button
              type="button"
              onClick={() => exportRowsToCsv(rows, bomCode, canViewCost)}
              className="text-theme-sm inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-blue-200/80 bg-white px-3.5 py-2 font-semibold text-blue-600 shadow-2xs transition-colors hover:bg-blue-50 dark:border-blue-800 dark:bg-gray-900 dark:text-blue-400"
            >
              <Download className="h-4 w-4" />
              <span>Xuất Excel</span>
            </button>
          )}

          {canEdit && !isEditing && (
            <button
              type="button"
              onClick={onStartEdit}
              className="bg-brand-600 text-theme-sm hover:bg-brand-700 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 font-semibold text-white shadow-xs transition-colors active:scale-[0.98]"
            >
              <Pencil className="h-4 w-4" />
              <span>Chỉnh sửa</span>
            </button>
          )}

          {canEdit && editTechnical && (
            <button
              type="button"
              onClick={onAddMaterial}
              disabled={isSaving}
              className="border-brand-200 text-theme-sm text-brand-700 hover:bg-brand-50 dark:border-brand-900 dark:text-brand-300 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2 font-semibold shadow-2xs transition-colors disabled:opacity-50 dark:bg-gray-900"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm vật tư</span>
            </button>
          )}

          {canEdit && isEditing && mode === "technical" && (
            <>
              <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                className="text-theme-sm cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={isSaving || dirtyCount === 0}
                className="text-theme-sm inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? "Đang lưu..." : "Lưu"}</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="text-theme-sm w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200/80 bg-gray-50/50 text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                <th className="w-12 py-3.5 pr-2 pl-4 text-center">#</th>
                <th className="px-3.5 py-3.5">Nhóm</th>
                <th className="px-3.5 py-3.5">Mã</th>
                <th className="px-3.5 py-3.5">Nguyên liệu</th>
                <th className="px-3.5 py-3.5 text-center">ĐVT</th>
                <th className="px-3.5 py-3.5 text-center">Định mức</th>
                {canViewCost && (
                  <>
                    <th className="px-3.5 py-3.5 text-right font-bold text-gray-700 dark:text-gray-200">
                      Đơn giá ($)
                    </th>
                    <th className="px-3.5 py-3.5 text-right font-bold text-blue-600 dark:text-blue-400">
                      Thành tiền ($)
                    </th>
                  </>
                )}
                <th className="px-3.5 py-3.5">Ghi chú</th>
                {actionColumn && <th className="w-20 py-3.5 pr-4 pl-2 text-center">Xóa</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={totalCols} className="py-12 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {isFiltered
                          ? "Không tìm thấy nguyên phụ liệu phù hợp"
                          : "Chưa có dòng nguyên phụ liệu nào"}
                      </p>
                      <p className="text-theme-xs mt-1 text-gray-500 dark:text-gray-400">
                        {canEdit && mode === "technical"
                          ? "Bấm 'Chỉnh sửa' rồi '+ Thêm vật tư' để chọn nguyên phụ liệu từ danh mục."
                          : "Định mức này hiện chưa có vật tư nào."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleRows.map(({ row, position }) => (
                  <LineRow
                    key={row.key}
                    row={row}
                    position={position}
                    total={rows.length}
                    mode={mode}
                    isEditing={isEditing}
                    canViewCost={canViewCost}
                    reorderDisabled={isFiltered}
                    onChangeField={onChangeField}
                    onRemove={onRemove}
                    onMove={onMove}
                  />
                ))
              )}
            </tbody>

            {canViewCost && rows.length > 0 && (
              <tfoot className="text-theme-xs border-t-2 border-gray-200 bg-gray-50/70 font-semibold dark:border-gray-800 dark:bg-gray-800/50">
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td
                    colSpan={6}
                    className="py-3 pr-3.5 pl-4 text-right text-gray-600 dark:text-gray-300"
                  >
                    SUB TOTAL (Tổng chi phí NPL / SP):
                  </td>
                  <td
                    colSpan={2}
                    className="text-brand-700 dark:text-brand-300 px-3.5 py-3 text-right font-mono text-sm font-bold"
                  >
                    {showPreview ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                          Dự kiến
                        </span>
                        <span>{formatUSD(previewTotal)}</span>
                      </div>
                    ) : costPerUnit != null ? (
                      <span>{formatUSD(costPerUnit)}</span>
                    ) : (
                      <span className="font-normal text-gray-400">—</span>
                    )}
                  </td>
                  <td colSpan={actionColumn ? 2 : 1}></td>
                </tr>
                {currentOrderQuantity != null && currentOrderQuantity > 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-2.5 pr-3.5 pl-4 text-right text-gray-500 dark:text-gray-400"
                    >
                      Tổng chi phí đơn hàng ({currentOrderQuantity.toLocaleString("vi-VN")} SP):
                    </td>
                    <td
                      colSpan={2}
                      className="px-3.5 py-2.5 text-right font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400"
                    >
                      {showPreview ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                            Dự kiến
                          </span>
                          <span>{formatUSD(previewTotal * currentOrderQuantity)}</span>
                        </div>
                      ) : currentOrderCost != null ? (
                        <span>{formatUSD(currentOrderCost)}</span>
                      ) : (
                        <span className="font-normal text-gray-400">—</span>
                      )}
                    </td>
                    <td colSpan={actionColumn ? 2 : 1}></td>
                  </tr>
                )}
              </tfoot>
            )}
          </table>
        </div>

        <div className="text-theme-xs flex items-center justify-between border-t border-gray-100 px-4 py-3 text-gray-500 dark:border-gray-800 dark:text-gray-400">
          <div>
            Tổng cộng:{" "}
            <span className="font-bold text-gray-900 dark:text-white">{visibleRows.length}</span>{" "}
            vật tư
          </div>
        </div>
      </div>

      {isEditing && dirtyCount > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-2 sticky bottom-4 z-30 w-full">
          <div className="flex items-center justify-between rounded-2xl border border-amber-300/80 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-amber-700/60 dark:bg-gray-900/95">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 font-mono text-base font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                {dirtyCount}
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                  <span>Có {dirtyCount} thay đổi chưa lưu</span>
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                    Chờ lưu
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Các thay đổi chỉ được ghi nhận khi bấm &quot;Lưu&quot;.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                className="cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Hủy thay đổi
              </button>
              <button
                type="button"
                id="save-all-costs-floating-btn"
                data-testid="save-all-costs-floating-btn"
                onClick={onSave}
                disabled={isSaving}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? "Đang lưu..." : "Lưu"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
