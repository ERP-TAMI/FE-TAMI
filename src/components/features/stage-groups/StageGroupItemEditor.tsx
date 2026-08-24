import { useState } from "react";
import { Button, Select } from "@/components/shared";
import { ArrowDownIcon, ArrowUpIcon, PencilIcon, TrashBinIcon } from "@/icons";

export type StageGroupStageOption = {
  id: string;
  stageCode: string;
  stageName: string;
  description: string | null;
  ssv: string;
  isInactive?: boolean;
};

type OrderedItem = { fieldId: string; stageId: string };

type StageGroupItemEditorProps = {
  items: OrderedItem[];
  stagesById: Map<string, StageGroupStageOption>;
  availableStages: StageGroupStageOption[];
  selectedStageId: string;
  error?: string;
  onSelectedStageChange: (stageId: string) => void;
  onAdd: () => void;
  onMove: (from: number, to: number) => void;
  onChange: (index: number, stageId: string) => void;
  onRemove: (index: number) => void;
};

export function StageGroupItemEditor({
  items,
  stagesById,
  availableStages,
  selectedStageId,
  error,
  onSelectedStageChange,
  onAdd,
  onMove,
  onChange,
  onRemove,
}: StageGroupItemEditorProps) {
  const [changingIndex, setChangingIndex] = useState<number>();

  return (
    <fieldset className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
      <legend className="px-1 text-sm font-semibold text-gray-900 dark:text-white">
        Danh sách công đoạn
      </legend>
      <div className="flex flex-col items-end gap-3 sm:flex-row">
        <div className="w-full flex-1">
          <Select
            label="Chọn công đoạn"
            value={selectedStageId}
            options={[
              { label: "Chọn công đoạn để thêm", value: "" },
              ...availableStages.map((stage) => ({
                value: stage.id,
                label: `${stage.stageCode} — ${stage.stageName}`,
              })),
            ]}
            onChange={(event) => onSelectedStageChange(event.target.value)}
          />
        </div>
        <Button type="button" variant="outline" disabled={!selectedStageId} onClick={onAdd}>
          Thêm công đoạn
        </Button>
      </div>

      {error && (
        <p className="text-theme-xs text-error-500" role="alert">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div className="rounded-lg bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
          Chưa có công đoạn nào trong nhóm.
        </div>
      ) : (
        <ol className="space-y-2" aria-label="Thứ tự công đoạn trong nhóm">
          {items.map((item, index) => {
            const stage = stagesById.get(item.stageId)!;
            return (
              <li
                key={item.fieldId}
                className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50/70 p-3 sm:flex-row sm:items-center dark:border-gray-700 dark:bg-gray-800/40"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  {changingIndex === index ? (
                    <Select
                      aria-label={`Thay công đoạn ở vị trí ${index + 1}`}
                      value={item.stageId}
                      options={[stage, ...availableStages].map((option) => ({
                        value: option.id,
                        label: `${option.stageCode} — ${option.stageName}`,
                      }))}
                      onChange={(event) => {
                        onChange(index, event.target.value);
                        setChangingIndex(undefined);
                      }}
                    />
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {stage.stageCode}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        {stage.stageName}
                      </span>
                      {stage.isInactive && (
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          Đã tắt
                        </span>
                      )}
                    </div>
                  )}
                  <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                    SSV: {stage.ssv} giây · {stage.description || "Không có mô tả"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Thay công đoạn ${stage.stageName}`}
                    title="Thay công đoạn"
                    onClick={() => setChangingIndex(index)}
                    className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <PencilIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Đưa ${stage.stageName} lên`}
                    title="Đưa lên"
                    disabled={index === 0}
                    onClick={() => onMove(index, index - 1)}
                    className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <ArrowUpIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Đưa ${stage.stageName} xuống`}
                    title="Đưa xuống"
                    disabled={index === items.length - 1}
                    onClick={() => onMove(index, index + 1)}
                    className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <ArrowDownIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Xóa ${stage.stageName} khỏi nhóm`}
                    title="Xóa khỏi nhóm"
                    onClick={() => onRemove(index)}
                    className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300"
                  >
                    <TrashBinIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </fieldset>
  );
}
