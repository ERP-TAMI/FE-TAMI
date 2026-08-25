import { useState, useEffect } from "react";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/shared/Button";
import { stageApi } from "@/api/stage.api";
import { stylesApi } from "@/api/stylesApi";
import { styleOperationStepsApi, type StyleOperationStepItem } from "@/api/styleOperationStepsApi";
import type { Stage } from "@/types/stage";
import type { Style } from "@/types/style";
import { CopyIcon, FileIcon, CheckLineIcon } from "@/icons";


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
  const [activeTab, setActiveTab] = useState<"template" | "other-style">("template");
  const [masterStages, setMasterStages] = useState<Stage[]>([]);
  const [selectedMasterStageIds, setSelectedMasterStageIds] = useState<string[]>([]);
  const [otherStyles, setOtherStyles] = useState<Array<Style & { steps?: StyleOperationStepItem[] }>>([]);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    stageApi.list().then(setMasterStages).catch(() => {});

    stylesApi.getStyles({ page: 1, limit: 100 }).then(async (res) => {
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
    }).catch(() => {});
  }, [open, currentStyleId]);

  const handleSelectMasterStage = (stageId: string) => {
    setSelectedMasterStageIds((prev) =>
      prev.includes(stageId)
        ? prev.filter((id) => id !== stageId)
        : [...prev, stageId],
    );
  };

  const handleSelectAllMasterStages = () => {
    if (selectedMasterStageIds.length === masterStages.length) {
      setSelectedMasterStageIds([]);
    } else {
      setSelectedMasterStageIds(masterStages.map((s) => s.id));
    }
  };

  const handleCopyFromTemplate = () => {
    const selected = masterStages.filter((s) =>
      selectedMasterStageIds.includes(s.id),
    );
    const newSteps: Partial<StyleOperationStepItem>[] = selected.map((stage, idx) => ({
      id: `copy-tpl-${Date.now()}-${idx}`,
      stageId: stage.id,
      stepName: stage.stageName,
      description: stage.description || "",
      timePerPiece: Number(stage.ssv) || 0,
      ssv: Number(stage.ssv) || 0,
      orderIndex: idx,
      isGroup: false,
    }));

    onCopy(newSteps);
    handleClose();
  };

  const handleCopyFromStyle = () => {
    const sourceStyle = otherStyles.find((s) => s.id === selectedStyleId);
    if (!sourceStyle || !sourceStyle.steps) return;

    const newSteps: Partial<StyleOperationStepItem>[] = sourceStyle.steps.map(
      (step, idx) => ({
        id: `copy-style-${Date.now()}-${idx}`,
        stageId: step.stageId,
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
      }),
    );

    onCopy(newSteps);
    handleClose();
  };

  const handleClose = () => {
    setSelectedMasterStageIds([]);
    setSelectedStyleId(null);
    onOpenChange(false);
  };

  const totalSsv = masterStages
    .filter((s) => selectedMasterStageIds.includes(s.id))
    .reduce((sum, s) => sum + Number(s.ssv || 0), 0);


  const footer = (
    <div className="flex gap-2 justify-end w-full">
      <Button variant="outline" size="sm" onClick={handleClose}>
        Hủy
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={
          activeTab === "template"
            ? handleCopyFromTemplate
            : handleCopyFromStyle
        }
        disabled={
          activeTab === "template"
            ? selectedMasterStageIds.length === 0
            : !selectedStyleId
        }
      >
        <CopyIcon className="w-4 h-4 mr-1" />
        Sao chép{" "}
        {activeTab === "template"
          ? `${selectedMasterStageIds.length} công đoạn`
          : "từ Style"}
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      title="Sao chép bảng quy trình công đoạn"
      onClose={handleClose}
      footer={footer}
    >
      <div className="space-y-4">
        {/* Sub Navigation Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setActiveTab("template")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "template"
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <FileIcon className="w-3.5 h-3.5" />
            Từ dữ liệu nền (Master Data)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("other-style")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "other-style"
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <CopyIcon className="w-3.5 h-3.5" />
            Từ mẫu Fit khác
          </button>
        </div>


        {activeTab === "template" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Chọn công đoạn quy trình:
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllMasterStages}
                className="h-7 text-[11px]"
              >
                {selectedMasterStageIds.length === masterStages.length
                  ? "Bỏ chọn tất cả"
                  : "Chọn tất cả"}
              </Button>
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 border rounded-xl dark:border-gray-800">
              {masterStages.length === 0 ? (
                <p className="p-4 text-center text-xs text-gray-400">
                  Không có công đoạn nào trong dữ liệu nền.
                </p>
              ) : (
                masterStages.map((stage) => {
                  const isSelected = selectedMasterStageIds.includes(stage.id);
                  return (
                    <label
                      key={stage.id}
                      className={`flex items-center justify-between p-2.5 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-brand-50/50 dark:bg-brand-950/20"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectMasterStage(stage.id)}
                          className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-900 dark:text-white">
                              {stage.stageName}
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">
                              {stage.stageCode}
                            </span>
                          </div>
                          {stage.description && (
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                              {stage.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                        {Number(stage.ssv).toFixed(3)} SSV
                      </span>

                    </label>
                  );
                })
              )}
            </div>

            {selectedMasterStageIds.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-brand-50 dark:bg-brand-950/30 rounded-xl border border-brand-100 dark:border-brand-900/40">
                <span className="text-xs font-medium text-brand-900 dark:text-brand-200">
                  Tổng SSV các công đoạn đã chọn:
                </span>
                <span className="font-mono text-sm font-bold text-brand-700 dark:text-brand-300">
                  {totalSsv.toFixed(3)}s
                </span>
              </div>
            )}
          </div>
        )}

        {activeTab === "other-style" && (
          <div className="space-y-3">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
              Chọn mẫu Fit nguồn:
            </span>

            <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 border rounded-xl dark:border-gray-800">
              {otherStyles.length === 0 ? (
                <p className="p-4 text-center text-xs text-gray-400">
                  Không có mẫu Fit nào có quy trình công đoạn sẵn có.
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
                          className="h-4 w-4 text-brand-500 focus:ring-brand-500"
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
        )}
      </div>
    </Modal>
  );
}
