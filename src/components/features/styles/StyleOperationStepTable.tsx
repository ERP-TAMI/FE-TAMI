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
  PencilIcon,
} from "@/icons";


import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { Modal } from "@/components/shared/Modal";
import { Toast } from "@/components/shared/Toast";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { UnsavedChangesDialog } from "./UnsavedChangesDialog";
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

function getCommonNote(steps: Partial<StyleOperationStepItem>[]) {
  return String(steps.find((row) => String(row.note || "").trim())?.note || "");
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
  onEditingChange?: (isEditing: boolean) => void;
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
  onEditingChange,
  onSave,
  imageUrl,
  styleCode,
  styleName,
  onImageChange,
}: StyleOperationStepTableProps) {
  const { toast, showToast, hideToast } = useToast();
  const [rows, setRows] = useState<Partial<StyleOperationStepItem>[]>(steps);
  const [baseDays, setBaseDays] = useState<number>(Number(cmBaseDays) || 30);
  const [customDaysMode, setCustomDaysMode] = useState<boolean>(
    () => Number(cmBaseDays) !== 30 && Number(cmBaseDays) > 0,
  );
  const [bulkTargetTotal, setBulkTargetTotal] = useState<string>(() => {
    const firstTarget = steps.find((row) => Number(row.targetTotal) > 0)?.targetTotal;
    return firstTarget ? String(firstTarget) : "";
  });
  const [commonNote, setCommonNote] = useState(() => getCommonNote(steps));

  const [pickerGroup, setPickerGroup] = useState<StageGroup | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [existingStageNames, setExistingStageNames] = useState<string[]>([]);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [deletingRowIndex, setDeletingRowIndex] = useState<number | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [pendingDiscardOpen, setPendingDiscardOpen] = useState(false);
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
  const [isDirty, setIsDirty] = useState(false);
  const [invalidRowIndex, setInvalidRowIndex] = useState<number | null>(null);

  const editable = canEdit && isEditing;
  const showEditButton = canEdit && !isEditing;
  const rowPaddingY = isEditing ? "py-2" : "py-2.5";
  const rowPaddingX = isEditing ? "px-1.5" : "px-2";
  const compactInputClass =
    "h-7 rounded-md border border-brand-200 bg-brand-50/50 text-xs text-gray-900 shadow-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 dark:border-brand-800 dark:bg-brand-950/20 dark:text-white";

  useEffect(() => {
    onEditingChange?.(isEditing);
    return () => onEditingChange?.(false);
  }, [isEditing, onEditingChange]);

  useEffect(() => {
    if (!isEditing) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isEditing]);

  const triggerSave = useCallback(
    async (rowsToSave?: Partial<StyleOperationStepItem>[], daysToSave?: number) => {
      if (!onSave) return false;
      const targetRows = rowsToSave || (rowsRef.current.length > 0 ? rowsRef.current : rows);
      const targetDays = daysToSave ?? baseDays;
      const invalidRowIndex = targetRows.findIndex(
        (row) => !(String(row.stepName || "").trim()),
      );
      if (invalidRowIndex >= 0) {
        const invalidRow = targetRows[invalidRowIndex];
        if (invalidRow.parentStepId) {
          setExpandedGroups((current) => ({
            ...current,
            [invalidRow.parentStepId!]: true,
          }));
        }
        setInvalidRowIndex(invalidRowIndex);
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            const rowElement = document.querySelector<HTMLElement>(
              `[data-operation-row-index="${invalidRowIndex}"]`,
            );
            rowElement?.scrollIntoView?.({ behavior: "auto", block: "center" });
            rowElement?.querySelector<HTMLInputElement>("input")?.focus();
          });
        });
        return false;
      }
      setInvalidRowIndex(null);
      setIsSaving(true);
      try {
        await onSave(
          targetRows.map((row) => ({ ...row, note: commonNote || null })),
          targetDays,
        );
        setIsDirty(false);
        return true;
      } catch (err) {
        console.error("Save failed:", err);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [onSave, baseDays, commonNote, rows],
  );

  const rowKeys = steps.map((r) => r.id).join(",");
  useEffect(() => {
    rowsRef.current = steps;
    setRows(steps);
    setIsDirty(false);
    setCommonNote(getCommonNote(steps));
    const firstTarget = steps.find((row) => Number(row.targetTotal) > 0)?.targetTotal;
    setBulkTargetTotal(firstTarget ? String(firstTarget) : "");

    // Tự động mở rộng tất cả nhóm có công đoạn con sau khi dữ liệu từ server về
    // (quan trọng: backend tạo lại rows với UUID mới sau mỗi lần lưu)
    const newExpanded: Record<string, boolean> = {};
    const childParentIds = new Set(
      steps.filter((r) => r.parentStepId).map((r) => r.parentStepId as string)
    );
    steps.forEach((r) => {
      if (r.isGroup && r.id && childParentIds.has(r.id)) {
        newExpanded[r.id] = true;
      }
    });
    setExpandedGroups(newExpanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowKeys]);

  useEffect(() => {
    const v = Number(cmBaseDays) || 30;
    setBaseDays(v);
    setCustomDaysMode(v !== 30);
  }, [cmBaseDays]);

  function applyRows(next: Partial<StyleOperationStepItem>[]) {
    setIsDirty(true);
    setInvalidRowIndex(null);
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
    if (field === "stepName" && idx === invalidRowIndex && String(value || "").trim()) {
      setInvalidRowIndex(null);
    }
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

  function updateCommonNote(value: string) {
    setCommonNote(value);
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

  function openGroupPicker(row: Partial<StyleOperationStepItem>) {
    const currentRows = getCurrentRows();
    const existing = currentRows
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
  }

  function handleAddGroupItems(selectedItems: StageGroupSubItem[]) {
    const parentStepId = pickerGroupRowId.current;
    if (!parentStepId) {
      setPickerOpen(false);
      return;
    }

    const currentRows = rowsRef.current;
    const newRows = [...currentRows];

    // Selected names (lowercased for matching)
    const checkedNamesSet = new Set(
      (selectedItems || []).map((item) => item.name.toLowerCase().trim())
    );

    // 1. Remove child rows under parentStepId whose stepName is NOT in checkedNamesSet
    const filteredRows = newRows.filter((r) => {
      if (r.parentStepId === parentStepId) {
        const name = (r.stepName || "").toLowerCase().trim();
        return checkedNamesSet.has(name);
      }
      return true;
    });

    // 2. Find existing names remaining under parentStepId
    const remainingChildNames = new Set(
      filteredRows
        .filter((r) => r.parentStepId === parentStepId)
        .map((r) => (r.stepName || "").toLowerCase().trim())
    );

    // 3. Create new child rows for items that are checked but NOT yet in child rows
    const itemsToAdd: Partial<StyleOperationStepItem>[] = (selectedItems || [])
      .filter((item) => !remainingChildNames.has(item.name.toLowerCase().trim()))
      .map((item) => ({
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

    const finalRows = [...filteredRows];
    const groupIdx = finalRows.findIndex((r) => r.id === parentStepId);
    if (groupIdx >= 0) {
      let insertIdx = groupIdx + 1;
      while (
        insertIdx < finalRows.length &&
        finalRows[insertIdx].parentStepId === parentStepId
      ) {
        insertIdx++;
      }
      finalRows.splice(insertIdx, 0, ...itemsToAdd);
    } else {
      finalRows.push(...itemsToAdd);
    }

    setExpandedGroups((prev) => ({ ...prev, [parentStepId]: true }));
    applyRows(finalRows);
    setPickerOpen(false);
  }

  function addChildRowToGroup(parentRow: Partial<StyleOperationStepItem>) {
    const parentStepId = parentRow.id;
    if (!parentStepId) return;

    const currentRows = rowsRef.current;
    const newChildRow: Partial<StyleOperationStepItem> = {
      id: `child-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      stepName: "",
      description: undefined,
      timePerPiece: 0,
      ssv: 0,
      targetTotal: Number(bulkTargetTotal) || 0,
      note: "",
      stageId: null,
      parentStepId: parentStepId,
      isGroup: false,
    };

    const newRows = [...currentRows];
    const groupIdx = newRows.findIndex((r) => r.id === parentStepId);
    if (groupIdx >= 0) {
      let insertIdx = groupIdx + 1;
      while (
        insertIdx < newRows.length &&
        newRows[insertIdx].parentStepId === parentStepId
      ) {
        insertIdx++;
      }
      newRows.splice(insertIdx, 0, newChildRow);
    } else {
      newRows.push(newChildRow);
    }

    setExpandedGroups((prev) => ({ ...prev, [parentStepId]: true }));
    applyRows(newRows);
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

  function handleEditStart() {
    setRows(steps);
    rowsRef.current = steps;
    setIsDirty(false);
    setIsEditing(true);
    setPendingDiscardOpen(false);
    setInvalidRowIndex(null);
    setCommonNote(getCommonNote(steps));
  }

  function handleEditClose() {
    setRows(steps);
    rowsRef.current = steps;
    setIsDirty(false);
    setIsEditing(false);
    setPendingDiscardOpen(false);
    setInvalidRowIndex(null);
    setCommonNote(getCommonNote(steps));
  }

  function requestCloseEditor() {
    if (isDirty) {
      setPendingDiscardOpen(true);
      return;
    }
    handleEditClose();
  }

  function moveRowByOne(idx: number, direction: -1 | 1) {
    const sourceRows = getCurrentRows();
    const currentRow = sourceRows[idx];
    if (!currentRow || currentRow.parentStepId) return;

    const getBlockEnd = (startIndex: number) => {
      const row = sourceRows[startIndex];
      if (!row || !row.isGroup || !row.id) return startIndex;
      let end = startIndex;
      while (end + 1 < sourceRows.length && sourceRows[end + 1].parentStepId === row.id) {
        end++;
      }
      return end;
    };

    const currentEnd = getBlockEnd(idx);
    const currentBlock = sourceRows.slice(idx, currentEnd + 1);

    if (direction < 0) {
      let previousStart = idx - 1;
      while (previousStart >= 0 && sourceRows[previousStart]?.parentStepId) {
        previousStart--;
      }
      if (previousStart < 0) return;

      const previousEnd = getBlockEnd(previousStart);
      const previousBlock = sourceRows.slice(previousStart, previousEnd + 1);
      const nextRows = [
        ...sourceRows.slice(0, previousStart),
        ...currentBlock,
        ...previousBlock,
        ...sourceRows.slice(currentEnd + 1),
      ];
      applyRows(nextRows);
      return;
    }

    const nextStart = currentEnd + 1;
    if (nextStart >= sourceRows.length) return;
    const nextEnd = getBlockEnd(nextStart);
    const nextBlock = sourceRows.slice(nextStart, nextEnd + 1);
    const nextRows = [
      ...sourceRows.slice(0, idx),
      ...nextBlock,
      ...currentBlock,
      ...sourceRows.slice(nextEnd + 1),
    ];
    applyRows(nextRows);
  }

  async function handleDeleteRow(idx: number) {
    const sourceRows = getCurrentRows();
    const rowToRemove = sourceRows[idx];
    if (!rowToRemove) return;

    let next = sourceRows.filter((_, i) => i !== idx);
    if (rowToRemove.isGroup && rowToRemove.id) {
      next = next.filter((r) => r.parentStepId !== rowToRemove.id);
    }

    applyRows(next);
    showToast("Đã xóa công đoạn.", "success");
  }

  function handleCopyFromDialog(newSteps: Partial<StyleOperationStepItem>[]) {
    setCommonNote(getCommonNote(newSteps));
    applyRows(newSteps);
  }

  const handleExportExcel = async () => {
    if (!rows.length) return;
    try {
      if (isDirty && editable) {
        const saved = await triggerSave();
        if (!saved) return;
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
    <div
      onClick={(event) => {
        if (isEditing && event.target === event.currentTarget) {
          requestCloseEditor();
        }
      }}
      className={
        isEditing
          ? "fixed inset-0 z-[70] flex items-start justify-center overflow-hidden bg-gray-950/45 p-3 pt-6 md:items-center md:p-6"
          : "grid grid-cols-1 gap-6 lg:grid-cols-12"
      }
    >
      {/* CỘT TRÁI: Ảnh rập / Cấu trúc */}
      {!isEditing && (
        <div className="lg:col-span-3 xl:col-span-2">
          <div className="sticky top-6 space-y-4 rounded-2xl border border-gray-200/80 bg-white p-3 shadow-xs dark:border-gray-800 dark:bg-gray-900">
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
                  <StyleImagePlaceholder className="w-12 h-12 mb-2 text-gray-300 dark:text-gray-600 opacity-60" />
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
      )}

      {/* CỘT PHẢI: Bảng phân bổ công đoạn */}
      <div
        className={`min-w-0 space-y-6 ${
          isEditing
            ? "mx-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-[1320px] flex-col"
            : "lg:col-span-9 xl:col-span-10"
        }`}
      >

        {/* Main Table Card */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4 dark:border-gray-800">
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
              {!isEditing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportExcel}
                    disabled={rows.length === 0}
                  >
                    <DownloadIcon className="w-4 h-4" />
                    Xuất Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCopyDialogOpen(true)}
                  >
                    <CopyIcon className="w-4 h-4" />
                    Sao chép công đoạn
                  </Button>
                  {showEditButton && (
                    <Button variant="primary" size="sm" onClick={handleEditStart}>
                      <PencilIcon className="w-4 h-4" />
                      Chỉnh sửa
                    </Button>
                  )}
                </>
              )}
              {isEditing && (
                <>
                  <Button variant="outline" size="sm" onClick={requestCloseEditor} disabled={isSaving}>
                    Hủy
                  </Button>
                  <Button variant="outline" size="sm" onClick={addRow}>
                    <PlusIcon className="w-4 h-4" />
                    Thêm công đoạn
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={async () => {
                      const saved = await triggerSave();
                      if (saved) handleEditClose();
                    }}
                    disabled={isSaving}
                  >
                    <CheckLineIcon className="w-4 h-4" />
                    {isSaving ? "Đang lưu..." : "Lưu quy trình"}
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[720px] 2xl:min-w-[980px] table-fixed text-left text-xs">
              <thead className="sticky top-0 z-20 bg-gray-50/95 dark:bg-gray-800/95 shadow-xs">
                <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-semibold">
                  <th className="py-2 px-2 text-center w-10">#</th>
                  <th className={`w-[180px] px-2 py-2 ${editable ? "bg-brand-50/40 dark:bg-brand-950/15" : ""}`}>Tên công đoạn quy trình</th>
                  <th className={`w-[80px] px-1.5 py-2 text-center ${editable ? "bg-brand-50/40 dark:bg-brand-950/15" : "bg-amber-50/40 dark:bg-amber-950/10"}`}>
                    Thời gian (giây/SP)
                  </th>
                  <th className="py-2 px-1.5 text-center w-[58px]">% công đoạn</th>
                  <th className="py-2 px-1.5 text-center w-[62px]">SP/1H</th>
                  <th className={`w-[120px] px-2 py-2 ${editable ? "bg-brand-50/40 dark:bg-brand-950/15" : ""}`}>Ghi chú</th>
                  <th className={`py-2 px-1 text-center ${editable ? "w-[80px]" : "w-[92px]"}`}>
                    <div className="flex flex-col items-center gap-1">
                      <span className="leading-tight">CM Công Nghệ</span>
                      <div className="flex items-center justify-center gap-1">
                        {customDaysMode ? (
                          <input
                            type="number"
                            min={1}
                            max={365}
                            value={baseDays}
                            disabled={!editable}
                            onChange={(e) => setBaseDays(Number(e.target.value) || 30)}
                            onBlur={() => commitBaseDays(baseDays)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitBaseDays(baseDays);
                            }}
                            className="w-12 h-6 rounded border border-gray-200/80 bg-white/80 text-center text-[11px] font-bold text-gray-800 focus:outline-none shadow-none dark:border-gray-700 dark:bg-gray-900/70 dark:text-gray-100"
                          />
                        ) : (
                          <span className="inline-flex items-center rounded bg-brand-600 text-white px-1.5 py-0.5 text-[10px] font-bold shadow-xs">
                            30 ngày
                          </span>
                        )}
                  {editable && (
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
                            className={`relative inline-flex h-3.5 w-7 shrink-0 items-center rounded-full transition-colors cursor-pointer ${customDaysMode ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-700"
                              }`}
                            title={customDaysMode ? "Reset về 30 ngày" : "Tùy chỉnh số ngày"}
                          >
                            <span
                              className={`inline-block h-2.5 w-2.5 rounded-full bg-white shadow-xs transition-transform ${customDaysMode ? "translate-x-3.5" : "translate-x-0.5"
                                }`}
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  </th>
                  <th className="hidden w-[60px] bg-gray-100/80 px-1.5 py-2 text-center 2xl:table-cell dark:bg-gray-800/70">
                    <div>Số người</div>
                    {editable && <div className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-gray-400">Tự tính</div>}
                  </th>
                  <th className={`hidden w-[80px] px-1.5 py-2 text-center 2xl:table-cell ${editable ? "bg-brand-50/40 dark:bg-brand-950/15" : ""}`}>
                    <div className="mb-1 leading-tight">Chỉ tiêu tổng</div>
                    {editable && (
                      <>
                        <div className="mb-1 text-[9px] font-medium uppercase tracking-wide text-brand-600">Nhập chung</div>
                        <Input
                          type="number"
                          min="0"
                          value={bulkTargetTotal}
                          onChange={(e) => updateBulkTargetTotal(e.target.value)}
                          onBlur={commitBulkTargetTotal}
                          className={`${compactInputClass} w-16 px-1.5 text-center font-mono font-bold mx-auto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                          placeholder="Nhập"
                        />
                      </>
                    )}
                  </th>
                  {editable && (
                    <>
                      <th className="w-[76px] border-l border-gray-200 bg-gray-50 px-1 py-2 text-center dark:border-gray-700 dark:bg-gray-800">
                        Thứ tự
                      </th>
                      <th className="sticky right-0 z-20 w-12 border-l border-gray-200 bg-gray-50 px-1 py-2 text-center shadow-xs dark:border-gray-700 dark:bg-gray-800">
                        Xóa
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={editable ? 11 : 9}
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
                    const parentRow = isChildRow ? rows.find((r) => r.id === row.parentStepId) : null;
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
                        "bg-gray-50/70 dark:bg-gray-800/40 border-l-4 border-gray-300 dark:border-gray-700";
                    } else if (isChildRow) {
                      rowBg =
                        "bg-white dark:bg-gray-900 border-l-4 border-transparent";
                    } else {
                      rowBg = "hover:bg-gray-50/60 dark:hover:bg-gray-800/40";
                    }

                    return (
                      <tr
                        key={row.id || idx}
                        data-operation-row-index={idx}
                        className={`transition-colors ${rowBg}`}
                      >
                        <td className={`${rowPaddingY} px-2 text-center font-mono text-gray-400`}>
                          {isChildRow ? "" : visibleRowCount}
                        </td>

                        <td className={`${rowPaddingY} ${rowPaddingX} overflow-hidden`}>
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
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
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

                            {editable ? (
                              isGroupRow ? (
                                <div className="flex min-w-0 items-center gap-2 flex-1">
                                  <span className="min-w-0 truncate font-bold text-gray-800 dark:text-gray-200">
                                    {row.stepName}
                                  </span>
                                  <span className="rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 text-[10px] font-bold">
                                    NHÓM
                                  </span>
                                  {childrenCount > 0 && (
                                    <span className="text-xs text-gray-400 font-medium">
                                      ({childrenCount})
                                    </span>
                                  )}
                                  <div className="flex items-center gap-1.5 ml-2">
                                    <button
                                      type="button"
                                      onClick={() => openGroupPicker(row)}
                                      className="h-6 w-6 rounded-md bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center transition-all cursor-pointer shadow-none"
                                      title="Sửa nhóm công đoạn"
                                    >
                                      <PencilIcon className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => addChildRowToGroup(row)}
                                      className="h-6 w-6 rounded-md bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center transition-all cursor-pointer shadow-none"
                                      title="Thêm một dòng công đoạn mới vào nhóm"
                                    >
                                      <PlusIcon className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex-1 min-w-0">
                                  <StageCombobox
                                    value={row.stepName || ""}
                                    highlightEditable
                                    stageId={row.stageId}
                                    allowGroupSelection={!isChildRow}
                                    groupItems={parentRow?.groupItems}
                                    parentGroupName={parentRow?.stepName}
                                    parentGroupId={parentRow?.groupId || parentRow?.id}
                                    error={
                                      invalidRowIndex === idx
                                        ? "Vui lòng chọn tên công đoạn"
                                        : undefined
                                    }
                                    onNameChange={(val) => {
                                      updateLocal(idx, "stepName", val);
                                      if (!val) {
                                        updateLocal(idx, "stageId", null);
                                      }
                                    }}
                                    onClear={() => {
                                      updateLocal(idx, "stageId", null);
                                    }}
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
                              <span className="truncate font-medium text-gray-900 dark:text-white">
                                {row.stepName}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className={`${rowPaddingY} px-1.5 text-center bg-amber-50/15 dark:bg-amber-950/5`}>
                          {editable ? (
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
                              className={`mx-auto ${compactInputClass} w-16 px-1.5 text-center font-mono font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isGroupRow ? "bg-transparent border-transparent cursor-not-allowed" : ""
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

                        <td className={`${rowPaddingY} px-1.5 text-center font-mono font-semibold text-gray-700 dark:text-gray-300`}>
                          {percentOfTotal > 0 ? `${percentOfTotal.toFixed(0)}%` : "—"}
                        </td>

                        <td className={`${rowPaddingY} px-1.5 text-center font-mono font-bold text-brand-600 dark:text-brand-400`}>
                          {formatMetric(spPerHour, 2)}
                        </td>

                        {idx === visibleRows[0]?.idx && (
                          <td
                            rowSpan={visibleRows.length}
                            data-common-note
                            className={`${rowPaddingY} ${rowPaddingX} overflow-hidden border-l border-r border-gray-200 bg-gray-50/40 text-center align-middle dark:border-gray-700 dark:bg-gray-800/30`}
                          >
                            {editable ? (
                              <textarea
                                value={commonNote}
                                onChange={(event) => updateCommonNote(event.target.value)}
                                className="mx-auto min-h-20 w-full resize-y rounded-lg border border-brand-200 bg-brand-50/50 px-2 py-2 text-xs text-gray-900 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 dark:border-brand-800 dark:bg-brand-950/20 dark:text-white"
                                placeholder="Nhập ghi chú chung..."
                                aria-label="Ghi chú chung"
                              />
                            ) : (
                              <span
                                className="line-clamp-4 max-w-full break-words text-gray-500 dark:text-gray-400"
                                title={commonNote || undefined}
                              >
                                {commonNote || "—"}
                              </span>
                            )}
                          </td>
                        )}

                        {idx === visibleRows[0]?.idx && (
                          <td
                            rowSpan={visibleRows.length}
                            className="border-l border-r border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/40 px-2 py-2 text-center align-middle"
                          >
                            <div className="font-mono tabular-nums text-xl font-black text-gray-900 dark:text-gray-100">
                              $ {formatMetric(commonCmTechnology, 2)}
                            </div>
                          </td>
                        )}

                        <td className={`${rowPaddingY} hidden bg-gray-100/60 px-1.5 text-center font-mono font-medium text-gray-600 2xl:table-cell dark:bg-gray-800/50 dark:text-gray-300`}>
                          {formatMetric(peopleNeeded, 2)}
                        </td>

                        <td className={`${rowPaddingY} hidden 2xl:table-cell px-1.5 text-center font-mono font-bold`}>
                          {displayTargetTotal > 0 ? displayTargetTotal : "—"}
                        </td>

                        {editable && (
                          <>
                            <td className={`${rowPaddingY} border-l border-gray-200 bg-gray-50/50 px-1 text-center dark:border-gray-700 dark:bg-gray-800/50`}>
                              <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => moveRowByOne(idx, -1)}
                                disabled={idx === 0 || Boolean(row.parentStepId)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition-none hover:border-gray-400 hover:bg-gray-100 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-25 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-gray-800 dark:hover:text-white"
                                title="Đưa công đoạn lên"
                                aria-label="Đưa công đoạn lên"
                              >
                                <ChevronDownIcon className="h-4 w-4 rotate-180" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveRowByOne(idx, 1)}
                                disabled={idx === rows.length - 1 || Boolean(row.parentStepId)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition-none hover:border-gray-400 hover:bg-gray-100 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-25 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-gray-800 dark:hover:text-white"
                                title="Đưa công đoạn xuống"
                                aria-label="Đưa công đoạn xuống"
                              >
                                <ChevronDownIcon className="h-4 w-4" />
                              </button>
                              </div>
                            </td>
                            <td className={`${rowPaddingY} sticky right-0 z-10 border-l border-gray-200 bg-gray-50/95 px-1 text-center dark:border-gray-700 dark:bg-gray-800/95`}>
                              <button
                                type="button"
                                onClick={() => setDeletingRowIndex(idx)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-none hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-red-900/50 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                                title="Xóa công đoạn"
                                aria-label="Xóa công đoạn"
                              >
                                <TrashBinIcon className="h-4 w-4" />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
              {rows.length > 0 && (
                <tfoot className="sticky bottom-0 z-20 border-t-2 border-brand-500 bg-brand-50/95 dark:border-brand-500 dark:bg-brand-950/95 shadow-md">
                  <tr className="divide-x divide-brand-200/40 dark:divide-brand-900/40">
                    <td colSpan={2} className="py-2 px-2 text-right align-middle">
                      <span className="text-xs font-black uppercase text-brand-900 dark:text-brand-100 tracking-wider">
                        TỔNG CỘNG
                      </span>
                    </td>
                    <td className="py-2 px-1 text-center align-middle">
                      <div className="flex flex-col items-center justify-center gap-1 min-h-[44px]">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 dark:text-brand-300 leading-none whitespace-nowrap">
                          TỔNG
                        </span>
                        <span className="inline-flex items-center justify-center font-mono font-black text-brand-900 dark:text-brand-100 text-xs bg-white dark:bg-gray-800 px-2 py-0.5 rounded-md border border-brand-200 dark:border-brand-800 shadow-xs whitespace-nowrap">
                          {totalTime.toFixed(1)}s
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-1 text-center align-middle">
                      <div className="flex flex-col items-center justify-center gap-1 min-h-[44px]">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 dark:text-brand-300 leading-none whitespace-nowrap">
                          TỶ LỆ
                        </span>
                        <span className="inline-flex items-center justify-center font-mono font-black text-brand-900 dark:text-brand-100 text-xs bg-white dark:bg-gray-800 px-2 py-0.5 rounded-md border border-brand-200 dark:border-brand-800 shadow-xs whitespace-nowrap">
                          100%
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-1 text-center align-middle">
                      <div className="flex flex-col items-center justify-center gap-1 min-h-[44px]">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 dark:text-brand-300 leading-none whitespace-nowrap">
                          SP/NGƯỜI/NGÀY
                        </span>
                        <span className="inline-flex items-center justify-center font-mono font-black text-brand-900 dark:text-brand-100 text-xs bg-white dark:bg-gray-800 px-2 py-0.5 rounded-md border border-brand-200 dark:border-brand-800 shadow-xs whitespace-nowrap">
                          {formatMetric(productPerPersonDay, 0)}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-1 text-center align-middle">
                      <span className="text-brand-400/60 font-mono font-bold">—</span>
                    </td>
                    <td className="py-2 px-1 text-center align-middle">
                      <div className="flex flex-col items-center justify-center gap-1 min-h-[44px]">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 dark:text-brand-300 leading-none whitespace-nowrap">
                          CÔNG ĐOẠN 1K
                        </span>
                        <span className="inline-flex items-center justify-center font-mono font-black text-brand-900 dark:text-brand-100 text-xs bg-white dark:bg-gray-800 px-2 py-0.5 rounded-md border border-brand-200 dark:border-brand-800 shadow-xs whitespace-nowrap">
                          {formatMetric(oneKProductPerDay, 0)}
                        </span>
                      </div>
                    </td>
                    <td className="hidden 2xl:table-cell py-2 px-1 text-center align-middle font-mono font-bold text-xs text-brand-900 dark:text-brand-100">
                      —
                    </td>
                    <td className="hidden 2xl:table-cell py-2 px-1 text-center align-middle font-mono font-bold text-xs text-brand-900 dark:text-brand-100">
                      —
                    </td>
                    {editable && (
                      <>
                        <td className="border-l border-brand-200/60 bg-brand-50 px-1 py-2 text-center align-middle dark:border-brand-800/60 dark:bg-brand-950" />
                        <td className="sticky right-0 z-20 border-l border-brand-200/60 bg-brand-50 px-1 py-2 text-center align-middle dark:border-brand-800/60 dark:bg-brand-950" />
                      </>
                    )}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

      </div>

      <UnsavedChangesDialog
        isOpen={pendingDiscardOpen}
        onConfirmLeave={handleEditClose}
        onCancel={() => setPendingDiscardOpen(false)}
      />

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
            void handleDeleteRow(idx);
          }}
          onClose={() => setDeletingRowIndex(null)}
        />
      )}

      <Toast
        open={Boolean(toast)}
        message={toast?.message ?? ""}
        variant={toast?.variant}
        onClose={hideToast}
      />
    </div>
  );
}
