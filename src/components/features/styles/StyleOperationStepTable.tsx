import { useState, useEffect, useRef, useCallback } from "react";
import {
  PlusIcon,
  TrashBinIcon,
  CopyIcon,
  DownloadIcon,
  ChevronDownIcon,
  CheckLineIcon,
  DocsIcon,
  EyeIcon,
} from "@/icons";


import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { Modal } from "@/components/shared/Modal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StageCombobox } from "./StageCombobox";
import { StageGroupPickerDialog } from "./StageGroupPickerDialog";
import { CopyOperationStepsDialog } from "./CopyOperationStepsDialog";
import { StyleImagePlaceholder } from "./StyleImagePlaceholder";
import { styleOperationStepsApi, type StyleOperationStepItem } from "@/api/styleOperationStepsApi";
import { stageGroupApi, type StageGroup, type StageGroupSubItem } from "@/api/stage-group.api";
import { useToast } from "@/hooks/useToast";
import { resolveImageUrl } from "@/lib/imageUtils";

function formatMetric(value: number, digits = 2, suffix = "") {
  if (!Number.isFinite(value) || value <= 0) return "—";
  return `${value.toLocaleString("vi-VN", { maximumFractionDigits: digits })}${suffix}`;
}

function formatTimeValue(value: number | string) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return "";
  return numericValue.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
}

function isOneKRow(row: Partial<StyleOperationStepItem>) {
  const name = String(row?.stepName || "").toLowerCase();
  return name.includes("1k");
}

export interface StyleOperationStepTableProps {
  styleId: string;
  steps?: StyleOperationStepItem[];
  cmBaseDays?: number;
  canEdit?: boolean;
  onSave?: (steps: Partial<StyleOperationStepItem>[], baseDays?: number) => Promise<void>;
  imageUrl?: string | null;
  styleCode?: string;
  styleName?: string;
  onImageChange?: (file: File) => void;
}

export function StyleOperationStepTable({
  styleId,
  steps = [],
  cmBaseDays = 30,
  canEdit = true,
  onSave,
  imageUrl,
  styleCode,
  styleName,
  onImageChange,
}: StyleOperationStepTableProps) {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Partial<StyleOperationStepItem>[]>(steps);
  const [baseDays, setBaseDays] = useState<number>(Number(cmBaseDays) || 30);
  const [customDaysMode, setCustomDaysMode] = useState<boolean>(
    () => Number(cmBaseDays) !== 30 && Number(cmBaseDays) > 0,
  );
  const [bulkTargetTotal, setBulkTargetTotal] = useState<string>(() => {
    const firstTarget = steps.find((row) => Number(row.targetTotal) > 0)?.targetTotal;
    return firstTarget ? String(firstTarget) : "";
  });

  const [pickerGroup, setPickerGroup] = useState<StageGroup | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [existingStageNames, setExistingStageNames] = useState<string[]>([]);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [deletingRowIndex, setDeletingRowIndex] = useState<number | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageChange) {
      onImageChange(file);
    }
  };

  const handlePasteImage = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            const file = new File([blob], `clipboard-${Date.now()}.png`, { type });
            if (onImageChange) onImageChange(file);
            return;
          }
        }
      }
    } catch (err) {
      console.warn("Clipboard read failed:", err);
    }
  }, [onImageChange]);

  const handlePasteEvent = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file && onImageChange) {
            e.preventDefault();
            onImageChange(file);
            return;
          }
        }
      }
    },
    [onImageChange],
  );

  const pickerGroupRowId = useRef<string | null>(null);
  const rowsRef = useRef<Partial<StyleOperationStepItem>[]>(steps);

  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const triggerSave = useCallback(
    async (rowsToSave?: Partial<StyleOperationStepItem>[], daysToSave?: number) => {
      if (!onSave) return;
      const targetRows = rowsToSave || (rowsRef.current.length > 0 ? rowsRef.current : rows);
      const targetDays = daysToSave ?? baseDays;
      setIsSaving(true);
      try {
        await onSave(targetRows, targetDays);
        const timeStr = new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        setLastSavedTime(timeStr);
        setIsDirty(false);
      } catch (err) {
        console.error("Save failed:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [onSave, baseDays, rows],
  );

  const rowKeys = steps.map((r) => r.id).join(",");
  useEffect(() => {
    rowsRef.current = steps;
    setRows(steps);
    setIsDirty(false);
    const firstTarget = steps.find((row) => Number(row.targetTotal) > 0)?.targetTotal;
    setBulkTargetTotal(firstTarget ? String(firstTarget) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowKeys]);

  useEffect(() => {
    const v = Number(cmBaseDays) || 30;
    setBaseDays(v);
    setCustomDaysMode(v !== 30);
  }, [cmBaseDays]);

  function applyRows(next: Partial<StyleOperationStepItem>[]) {
    setIsDirty(true);
    rowsRef.current = next;
    setRows(next);
  }

  function getCurrentRows() {
    return rowsRef.current.length > 0 || rows.length === 0
      ? rowsRef.current
      : rows;
  }

  function updateLocal<K extends keyof StyleOperationStepItem>(
    idx: number,
    field: K,
    value: StyleOperationStepItem[K],
  ) {
    setIsDirty(true);
    setRows((prev) => {
      const next = prev.map((r, i) => {
        if (i !== idx) return r;
        const updated = { ...r, [field]: value };
        if (field === "timePerPiece") {
          updated.ssv = Number(value) || 0;
        }
        return updated;
      });
      rowsRef.current = next;
      return next;
    });
  }

  function updateBulkTargetTotal(value: string) {
    setBulkTargetTotal(value);
    const numVal = Number(value) || 0;
    const next = getCurrentRows().map((row) => ({
      ...row,
      targetTotal: numVal,
    }));
    applyRows(next);
  }

  function commitBulkTargetTotal() {
    setIsDirty(true);
  }

  function commitStage(
    idx: number,
    stageData: {
      name: string;
      description: string;
      timePerPiece: number;
      ssv: number;
      stageId: string;
    },
  ) {
    const sourceRows = getCurrentRows();
    const next = sourceRows.map((r, i) =>
      i !== idx
        ? r
        : {
          ...r,
          stepName: stageData.name,
          description: stageData.description,
          timePerPiece: stageData.timePerPiece,
          ssv: stageData.ssv,
          stageId: stageData.stageId,
        },
    );
    applyRows(next);
  }

  async function handleGroupPick(idx: number, group: StageGroup) {
    const sourceRows = getCurrentRows();
    const next = [...sourceRows];

    if (idx < 0 || idx >= next.length) return;

    const currentRow = next[idx];
    if (!currentRow) return;

    let fullGroup = group;
    if ((!fullGroup.items || fullGroup.items.length === 0) && fullGroup.id) {
      try {
        fullGroup = await stageGroupApi.getStageGroupById(group.id);
      } catch (err) {
        console.error("Failed to load stage group detail", err);
      }
    }

    const groupRowId = currentRow.id || `group-${Date.now()}`;
    const newRow: Partial<StyleOperationStepItem> = {
      ...currentRow,
      id: groupRowId,
      stepName: fullGroup.name,
      description: fullGroup.description || undefined,
      timePerPiece: 0,
      ssv: 0,
      isGroup: true,
      groupId: fullGroup.id,
      groupItems: fullGroup.items || [],
    };

    next[idx] = newRow;
    pickerGroupRowId.current = groupRowId;

    setExpandedGroups((prev) => ({ ...prev, [groupRowId]: true }));
    applyRows(next);

    setPickerGroup(fullGroup);
    setPickerOpen(true);
  }

  function handleAddGroupItems(selectedItems: StageGroupSubItem[]) {
    if (!selectedItems?.length) {
      setPickerOpen(false);
      return;
    }

    const parentStepId = pickerGroupRowId.current;
    if (!parentStepId) {
      setPickerOpen(false);
      return;
    }

    const currentRows = rowsRef.current;
    const itemsToAdd: Partial<StyleOperationStepItem>[] = selectedItems.map((item) => ({
      id: `child-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      stepName: item.name,
      description: item.description || undefined,
      timePerPiece: Number(item.ssv) || 0,
      ssv: Number(item.ssv) || 0,
      targetTotal: Number(bulkTargetTotal) || 0,
      note: "",
      stageId: null,
      parentStepId: parentStepId,
      isGroup: false,
    }));

    const newRows = [...currentRows];
    const groupIdx = newRows.findIndex((r) => r.id === parentStepId);
    if (groupIdx >= 0) {
      newRows.splice(groupIdx + 1, 0, ...itemsToAdd);
    } else {
      newRows.push(...itemsToAdd);
    }

    setExpandedGroups((prev) => ({ ...prev, [parentStepId]: true }));
    applyRows(newRows);
    setPickerOpen(false);
  }

  function commitOnBlur() {
    // Không tự động lưu khi blur ô nhập
  }

  function commitBaseDays(nextBaseDays: number) {
    setBaseDays(nextBaseDays);
    setIsDirty(true);
  }

  function addRow() {
    const newId = `new-${Date.now()}`;
    const next = [
      ...getCurrentRows(),
      {
        id: newId,
        stepName: "",
        description: "",
        timePerPiece: 0,
        ssv: 0,
        targetTotal: Number(bulkTargetTotal) || 0,
        note: "",
        isGroup: false,
      },
    ];
    applyRows(next);
  }

  function removeRow(idx: number) {
    const sourceRows = getCurrentRows();
    const rowToRemove = sourceRows[idx];
    if (!rowToRemove) return;

    let next = sourceRows.filter((_, i) => i !== idx);

    if (rowToRemove.isGroup && rowToRemove.id) {
      next = next.filter((r) => r.parentStepId !== rowToRemove.id);
    }

    applyRows(next);
  }

  function handleCopyFromDialog(newSteps: Partial<StyleOperationStepItem>[]) {
    applyRows(newSteps);
  }

  const handleExportExcel = async () => {
    if (!rows.length) return;
    try {
      if (isDirty && canEdit) {
        await triggerSave();
      }
      const blob = await styleOperationStepsApi.exportExcel(styleId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeCode = styleCode ? styleCode.replace(/[/\\?%*:|"<>]/g, "_") : styleId;
      link.setAttribute("download", `BangCongDoan_Style_${safeCode}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("Xuất file Excel theo template thành công!", "success");
    } catch (err: unknown) {
      console.error("Lỗi xuất file Excel:", err);
      const msg = err instanceof Error ? err.message : "Lỗi hệ thống";
      showToast("Không thể xuất file Excel: " + msg, "error");
    }
  };

  const totalTime = rows.reduce(
    (s, r) => s + (r.isGroup ? 0 : Number(r.timePerPiece) || 0),
    0,
  );
  const productPerPersonDay = totalTime > 0 ? (3600 / totalTime) * 8 : 0;
  const commonCmTechnology =
    productPerPersonDay > 0 ? baseDays / productPerPersonDay : 0;
  const visibleRows = rows
    .map((row, idx) => ({ row, idx }))
    .filter(
      ({ row }) =>
        !(row.parentStepId && expandedGroups[row.parentStepId] !== true),
    );
  const oneKRows = rows.filter((row) => {
    if (row.isGroup && isOneKRow(row)) return true;
    if (!row.isGroup && isOneKRow(row)) return true;
    return false;
  });
  const oneKTime = oneKRows.reduce((sum, row) => {
    if (row.isGroup && row.id) {
      return (
        sum +
        rows
          .filter((child) => child.parentStepId === row.id)
          .reduce(
            (childSum, child) => childSum + (Number(child.timePerPiece) || 0),
            0,
          )
      );
    }
    return sum + (Number(row.timePerPiece) || 0);
  }, 0);
  const oneKProductPerDay = oneKTime > 0 ? (3600 / oneKTime) * 8 : 0;

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  let visibleRowCount = 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* CỘT TRÁI: Ảnh rập / Cấu trúc */}
      <div className="lg:col-span-4 xl:col-span-3">
        <div className="sticky top-6 space-y-4 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
            <DocsIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Ảnh rập / Cấu trúc
            </h3>
          </div>

          <div className="pt-1">
            {imageUrl ? (
              <div className="space-y-3">
                <div
                  className="relative group rounded-xl overflow-hidden border border-gray-200/80 bg-gray-50/80 aspect-square dark:border-gray-800 dark:bg-gray-800 focus:outline-none"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.ctrlKey && e.key === "v") void handlePasteImage();
                  }}
                >
                  <img
                    src={resolveImageUrl(imageUrl) || ""}
                    alt={styleName || styleCode || "Cấu trúc SP"}
                    className="w-full h-full object-contain p-2"
                  />
                  <button
                    type="button"
                    onClick={() => setZoomOpen(true)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium text-xs gap-1.5 cursor-pointer backdrop-blur-xs"
                  >
                    <EyeIcon className="w-4 h-4" /> Phóng to
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Tải ảnh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs cursor-pointer"
                    onClick={() => void handlePasteImage()}
                  >
                    Dán ảnh
                  </Button>
                </div>
              </div>
            ) : (
              <div
                tabIndex={0}
                onPaste={handlePasteEvent}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl aspect-square flex flex-col items-center justify-center p-4 text-center bg-gray-50/50 dark:bg-gray-800/40 cursor-pointer hover:bg-gray-100/60 dark:hover:bg-gray-800 transition-colors"
                title="Có thể dán ảnh trực tiếp bằng Ctrl+V"
              >
                <StyleImagePlaceholder styleCode={styleCode} className="w-12 h-12 mb-2 text-gray-300 dark:text-gray-600 opacity-60" />
                <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                  Chưa có ảnh mô tả
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 max-w-[180px]">
                  Ảnh kỹ thuật, phác thảo thiết kế rập của Style
                </p>

                <div
                  className="mt-4 grid w-full grid-cols-2 gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Tải ảnh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs cursor-pointer"
                    onClick={() => void handlePasteImage()}
                  >
                    Dán ảnh
                  </Button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: Bảng phân bổ công đoạn */}
      <div className="lg:col-span-8 xl:col-span-9 space-y-6">

        {/* Top Metric Cards */}
        {rows.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Tổng thời gian
              </div>
              <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-gray-900 dark:text-white">
                {totalTime.toFixed(1)} <span className="text-xs font-normal text-gray-500">giây</span>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                SP/người/ngày
              </div>
              <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-gray-900 dark:text-white">
                {formatMetric(productPerPersonDay, 0)}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Công đoạn 1K
              </div>
              <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-gray-900 dark:text-white">
                {formatMetric(oneKProductPerDay, 0)}
              </div>
            </div>
            <div className="relative rounded-2xl border border-brand-200/80 bg-brand-50/30 p-4 shadow-xs dark:border-brand-900/40 dark:bg-brand-950/20">
              <div className="pr-24">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400">
                  CM Công Nghệ
                </div>
                <div className="absolute right-3 top-3 flex items-center gap-2">
                  {customDaysMode ? (
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={baseDays}
                      disabled={!canEdit}
                      onChange={(e) => setBaseDays(Number(e.target.value) || 30)}
                      onBlur={() => commitBaseDays(baseDays)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitBaseDays(baseDays);
                      }}
                      className="w-14 h-7 rounded-md border border-brand-300 bg-white dark:bg-gray-800 text-center text-xs font-bold text-brand-700 dark:text-brand-300 focus:outline-none"
                    />
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-brand-600 text-white px-2.5 py-0.5 text-xs font-bold shadow-xs">
                      30 ngày
                    </span>
                  )}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        if (customDaysMode) {
                          setCustomDaysMode(false);
                          setBaseDays(30);
                          commitBaseDays(30);
                        } else {
                          setCustomDaysMode(true);
                        }
                      }}
                      className={`relative inline-flex h-4 w-8 shrink-0 items-center rounded-full transition-colors cursor-pointer ${customDaysMode ? "bg-brand-600" : "bg-gray-300 dark:bg-gray-700"
                        }`}
                      title={customDaysMode ? "Reset về 30 ngày" : "Tùy chỉnh số ngày"}
                    >
                      <span
                        className={`inline-block h-3 w-3 rounded-full bg-white shadow-xs transition-transform ${customDaysMode ? "translate-x-4" : "translate-x-0.5"
                          }`}
                      />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-brand-600 dark:text-brand-400">
                $ {formatMetric(commonCmTechnology, 2)}
              </div>
            </div>
          </div>
        )}

        {/* Main Table Card */}
        <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4 dark:border-gray-800">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Bảng quy trình công đoạn mẫu Fit
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {rows.length > 0
                  ? `${rows.length} công đoạn · Tổng SSV: ${totalTime.toFixed(3)}s`
                  : "Chưa có công đoạn nào được tạo"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={rows.length === 0}
              >
                <DownloadIcon className="w-4 h-4" />
                Xuất Excel
              </Button>
              {canEdit && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCopyDialogOpen(true)}
                  >
                    <CopyIcon className="w-4 h-4" />
                    Sao chép công đoạn
                  </Button>
                  <Button variant="outline" size="sm" onClick={addRow}>
                    <PlusIcon className="w-4 h-4" />
                    Thêm công đoạn
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => void triggerSave()}
                    disabled={isSaving}
                  >
                    <CheckLineIcon className="w-4 h-4" />
                    {isSaving ? "Đang lưu..." : "Lưu quy trình"}
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="max-h-[calc(100vh-360px)] min-h-[290px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-20 bg-gray-50/95 dark:bg-gray-800/95 shadow-xs">
                <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-semibold">
                  <th className="py-3 px-3 text-center w-12">#</th>
                  <th className="py-3 px-3 min-w-[220px]">Tên công đoạn quy trình</th>
                  <th className="py-3 px-2 text-center min-w-[130px] w-36 bg-amber-50/40 dark:bg-amber-950/10">
                    Thời gian (giây/SP)
                  </th>
                  <th className="py-3 px-2 text-center w-24">% từng công đoạn</th>
                  <th className="py-3 px-2 text-center w-24">SP/1H</th>
                  <th className="py-3 px-3 min-w-[140px]">Ghi chú</th>
                  <th className="py-3 px-2 text-center w-28">CM Công Nghệ</th>
                  <th className="py-3 px-2 text-center w-20">Số người</th>
                  <th className="py-3 px-2 text-center w-28">
                    <div className="mb-1 leading-tight">Chỉ tiêu tổng</div>
                    {canEdit && (
                      <Input
                        type="number"
                        min="0"
                        value={bulkTargetTotal}
                        onChange={(e) => updateBulkTargetTotal(e.target.value)}
                        onBlur={commitBulkTargetTotal}
                        className="h-7 w-20 px-1 text-center text-xs font-mono font-bold mx-auto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Nhập"
                      />
                    )}
                  </th>
                  {canEdit && <th className="py-3 px-2 text-center w-12" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canEdit ? 10 : 9}
                      className="py-12 text-center text-gray-400 dark:text-gray-500"
                    >
                      Chưa có công đoạn nào. Hãy bấm "Thêm công đoạn" hoặc "Sao chép công đoạn" để bắt đầu.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => {
                    if (
                      row.parentStepId &&
                      expandedGroups[row.parentStepId] !== true
                    ) {
                      return null;
                    }

                    const isGroupRow = !!row.isGroup;
                    const isChildRow = !!row.parentStepId;
                    const isCollapsed = !expandedGroups[row.id || ""];

                    let displayTime = Number(row.timePerPiece) || 0;
                    let childrenCount = 0;
                    if (isGroupRow && row.id) {
                      const children = rows.filter(
                        (r) => r.parentStepId === row.id,
                      );
                      displayTime = children.reduce(
                        (s, r) => s + (Number(r.timePerPiece) || 0),
                        0,
                      );
                      childrenCount = children.length;
                    }
                    const displayTargetTotal = Number(row.targetTotal) || 0;
                    const percentOfTotal =
                      totalTime > 0 && Number(displayTime) > 0
                        ? (Number(displayTime) / totalTime) * 100
                        : 0;
                    const spPerHour =
                      Number(displayTime) > 0 ? 3600 / Number(displayTime) : 0;
                    const spPerPersonDay = spPerHour > 0 ? spPerHour * 8 : 0;
                    const peopleNeeded =
                      displayTargetTotal > 0 && spPerPersonDay > 0
                        ? displayTargetTotal / spPerPersonDay
                        : 0;

                    if (!isChildRow) {
                      visibleRowCount++;
                    }

                    let rowBg = "";
                    if (isGroupRow) {
                      rowBg =
                        "bg-brand-50/40 dark:bg-brand-950/20 border-l-4 border-brand-500";
                    } else if (isChildRow) {
                      rowBg =
                        "bg-white dark:bg-gray-900 border-l-4 border-transparent";
                    } else {
                      rowBg = "hover:bg-gray-50/60 dark:hover:bg-gray-800/40";
                    }

                    return (
                      <tr
                        key={row.id || idx}
                        className={`transition-colors ${rowBg}`}
                      >
                        <td className="py-2.5 px-3 text-center font-mono text-gray-400">
                          {isChildRow ? "├" : visibleRowCount}
                        </td>

                        <td className="py-2 px-3">
                          <div
                            className={`flex items-center gap-2 ${isChildRow ? "pl-6" : ""
                              }`}
                          >
                            {isGroupRow && row.id && (
                              <button
                                type="button"
                                onClick={() => toggleGroup(row.id!)}
                                className={`w-5 h-5 rounded flex items-center justify-center transition-transform ${isCollapsed
                                    ? "-rotate-90 bg-gray-100 dark:bg-gray-800 text-gray-500"
                                    : "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                                  }`}
                              >
                                <ChevronDownIcon className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {isChildRow && (
                              <span className="text-gray-300 dark:text-gray-600 font-bold text-xs">
                                ↳
                              </span>
                            )}

                            {canEdit ? (
                              isGroupRow ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <span className="font-bold text-gray-800 dark:text-gray-200">
                                    {row.stepName}
                                  </span>
                                  <span className="rounded bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 px-1.5 py-0.5 text-[10px] font-bold">
                                    NHÓM
                                  </span>
                                  {childrenCount > 0 && (
                                    <span className="text-xs text-gray-400 font-medium">
                                      ({childrenCount})
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex-1 min-w-0">
                                  <StageCombobox
                                    value={row.stepName || ""}
                                    stageId={row.stageId}
                                    onNameChange={(val) =>
                                      updateLocal(idx, "stepName", val)
                                    }
                                    onCommit={(stageData) =>
                                      commitStage(idx, stageData)
                                    }
                                    onGroupPick={(group) =>
                                      handleGroupPick(idx, group)
                                    }
                                  />
                                </div>
                              )
                            ) : (
                              <span className="font-medium text-gray-900 dark:text-white">
                                {row.stepName}
                              </span>
                            )}

                            {canEdit && isGroupRow && !isCollapsed && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-700"
                                onClick={() => {
                                  const existing = rows
                                    .filter((r) => r.parentStepId === row.id)
                                    .map((r) => (r.stepName || "").toLowerCase().trim())
                                    .filter(Boolean);

                                  pickerGroupRowId.current = row.id || null;
                                  setExistingStageNames(existing);
                                  setPickerGroup({
                                    id: row.groupId || "",
                                    code: "",
                                    name: row.stepName || "",
                                    description: row.description || undefined,
                                    isGroup: true,
                                    items: row.groupItems || [],
                                  });
                                  setPickerOpen(true);
                                }}
                                title="Thêm công đoạn con vào nhóm"
                              >
                                <PlusIcon className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>

                        <td className="py-2 px-2 text-center bg-amber-50/20 dark:bg-amber-950/5">
                          {canEdit ? (
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              value={
                                isGroupRow
                                  ? formatTimeValue(displayTime)
                                  : formatTimeValue(row.timePerPiece || 0)
                              }
                              onChange={(e) =>
                                updateLocal(idx, "timePerPiece", Number(e.target.value) || 0)
                              }
                              onBlur={commitOnBlur}
                              disabled={isGroupRow}
                              className={`mx-auto h-8 w-24 px-1 text-center font-mono font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isGroupRow ? "bg-transparent border-transparent cursor-not-allowed" : ""
                                }`}
                              placeholder="0"
                            />
                          ) : (
                            <span className="font-mono font-bold text-gray-900 dark:text-white">
                              {formatTimeValue(
                                isGroupRow ? displayTime : row.timePerPiece || 0,
                              ) || "—"}
                            </span>
                          )}
                        </td>

                        <td className="py-2 px-2 text-center font-mono font-semibold text-gray-700 dark:text-gray-300">
                          {percentOfTotal > 0 ? `${percentOfTotal.toFixed(0)}%` : "—"}
                        </td>

                        <td className="py-2 px-2 text-center font-mono font-bold text-brand-600 dark:text-brand-400">
                          {formatMetric(spPerHour, 2)}
                        </td>

                        <td className="py-2 px-3">
                          {canEdit && !isGroupRow ? (
                            <Input
                              value={row.note || ""}
                              onChange={(e) =>
                                updateLocal(idx, "note", e.target.value)
                              }
                              onBlur={commitOnBlur}
                              className="h-8 w-full text-xs"
                              placeholder="Ghi chú..."
                            />
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">
                              {isGroupRow ? "—" : row.note}
                            </span>
                          )}
                        </td>

                        {idx === visibleRows[0]?.idx && (
                          <td
                            rowSpan={visibleRows.length}
                            className="border-l border-r border-brand-100 bg-brand-50/40 dark:border-brand-900/40 dark:bg-brand-950/20 px-3 py-3 text-center align-middle"
                          >
                            <div className="font-mono tabular-nums text-2xl font-black text-brand-900 dark:text-brand-200">
                              $ {formatMetric(commonCmTechnology, 2)}
                            </div>
                          </td>
                        )}

                        <td className="py-2 px-2 text-center font-mono font-medium text-gray-600 dark:text-gray-300">
                          {formatMetric(peopleNeeded, 1)}
                        </td>

                        <td className="py-2 px-2 text-center font-mono font-bold">
                          {displayTargetTotal > 0 ? displayTargetTotal : "—"}
                        </td>

                        {canEdit && (
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => setDeletingRowIndex(idx)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                              title="Xóa công đoạn"
                            >
                              <TrashBinIcon className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
              {rows.length > 0 && (
                <tfoot className="sticky bottom-0 z-20 border-t-2 border-brand-200 bg-brand-50/95 dark:border-brand-900/60 dark:bg-brand-950/95 shadow-xs">
                  <tr>
                    <td colSpan={2} className="py-3 px-4 text-right font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-white">
                      TỔNG THỜI GIAN
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-black text-amber-700 dark:text-amber-400 text-sm">
                      {totalTime.toFixed(1)} giây
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-black text-gray-900 dark:text-white text-xs">
                      100%
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                        SP/NGƯỜI/NGÀY
                      </div>
                      <div className="font-mono font-black text-brand-700 dark:text-brand-300 text-sm">
                        {formatMetric(productPerPersonDay, 0)}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        CÔNG ĐOẠN 1K
                      </div>
                      <div className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-sm">
                        {formatMetric(oneKProductPerDay, 0)}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                        CM CÔNG NGHỆ
                      </div>
                      <div className="font-mono font-black text-brand-900 dark:text-brand-200 text-sm">
                        $ {formatMetric(commonCmTechnology, 2)}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center text-gray-400">—</td>
                    <td className="py-3 px-2 text-center text-gray-400">—</td>
                    {canEdit && <td className="py-3 px-2 text-center" />}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Bottom Action Bar */}
        {canEdit && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200/80 bg-gray-50/90 p-4 shadow-xs dark:border-gray-800 dark:bg-gray-800/60">
            {/* Trạng thái lưu */}
            <div className="flex items-center gap-2 text-xs">
              {isSaving ? (
                <span className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                  </span>
                  Đang lưu dữ liệu...
                </span>
              ) : isDirty ? (
                <span className="flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  Có thay đổi chưa lưu (nhấn "Lưu quy trình" để lưu)
                </span>
              ) : lastSavedTime ? (
                <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckLineIcon className="h-3.5 w-3.5" />
                  Đã lưu tất cả thay đổi ({lastSavedTime})
                </span>
              ) : (
                <span className="text-gray-400 dark:text-gray-500">
                  Nhấn "Lưu quy trình" khi hoàn tất chỉnh sửa
                </span>
              )}
            </div>

            {/* Nút hành động phía dưới */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={addRow}>
                <PlusIcon className="w-4 h-4" />
                Thêm công đoạn
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => void triggerSave()}
                disabled={isSaving}
              >
                <CheckLineIcon className="w-4 h-4" />
                {isSaving ? "Đang lưu..." : "Lưu quy trình"}
              </Button>
            </div>
          </div>
        )}


      </div>

      {/* Dialogs */}
      <StageGroupPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        group={pickerGroup}
        onConfirm={handleAddGroupItems}
        existingStageNames={existingStageNames}
      />

      <CopyOperationStepsDialog
        open={copyDialogOpen}
        onOpenChange={setCopyDialogOpen}
        currentStyleId={styleId}
        onCopy={handleCopyFromDialog}
      />

      {/* Lightbox Phóng to ảnh */}
      {zoomOpen && imageUrl && (
        <Modal
          open
          title="Ảnh rập / Cấu trúc"
          onClose={() => setZoomOpen(false)}
        >
          <div className="flex max-h-[75vh] items-center justify-center overflow-auto rounded-xl bg-gray-50/80 p-4 dark:bg-gray-800">
            <img
              src={resolveImageUrl(imageUrl) || ""}
              alt={styleName || styleCode || "Ảnh rập / Cấu trúc"}
              className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-md"
            />
          </div>
        </Modal>
      )}

      {/* Hộp thoại xác nhận xóa */}
      {deletingRowIndex !== null && rows[deletingRowIndex] && (
        <ConfirmDialog
          open
          title={rows[deletingRowIndex].isGroup ? "Xóa nhóm công đoạn" : "Xóa công đoạn"}
          description={
            (() => {
              const target = rows[deletingRowIndex];
              if (target.isGroup && target.id) {
                const childrenCount = rows.filter((r) => r.parentStepId === target.id).length;
                return (
                  <>
                    Bạn có chắc chắn muốn xóa nhóm công đoạn{" "}
                    <strong className="text-gray-900 dark:text-white font-semibold">
                      "{target.stepName || "Chưa đặt tên"}"
                    </strong>
                    {childrenCount > 0 && (
                      <>
                        {" "}và toàn bộ{" "}
                        <strong className="text-red-600 dark:text-red-400 font-semibold">
                          {childrenCount} công đoạn con
                        </strong>
                      </>
                    )}{" "}
                    không?
                  </>
                );
              }
              return (
                <>
                  Bạn có chắc chắn muốn xóa công đoạn{" "}
                  <strong className="text-gray-900 dark:text-white font-semibold">
                    "{target.stepName || "Chưa đặt tên"}"
                  </strong>{" "}
                  không?
                </>
              );
            })()
          }
          confirmLabel={rows[deletingRowIndex].isGroup ? "Xóa nhóm" : "Xóa công đoạn"}
          variant="danger"
          onConfirm={() => {
            const idx = deletingRowIndex;
            setDeletingRowIndex(null);
            removeRow(idx);
          }}
          onClose={() => setDeletingRowIndex(null)}
        />
      )}
    </div>
  );
}
