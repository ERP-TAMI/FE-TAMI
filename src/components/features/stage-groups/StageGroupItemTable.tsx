import { useState } from "react";
import { Select, Table } from "@/components/shared";
import type { TableColumn } from "@/components/shared/Table";
import { HorizontaLDots } from "@/icons";
import { StageGroupItemActions } from "./StageGroupItemActions";
import { StageGroupItemSsvCell, type StageGroupItemSsvCellProps } from "./StageGroupItemSsvCell";
import type { StageGroupOrderedItem, StageGroupStageOption } from "./StageGroupItemEditor";
import { useStageGroupItemDrag } from "./useStageGroupItemDrag";

type EditorRow = StageGroupOrderedItem & {
  position: number;
  stage: StageGroupStageOption;
};

type StageGroupItemTableProps = {
  items: StageGroupOrderedItem[];
  stagesById: Map<string, StageGroupStageOption>;
  availableStages: StageGroupStageOption[];
  ssvErrors?: Array<string | undefined>;
  onMove: (from: number, to: number) => void;
  onStageChange: (index: number, stageId: string) => void;
  onSsvChange: (index: number, ssv: string) => void;
  onRemove: (index: number) => void;
};

export function StageGroupItemTable({
  items,
  stagesById,
  availableStages,
  ssvErrors = [],
  onMove,
  onStageChange,
  onSsvChange,
  onRemove,
}: StageGroupItemTableProps) {
  const [editingIndex, setEditingIndex] = useState<number>();
  const rows: EditorRow[] = items.map((item, position) => ({
    ...item,
    position,
    stage: stagesById.get(item.stageId)!,
  }));
  const activeSsvErrorIndex =
    editingIndex !== undefined && ssvErrors[editingIndex] ? editingIndex : undefined;
  const isBlockedBySsvError = activeSsvErrorIndex !== undefined;

  const closeEditorAndMove = (from: number, to: number) => {
    if (isBlockedBySsvError) return;
    setEditingIndex(undefined);
    onMove(from, to);
  };
  const closeEditorAndRemove = (index: number) => {
    if (isBlockedBySsvError && index !== activeSsvErrorIndex) return;
    setEditingIndex(undefined);
    onRemove(index);
  };
  const { getRowProps } = useStageGroupItemDrag({
    rows,
    disabled: editingIndex !== undefined,
    onMove: closeEditorAndMove,
  });
  const renderSsvCell = (row: EditorRow) => {
    const props: StageGroupItemSsvCellProps = {
      fieldId: row.fieldId,
      stageName: row.stage.stageName,
      value: row.ssv,
      error: ssvErrors[row.position],
      isEditing: editingIndex === row.position,
      onChange: (value) => onSsvChange(row.position, value),
    };
    return <StageGroupItemSsvCell {...props} />;
  };

  const columns: TableColumn<EditorRow>[] = [
    {
      key: "position",
      header: "STT",
      width: "w-[6%]",
      align: "center",
      render: (row) => (
        <span className="inline-flex items-center justify-center gap-1 font-semibold tabular-nums">
          <HorizontaLDots
            className="h-4 w-4 rotate-90 text-gray-400"
            aria-hidden="true"
          />
          {row.position + 1}
        </span>
      ),
    },
    {
      key: "code",
      header: "Mã công đoạn",
      width: "w-[18%]",
      render: (row) =>
        editingIndex === row.position ? (
          <Select
            aria-label={`Thay công đoạn ở vị trí ${row.position + 1}`}
            value={row.stageId}
            options={[row.stage, ...availableStages].map((stage) => ({
              value: stage.id,
              label: `${stage.stageCode} — ${stage.stageName}`,
            }))}
            onChange={(event) => onStageChange(row.position, event.target.value)}
            className="h-9 px-2"
          />
        ) : (
          <span
            title={row.stage.stageCode}
            className="block truncate font-semibold text-gray-900 dark:text-white"
          >
            {row.stage.stageCode}
          </span>
        ),
    },
    {
      key: "name",
      header: "Tên công đoạn",
      width: "w-[18%]",
      render: (row) => (
        <span title={row.stage.stageName} className="block truncate">
          {row.stage.stageName}
        </span>
      ),
    },
    {
      key: "description",
      header: "Mô tả",
      width: "w-[18%]",
      render: (row) => (
        <span
          title={row.stage.description ?? undefined}
          className="block truncate text-gray-500 dark:text-gray-400"
        >
          {row.stage.description || "—"}
        </span>
      ),
    },
    {
      key: "ssv",
      header: "SSV (giây)",
      width: "w-[13%]",
      align: "right",
      render: renderSsvCell,
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "w-[11%]",
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
            row.stage.isInactive
              ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              : "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
          }`}
        >
          {row.stage.isInactive ? "Đã tắt" : "Đang sử dụng"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      width: "w-[16%]",
      align: "center",
      render: (row) => (
        <StageGroupItemActions
          stageName={row.stage.stageName}
          position={row.position}
          itemCount={items.length}
          isEditing={editingIndex === row.position}
          hasSsvError={Boolean(ssvErrors[row.position])}
          editDisabled={isBlockedBySsvError && editingIndex !== row.position}
          moveDisabled={isBlockedBySsvError}
          removeDisabled={isBlockedBySsvError && editingIndex !== row.position}
          onToggleEdit={() => {
            if (isBlockedBySsvError && editingIndex !== row.position) return;
            setEditingIndex(editingIndex === row.position ? undefined : row.position);
          }}
          onMove={closeEditorAndMove}
          onRemove={closeEditorAndRemove}
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
        emptyMessage="Chưa có công đoạn nào trong nhóm."
      />
    </div>
  );
}
