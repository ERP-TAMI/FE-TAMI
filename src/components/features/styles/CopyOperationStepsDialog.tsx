import { useState, useEffect } from "react";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/shared/Button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { stylesApi } from "@/api/stylesApi";
import { styleOperationStepsApi, type StyleOperationStepItem } from "@/api/styleOperationStepsApi";
import type { Style } from "@/types/style";
import { CopyIcon, CheckLineIcon } from "@/icons";

export interface CopyOperationStepsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStyleId?: string;
  onCopy: (steps: Partial<StyleOperationStepItem>[]) => void;
}

export function CopyOperationStepsDialog({
  open,
  onOpenChange,
  currentStyleId,
  onCopy,
}: CopyOperationStepsDialogProps) {
  const [otherStyles, setOtherStyles] = useState<Array<Style & { steps?: StyleOperationStepItem[] }>>([]);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    stylesApi
      .getStyles({ page: 1, limit: 100 })
      .then(async (res) => {
        const stylesList = res.data.filter((s) => s.id !== currentStyleId);
        const withSteps = await Promise.all(
          stylesList.map(async (s) => {
            try {
              const steps = await styleOperationStepsApi.getSteps(s.id);
              return { ...s, steps };
            } catch {
              return { ...s, steps: [] };
            }
          }),
        );
        setOtherStyles(withSteps.filter((s) => (s.steps?.length ?? 0) > 0));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, currentStyleId]);

  const handleRequestCopy = () => {
    if (!selectedStyleId) return;
    setConfirmOpen(true);
  };

  const handleConfirmCopy = () => {
    const sourceStyle = otherStyles.find((s) => s.id === selectedStyleId);
    if (!sourceStyle || !sourceStyle.steps) return;

    // Map ID cũ sang ID mới để duy trì chính xác mối quan hệ nhóm cha - công đoạn con
    const idMap: Record<string, string> = {};
    sourceStyle.steps.forEach((step, idx) => {
      if (step.id) {
        idMap[step.id] = `copy-style-${Date.now()}-${idx}`;
      }
    });

    const newSteps: Partial<StyleOperationStepItem>[] = sourceStyle.steps.map(
      (step, idx) => {
        const newId = step.id ? idMap[step.id] : `copy-style-${Date.now()}-${idx}`;
        const newParentStepId =
          step.parentStepId && idMap[step.parentStepId]
            ? idMap[step.parentStepId]
            : step.parentStepId || null;

        return {
          id: newId,
          parentStepId: newParentStepId,
          stageId: step.stageId || null,
          stepName: step.stepName,
          description: step.description || "",
          timePerPiece: step.timePerPiece || 0,
          ssv: step.ssv || 0,
          targetTotal: step.targetTotal || 0,
          note: step.note || "",
          orderIndex: idx,
          isGroup: step.isGroup,
          groupId: step.groupId,
          groupItems: step.groupItems,
        };
      },
    );

    onCopy(newSteps);
    setConfirmOpen(false);
    handleClose();
  };

  const handleClose = () => {
    setSelectedStyleId(null);
    setConfirmOpen(false);
    onOpenChange(false);
  };

  const selectedStyle = otherStyles.find((s) => s.id === selectedStyleId);
  const selectedStepCount = selectedStyle?.steps?.length ?? 0;

  const footer = (
    <div className="flex gap-2 justify-end w-full">
      <Button variant="outline" size="sm" onClick={handleClose}>
        Hủy
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={handleRequestCopy}
        disabled={!selectedStyleId}
      >
        <CopyIcon className="w-4 h-4 mr-1" />
        Sao chép {selectedStyleId ? `${selectedStepCount} công đoạn` : "từ mẫu Fit"}
      </Button>
    </div>
  );

  return (
    <>
      <Modal
        open={open}
        title="Sao chép bảng quy trình công đoạn từ mẫu Fit khác"
        onClose={handleClose}
        footer={footer}
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Chọn một mẫu Fit nguồn đã có sẵn quy trình công đoạn để sao chép:
          </p>

          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 border rounded-xl dark:border-gray-800">
            {loading ? (
              <div className="p-8 text-center text-xs text-gray-400 animate-pulse">
                Đang tải danh sách mẫu Fit...
              </div>
            ) : otherStyles.length === 0 ? (
              <p className="p-8 text-center text-xs text-gray-400">
                Không tìm thấy mẫu Fit nào khác có sẵn quy trình công đoạn.
              </p>
            ) : (
              otherStyles.map((style) => {
                const isSelected = selectedStyleId === style.id;
                const stepCount = style.steps?.length ?? 0;
                const totalStyleSsv = (style.steps || []).reduce(
                  (sum, s) => sum + (Number(s.ssv) || 0),
                  0,
                );

                return (
                  <label
                    key={style.id}
                    className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-brand-50/50 dark:bg-brand-950/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="style-select"
                        checked={isSelected}
                        onChange={() => setSelectedStyleId(style.id)}
                        className="h-4 w-4 text-brand-500 focus:ring-brand-500 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-brand-600 dark:text-brand-400">
                            {style.styleCode}
                          </span>
                          <span className="text-xs font-semibold text-gray-900 dark:text-white">
                            {style.styleName}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                          {stepCount} công đoạn · Tổng SSV: {totalStyleSsv.toFixed(3)}s
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckLineIcon className="w-4 h-4 text-brand-500 shrink-0" />
                    )}
                  </label>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      {confirmOpen && selectedStyle && (
        <ConfirmDialog
          open
          title="Xác nhận sao chép quy trình công đoạn"
          description={
            <>
              Bạn có chắc chắn muốn sao chép{" "}
              <strong className="text-gray-900 dark:text-white font-semibold">
                {selectedStepCount} công đoạn
              </strong>{" "}
              từ mẫu Fit{" "}
              <strong className="text-brand-600 dark:text-brand-400 font-semibold">
                {selectedStyle.styleCode} - {selectedStyle.styleName}
              </strong>
              ? Danh sách công đoạn hiện tại sẽ bị ghi đè thay thế bằng công đoạn mới sao chép.
            </>
          }
          confirmLabel="Đồng ý sao chép"
          variant="primary"
          onConfirm={handleConfirmCopy}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}
