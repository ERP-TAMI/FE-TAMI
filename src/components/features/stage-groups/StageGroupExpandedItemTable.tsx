import { useState } from "react";
import { ConfirmDialog, Table } from "@/components/shared";
import type { TableColumn } from "@/components/shared/Table";
import { PencilIcon, TrashBinIcon } from "@/icons";
import { STAGE_SSV_PATTERN, type Stage } from "@/types/stage";
import type { StageGroupItem, StageGroupItemInput, StageGroupSummary } from "@/types/stage-group";

type ExpandedItemRow = StageGroupItem & { masterStage?: Stage };

type StageGroupExpandedItemTableProps = {
  group: StageGroupSummary;
  items: StageGroupItem[];
  stagesById?: ReadonlyMap<string, Stage>;
  isSavingItems?: boolean;
  togglingStageId?: string;
  onEditStage: (stage: Stage) => void;
  onToggleStageStatus: (stage: Stage) => void;
  onSaveItemSsv: (groupId: string, items: StageGroupItemInput[]) => Promise<boolean>;
  onRemoveItem: (groupId: string, items: StageGroupItemInput[]) => Promise<boolean>;
};

function toInputItems(items: StageGroupItem[]): StageGroupItemInput[] {
  return items.map((item, orderIndex) => ({
    stageId: item.stageId,
    ssv: item.ssv,
    orderIndex,
  }));
}

export function StageGroupExpandedItemTable({
  group,
  items,
  stagesById,
  isSavingItems = false,
  togglingStageId,
  onEditStage,
  onToggleStageStatus,
  onSaveItemSsv,
  onRemoveItem,
}: StageGroupExpandedItemTableProps) {
  const [editingSsvId, setEditingSsvId] = useState<string>();
  const [ssvDraft, setSsvDraft] = useState("");
  const [ssvError, setSsvError] = useState<string>();
  const [removing, setRemoving] = useState<StageGroupItem>();
  const rows: ExpandedItemRow[] = items.map((item) => ({
    ...item,
    masterStage: stagesById?.get(item.stageId),
  }));

  const startSsvEdit = (item: StageGroupItem) => {
    setEditingSsvId(item.stageId);
    setSsvDraft(item.ssv);
    setSsvError(undefined);
  };
  const saveSsv = async (item: StageGroupItem) => {
    const nextSsv = ssvDraft.trim();
    if (!STAGE_SSV_PATTERN.test(nextSsv)) {
      setSsvError("SSV phải là số không âm, tối đa 3 chữ số thập phân");
      return;
    }
    const nextItems = toInputItems(
      items.map((current) =>
        current.stageId === item.stageId ? { ...current, ssv: nextSsv } : current,
      ),
    );
    if (await onSaveItemSsv(group.id, nextItems)) {
      setEditingSsvId(undefined);
      setSsvError(undefined);
    }
  };
  const removeItem = async () => {
    if (!removing || items.length <= 1) return;
    const nextItems = toInputItems(items.filter((item) => item.stageId !== removing.stageId));
    if (await onRemoveItem(group.id, nextItems)) setRemoving(undefined);
  };

  const columns: TableColumn<ExpandedItemRow>[] = [
    {
      key: "position",
      header: "STT",
      width: "w-[5%]",
      align: "center",
      render: (item) => <span className="font-semibold tabular-nums">{item.orderIndex + 1}</span>,
    },
    {
      key: "code",
      header: "Mã công đoạn",
      width: "w-[15%]",
      render: (item) => (
        <span
          title={item.masterStage?.stageCode ?? item.stageCode}
          className="block truncate font-semibold text-gray-900 dark:text-white"
        >
          {item.masterStage?.stageCode ?? item.stageCode}
        </span>
      ),
    },
    {
      key: "name",
      header: "Tên công đoạn",
      width: "w-[16%]",
      render: (item) => (
        <span
          title={item.masterStage?.stageName ?? item.stageName}
          className="block truncate font-medium"
        >
          {item.masterStage?.stageName ?? item.stageName}
        </span>
      ),
    },
    {
      key: "description",
      header: "Mô tả",
      width: "w-[17%]",
      render: (item) => {
        const description = item.masterStage?.description ?? item.description;
        return (
          <span
            title={description ?? undefined}
            className="block truncate text-gray-500 dark:text-gray-400"
          >
            {description || "—"}
          </span>
        );
      },
    },
    {
      key: "ssv",
      header: "SSV (giây)",
      width: "w-[12%]",
      align: "right",
      render: (item) =>
        editingSsvId === item.stageId ? (
          <div className="ml-auto w-28 space-y-1">
            <input
              type="text"
              inputMode="decimal"
              aria-label={`SSV cho ${item.stageName}`}
              aria-invalid={Boolean(ssvError)}
              value={ssvDraft}
              onChange={(event) => {
                setSsvDraft(event.target.value);
                setSsvError(undefined);
              }}
              className={`h-9 w-full rounded-lg border bg-white px-2 text-right font-medium outline-none focus:ring-3 dark:bg-gray-900 ${
                ssvError
                  ? "border-error-500 focus:ring-error-500/10"
                  : "focus:border-brand-500 focus:ring-brand-500/10 border-gray-300 dark:border-gray-700"
              }`}
            />
            {ssvError && (
              <span className="text-theme-xs text-error-500 block text-left" role="alert">
                {ssvError}
              </span>
            )}
          </div>
        ) : (
          <span className="font-semibold tabular-nums">{item.ssv}</span>
        ),
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "w-[12%]",
      render: (item) => {
        const stage = item.masterStage;
        if (!stage) return <span className="text-gray-400">—</span>;
        const isActive = stage.status === "active";
        const isToggling = togglingStageId === stage.id;
        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              aria-label={`${isActive ? "Tắt" : "Bật"} công đoạn ${stage.stageName}`}
              onClick={() => onToggleStageStatus(stage)}
              disabled={isToggling}
              className={`focus:ring-brand-500/20 relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:ring-3 focus:outline-none ${
                isActive ? "bg-success-500" : "bg-gray-300 dark:bg-gray-700"
              } ${isToggling ? "opacity-50" : ""}`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-xs transition ${
                  isActive ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-theme-xs whitespace-nowrap">
              {isActive ? "Đang sử dụng" : "Đã tắt"}
            </span>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Thao tác",
      width: "w-[23%]",
      align: "center",
      render: (item) => {
        const isEditingSsv = editingSsvId === item.stageId;
        const stageName = item.masterStage?.stageName ?? item.stageName;
        return (
          <div className="flex items-center justify-center gap-1">
            {isEditingSsv ? (
              <>
                <button
                  type="button"
                  aria-label={`Lưu SSV cho ${stageName}`}
                  onClick={() => void saveSsv(item)}
                  disabled={isSavingItems}
                  className="bg-brand-500 hover:bg-brand-600 rounded-lg px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  aria-label={`Hủy sửa SSV cho ${stageName}`}
                  onClick={() => setEditingSsvId(undefined)}
                  disabled={isSavingItems}
                  className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  Hủy
                </button>
              </>
            ) : (
              <button
                type="button"
                aria-label={`Sửa SSV cho ${stageName}`}
                onClick={() => startSsvEdit(item)}
                disabled={isSavingItems}
                className="border-brand-200 bg-brand-50/60 text-brand-600 hover:bg-brand-100 dark:border-brand-900/50 dark:bg-brand-950/30 dark:text-brand-300 rounded-lg border px-2 py-1 text-xs font-medium disabled:opacity-50"
              >
                Sửa SSV
              </button>
            )}
            <button
              type="button"
              aria-label={`Sửa công đoạn ${stageName}`}
              onClick={() => item.masterStage && onEditStage(item.masterStage)}
              disabled={!item.masterStage || isSavingItems}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <PencilIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Sửa
            </button>
            <button
              type="button"
              aria-label={`Xóa ${stageName} khỏi nhóm ${group.groupName}`}
              title={items.length <= 1 ? "Nhóm phải có ít nhất một công đoạn" : undefined}
              onClick={() => setRemoving(item)}
              disabled={items.length <= 1 || isSavingItems}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/60 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300"
            >
              <TrashBinIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Xóa
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <Table
        embedded
        tableClassName="min-w-[1280px]"
        columns={columns}
        rows={rows}
        getRowKey={(item) => item.stageId}
        emptyMessage="Nhóm chưa có công đoạn nào."
      />
      {removing && (
        <ConfirmDialog
          open
          title="Loại công đoạn khỏi nhóm"
          description={
            <>
              Bạn có chắc muốn loại "{removing.stageName}" khỏi nhóm "{group.groupName}"? Công đoạn
              Master vẫn được giữ nguyên.
            </>
          }
          confirmLabel="Loại bỏ"
          variant="danger"
          isSubmitting={isSavingItems}
          onClose={() => setRemoving(undefined)}
          onConfirm={() => void removeItem()}
        />
      )}
    </>
  );
}
