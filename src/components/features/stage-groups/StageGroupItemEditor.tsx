import { Button, Select } from "@/components/shared";
import { StageGroupItemTable } from "./StageGroupItemTable";

export type StageGroupStageOption = {
  id: string;
  stageCode: string;
  stageName: string;
  description: string | null;
  ssv: string;
  isInactive?: boolean;
};

export type StageGroupOrderedItem = {
  fieldId: string;
  stageId: string;
  ssv: string;
};

type StageGroupItemEditorProps = {
  items: StageGroupOrderedItem[];
  stagesById: Map<string, StageGroupStageOption>;
  availableStages: StageGroupStageOption[];
  selectedStageId: string;
  error?: string;
  ssvErrors?: Array<string | undefined>;
  onSelectedStageChange: (stageId: string) => void;
  onAdd: () => void;
  onMove: (from: number, to: number) => void;
  onStageChange: (index: number, stageId: string) => void;
  onSsvChange: (index: number, ssv: string) => void;
  onRemove: (index: number) => void;
};

export function StageGroupItemEditor({
  items,
  stagesById,
  availableStages,
  selectedStageId,
  error,
  ssvErrors,
  onSelectedStageChange,
  onAdd,
  onMove,
  onStageChange,
  onSsvChange,
  onRemove,
}: StageGroupItemEditorProps) {
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

      {items.length > 1 && (
        <p className="text-theme-xs text-gray-500 dark:text-gray-400">
          Giữ chuột và kéo một dòng để đổi STT, hoặc dùng nút lên/xuống ở cột Thao tác.
        </p>
      )}

      <StageGroupItemTable
        items={items}
        stagesById={stagesById}
        availableStages={availableStages}
        ssvErrors={ssvErrors}
        onMove={onMove}
        onStageChange={onStageChange}
        onSsvChange={onSsvChange}
        onRemove={onRemove}
      />
    </fieldset>
  );
}
