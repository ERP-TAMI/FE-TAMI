import { useEffect, useRef, useState } from "react";
import { Select, Table } from "@/components/shared";
import type { TableColumn } from "@/components/shared/Table";
import { HorizontaLDots } from "@/icons";
import { StageGroupItemActions } from "./StageGroupItemActions";
import { StageGroupItemSsvCell } from "./StageGroupItemSsvCell";
import type {
  StageGroupEditableField,
  StageGroupItemFieldErrors,
  StageGroupOrderedItem,
} from "./StageGroupItemEditor";
import { useStageGroupItemDrag } from "./useStageGroupItemDrag";

type EditorRow = StageGroupOrderedItem & { position: number };
type StageGroupItemTableProps = {
  items: StageGroupOrderedItem[];
  itemErrors?: StageGroupItemFieldErrors[];
  onMove: (from: number, to: number) => void;
  onChange: (index: number, field: StageGroupEditableField, value: string) => void;
  onRemove: (index: number) => void;
};

const inputClass =
  "h-9 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900";

export function StageGroupItemTable({
  items,
  itemErrors = [],
  onMove,
  onChange,
  onRemove,
}: StageGroupItemTableProps) {
  const [editingIndex, setEditingIndex] = useState<number>();
  const previousItemCount = useRef(items.length);
  const rows: EditorRow[] = items.map((item, position) => ({ ...item, position }));
  const firstErrorIndex = itemErrors.findIndex((error) => Object.values(error ?? {}).some(Boolean));

  useEffect(() => {
    if (items.length > previousItemCount.current) setEditingIndex(items.length - 1);
    previousItemCount.current = items.length;
  }, [items.length]);

  useEffect(() => {
    if (firstErrorIndex >= 0) setEditingIndex(firstErrorIndex);
  }, [firstErrorIndex]);

  const isBlockedByError = firstErrorIndex >= 0;
  const moveItem = (from: number, to: number) => {
    if (isBlockedByError) return;
    setEditingIndex(undefined);
    onMove(from, to);
  };
  const { getRowProps } = useStageGroupItemDrag({
    rows,
    disabled: editingIndex !== undefined || isBlockedByError,
    onMove: moveItem,
  });
  const textInput = (row: EditorRow, field: "itemName" | "description", label: string) => {
    const error = itemErrors[row.position]?.[field];
    return (
      <div className="space-y-1">
        <input
          aria-label={`${label} ở vị trí ${row.position + 1}`}
          aria-invalid={Boolean(error)}
          value={row[field]}
          onChange={(event) => onChange(row.position, field, event.target.value)}
          className={`${inputClass} ${error ? "border-error-500" : ""}`}
        />
        {error && (
          <span className="text-theme-xs text-error-500 block" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  };

  const columns: TableColumn<EditorRow>[] = [
    {
      key: "position",
      header: "STT",
      width: "w-[6%]",
      align: "center",
      render: (row) => (
        <span className="inline-flex items-center justify-center gap-1 font-semibold tabular-nums">
          <HorizontaLDots className="h-4 w-4 rotate-90 text-gray-400" aria-hidden="true" />
          {row.position + 1}
        </span>
      ),
    },
    {
      key: "name",
      header: "Tên công đoạn con",
      width: "w-[24%]",
      render: (row) =>
        editingIndex === row.position ? (
          textInput(row, "itemName", "Tên công đoạn con")
        ) : (
          <span className="block truncate font-semibold text-gray-900 dark:text-white">
            {row.itemName || "Chưa nhập tên"}
          </span>
        ),
    },
    {
      key: "description",
      header: "Mô tả",
      width: "w-[27%]",
      render: (row) =>
        editingIndex === row.position ? (
          textInput(row, "description", "Mô tả công đoạn con")
        ) : (
          <span className="block truncate text-gray-500 dark:text-gray-400">
            {row.description || "—"}
          </span>
        ),
    },
    {
      key: "ssv",
      header: "SSV (giây)",
      width: "w-[12%]",
      align: "right",
      render: (row) => (
        <StageGroupItemSsvCell
          fieldId={row.fieldId}
          itemName={row.itemName || `vị trí ${row.position + 1}`}
          value={row.ssv}
          error={itemErrors[row.position]?.ssv}
          isEditing={editingIndex === row.position}
          onChange={(value) => onChange(row.position, "ssv", value)}
        />
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "w-[13%]",
      render: (row) =>
        editingIndex === row.position ? (
          <Select
            aria-label={`Trạng thái công đoạn con ${row.itemName || row.position + 1}`}
            value={row.status}
            options={[
              { value: "active", label: "Đang sử dụng" },
              { value: "inactive", label: "Đã tắt" },
            ]}
            onChange={(event) => onChange(row.position, "status", event.target.value)}
            className="h-9 px-2"
          />
        ) : (
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
              row.status === "active"
                ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            {row.status === "active" ? "Đang sử dụng" : "Đã tắt"}
          </span>
        ),
    },
    {
      key: "actions",
      header: "Thao tác",
      width: "w-[18%]",
      align: "center",
      render: (row) => (
        <StageGroupItemActions
          itemName={row.itemName || `vị trí ${row.position + 1}`}
          position={row.position}
          itemCount={items.length}
          isEditing={editingIndex === row.position}
          hasError={Object.values(itemErrors[row.position] ?? {}).some(Boolean)}
          editDisabled={isBlockedByError && editingIndex !== row.position}
          moveDisabled={isBlockedByError}
          removeDisabled={isBlockedByError && editingIndex !== row.position}
          onToggleEdit={() =>
            setEditingIndex(editingIndex === row.position ? undefined : row.position)
          }
          onMove={moveItem}
          onRemove={(index) => {
            setEditingIndex(undefined);
            onRemove(index);
          }}
        />
      ),
    },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <Table
        embedded
        tableClassName="min-w-[1050px]"
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.fieldId}
        getRowProps={getRowProps}
        emptyMessage="Chưa có công đoạn con nào trong nhóm."
      />
    </div>
  );
}
