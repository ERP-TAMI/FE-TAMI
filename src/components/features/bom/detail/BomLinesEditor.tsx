import { useCallback, useEffect } from "react";
import { ConfirmDialog } from "@/components/shared";
import { EntityHistoryButton } from "@/components/features/audit/EntityHistoryButton";
import { useSaveBomCosts, useSaveBomLines } from "@/hooks/useBoms";
import { useBomLinesDraft, type BomDraftMode } from "@/hooks/useBomLinesDraft";
import { useUnsavedChangesWarning } from "@/hooks/useNavigationBlocker";
import { canEditBomLines, canEditUnitCost } from "@/lib/bomAccess";
import { useAuthStore } from "@/store/authStore";
import type { BomLineItem } from "@/types/bom";
import { BomLinesTable } from "./BomLinesTable";
import { BomAddMaterialDrawer } from "./BomAddMaterialDrawer";

const UNSAVED_MESSAGE =
  "Bạn có thay đổi định mức chưa lưu. Nếu rời khỏi trang lúc này, các thay đổi sẽ bị mất.";

interface BomLinesEditorProps {
  bomId: string;
  bomCode: string;
  /** Tiêu đề dòng đầu khi xuất Excel NPL, vd "3475852BO- BEALLS OUTLET". Mặc định dùng bomCode. */
  exportTitle?: string;
  rowVersion: number;
  lines: BomLineItem[];
  readOnly?: boolean;
  currentStatus: string;
  isHistorical?: boolean;
  /** Revision đang xem — bỏ bản nháp khi đổi phiên bản. */
  revisionId?: string;
  revisionNo?: number;
  costPerUnit?: number | null;
  currentOrderQuantity?: number | null;
  currentOrderCost?: number | null;
  isDrawerOpen: boolean;
  onDrawerOpenChange: (open: boolean) => void;
  showToast: (message: string, variant: "success" | "error") => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export function BomLinesEditor({
  bomId,
  bomCode,
  exportTitle,
  rowVersion,
  lines,
  readOnly = false,
  currentStatus,
  isHistorical = false,
  revisionId,
  revisionNo,
  costPerUnit,
  currentOrderQuantity,
  currentOrderCost,
  isDrawerOpen,
  onDrawerOpenChange,
  showToast,
  onDirtyChange,
}: BomLinesEditorProps) {
  const user = useAuthStore((state) => state.user);

  const mode: BomDraftMode = canEditUnitCost(user, currentStatus, isHistorical)
    ? "costs"
    : "technical";
  const canEdit = !readOnly && canEditBomLines(user, currentStatus, isHistorical);

  const draft = useBomLinesDraft(lines, mode);
  const saveLines = useSaveBomLines(bomId);
  const saveCosts = useSaveBomCosts(bomId);
  const isSaving = saveLines.isPending || saveCosts.isPending;

  const blocker = useUnsavedChangesWarning(draft.isDirty, UNSAVED_MESSAGE);

  const { isEditing, start, cancel } = draft;
  useEffect(() => {
    // Đổi sang phiên bản khác thì bỏ nháp của phiên bản cũ
    cancel();
  }, [revisionId, cancel]);

  useEffect(() => {
    // Kế toán nhập giá nên bảng luôn ở chế độ nhập, không cần bấm Chỉnh sửa
    if (mode === "costs" && canEdit && !isEditing && !isSaving) start();
  }, [mode, canEdit, isEditing, isSaving, start]);

  useEffect(() => {
    onDirtyChange?.(draft.isDirty);
  }, [draft.isDirty, onDirtyChange]);

  const handleSave = useCallback(async () => {
    try {
      if (mode === "costs") {
        const items = draft.buildCostsPayload();
        if (items.length > 0) {
          await saveCosts.mutateAsync({ items, expectedRowVersion: rowVersion });
        }
      } else {
        await saveLines.mutateAsync({
          lines: draft.buildLinesPayload(),
          expectedRowVersion: rowVersion,
        });
      }
      draft.commit();
      showToast("Đã lưu định mức", "success");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(
        axiosErr?.response?.data?.message || axiosErr?.message || "Lỗi khi lưu định mức",
        "error",
      );
    }
  }, [mode, draft, saveCosts, saveLines, rowVersion, showToast]);

  const handleCancel = useCallback(() => {
    draft.cancel();
    onDrawerOpenChange(false);
  }, [draft, onDrawerOpenChange]);

  return (
    <>
      <BomLinesTable
        rows={draft.rows}
        bomCode={bomCode}
        exportTitle={exportTitle}
        mode={mode}
        canEdit={canEdit}
        isEditing={draft.isEditing}
        isSaving={isSaving}
        dirtyCount={draft.dirtyCount}
        costPerUnit={costPerUnit}
        currentOrderQuantity={currentOrderQuantity}
        currentOrderCost={currentOrderCost}
        historySlot={
          revisionId ? (
            <EntityHistoryButton
              aggregateType="BomRevision"
              parentId={revisionId}
              title={`Lịch sử sửa đổi phiên bản ${revisionNo ?? "đang xem"}`}
              label={`Lịch sử phiên bản ${revisionNo ?? "đang xem"}`}
              size="md"
            />
          ) : undefined
        }
        onStartEdit={draft.start}
        onCancel={handleCancel}
        onSave={() => void handleSave()}
        onAddMaterial={() => onDrawerOpenChange(true)}
        onChangeField={draft.setField}
        onRemove={draft.removeRow}
        onMove={draft.moveRow}
      />

      {isDrawerOpen && draft.isEditing && mode === "technical" && canEdit && (
        <BomAddMaterialDrawer
          isOpen
          onClose={() => onDrawerOpenChange(false)}
          existingMaterialIds={draft.existingMaterialIds}
          onAdd={draft.addMaterials}
        />
      )}

      <ConfirmDialog
        open={blocker.state === "blocked"}
        title="Dữ liệu chưa lưu"
        description={`${UNSAVED_MESSAGE} Vui lòng bấm Lưu để không bị mất dữ liệu!`}
        confirmLabel="Rời khỏi trang (Bỏ thay đổi)"
        closeOnClickOutside
        cancelLabel="Tiếp tục chỉnh sửa"
        variant="danger"
        onClose={() => {
          if (blocker.state === "blocked") blocker.reset();
        }}
        onConfirm={() => {
          draft.cancel();
          if (blocker.state === "blocked") blocker.proceed();
        }}
      />
    </>
  );
}
