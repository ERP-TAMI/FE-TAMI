import { Button } from "@/components/shared";
import type { StageGroupStatus } from "@/types/stage-group";
import { StageGroupItemTable } from "./StageGroupItemTable";

export type StageGroupOrderedItem = {
  fieldId: string;
  id?: string;
  itemName: string;
  description: string;
  ssv: string;
  status: StageGroupStatus;
};

export type StageGroupEditableField = Exclude<keyof StageGroupOrderedItem, "fieldId" | "id">;

export type StageGroupItemFieldErrors = Partial<
  Record<"itemName" | "description" | "ssv" | "status", string>
>;

type StageGroupItemEditorProps = {
  items: StageGroupOrderedItem[];
  error?: string;
  itemErrors?: StageGroupItemFieldErrors[];
  onAdd: () => void;
  onMove: (from: number, to: number) => void;
  onChange: (index: number, field: StageGroupEditableField, value: string) => void;
  onRemove: (index: number) => void;
};

export function StageGroupItemEditor({
  items,
  error,
  itemErrors,
  onAdd,
  onMove,
  onChange,
  onRemove,
}: StageGroupItemEditorProps) {
  return (
    <fieldset className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
      <legend className="px-1 text-sm font-semibold text-gray-900 dark:text-white">
        Danh sách công đoạn con
      </legend>
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={onAdd}>
          Thêm công đoạn con
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
        itemErrors={itemErrors}
        onMove={onMove}
        onChange={onChange}
        onRemove={onRemove}
      />
    </fieldset>
  );
}
