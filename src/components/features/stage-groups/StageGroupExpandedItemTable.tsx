import { useState } from "react";
import { ConfirmDialog, Table } from "@/components/shared";
import type { TableColumn } from "@/components/shared/Table";
import { PencilIcon, TrashBinIcon } from "@/icons";
import { STAGE_SSV_PATTERN } from "@/types/stage";
import type { StageGroupItem, StageGroupItemInput, StageGroupSummary } from "@/types/stage-group";

type ItemDraft = Pick<StageGroupItem, "itemName" | "description" | "ssv">;
type StageGroupExpandedItemTableProps = {
  group: StageGroupSummary;
  items: StageGroupItem[];
  isSavingItems?: boolean;
  onSaveItems: (groupId: string, items: StageGroupItemInput[]) => Promise<boolean>;
};

function toInputItems(items: StageGroupItem[]): StageGroupItemInput[] {
  return items.map((item, orderIndex) => ({
    id: item.id,
    itemName: item.itemName,
    description: item.description,
    ssv: item.ssv,
    status: item.status,
    orderIndex,
  }));
}

const inputClass =
  "h-9 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900";

export function StageGroupExpandedItemTable({
  group,
  items,
  isSavingItems = false,
  onSaveItems,
}: StageGroupExpandedItemTableProps) {
  const [editingId, setEditingId] = useState<string>();
  const [draft, setDraft] = useState<ItemDraft>();
  const [errors, setErrors] = useState<Partial<Record<keyof ItemDraft, string>>>({});
  const [removing, setRemoving] = useState<StageGroupItem>();

  const startEdit = (item: StageGroupItem) => {
    setEditingId(item.id);
    setDraft({ itemName: item.itemName, description: item.description, ssv: item.ssv });
    setErrors({});
  };
  const saveEdit = async (item: StageGroupItem) => {
    if (!draft) return;
    const itemName = draft.itemName.trim();
    const ssv = draft.ssv.trim();
    const nextErrors = {
      ...(!itemName ? { itemName: "Tên công đoạn con là bắt buộc" } : {}),
      ...(!STAGE_SSV_PATTERN.test(ssv)
        ? { ssv: "SSV phải là số không âm, tối đa 3 chữ số thập phân" }
        : {}),
    };
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    const nextItems = toInputItems(
      items.map((current) =>
        current.id === item.id
          ? {
              ...current,
              itemName,
              description: draft.description?.trim() || null,
              ssv,
            }
          : current,
      ),
    );
    if (await onSaveItems(group.id, nextItems)) {
      setEditingId(undefined);
      setDraft(undefined);
      setErrors({});
    }
  };
  const toggleStatus = async (item: StageGroupItem) => {
    const nextItems = toInputItems(
      items.map((current) =>
        current.id === item.id
          ? { ...current, status: current.status === "active" ? "inactive" : "active" }
          : current,
      ),
    );
    await onSaveItems(group.id, nextItems);
  };
  const removeItem = async () => {
    if (!removing || items.length <= 1) return;
    const nextItems = toInputItems(items.filter((item) => item.id !== removing.id));
    if (await onSaveItems(group.id, nextItems)) setRemoving(undefined);
  };

  const columns: TableColumn<StageGroupItem>[] = [
    {
      key: "position",
      header: "STT",
      width: "w-[6%]",
      align: "center",
      render: (item) => <span className="font-semibold tabular-nums">{item.orderIndex + 1}</span>,
    },
    {
      key: "name",
      header: "Tên công đoạn con",
      width: "w-[21%]",
      render: (item) =>
        editingId === item.id ? (
          <div className="space-y-1">
            <input
              aria-label={`Tên công đoạn con ${item.itemName}`}
              aria-invalid={Boolean(errors.itemName)}
              value={draft?.itemName ?? ""}
              onChange={(event) => {
                setDraft((current) => current && { ...current, itemName: event.target.value });
                setErrors((current) => ({ ...current, itemName: undefined }));
              }}
              className={`${inputClass} ${errors.itemName ? "border-error-500" : ""}`}
            />
            {errors.itemName && (
              <span className="text-theme-xs text-error-500 block" role="alert">
                {errors.itemName}
              </span>
            )}
          </div>
        ) : (
          <span className="block truncate font-semibold text-gray-900 dark:text-white">
            {item.itemName}
          </span>
        ),
    },
    {
      key: "description",
      header: "Mô tả",
      width: "w-[25%]",
      render: (item) =>
        editingId === item.id ? (
          <input
            aria-label={`Mô tả công đoạn con ${item.itemName}`}
            value={draft?.description ?? ""}
            onChange={(event) =>
              setDraft((current) => current && { ...current, description: event.target.value })
            }
            className={inputClass}
          />
        ) : (
          <span className="block truncate text-gray-500 dark:text-gray-400">
            {item.description || "—"}
          </span>
        ),
    },
    {
      key: "ssv",
      header: "SSV (giây)",
      width: "w-[13%]",
      align: "right",
      render: (item) =>
        editingId === item.id ? (
          <div className="ml-auto w-28 space-y-1">
            <input
              type="text"
              inputMode="decimal"
              aria-label={`SSV cho ${item.itemName}`}
              aria-invalid={Boolean(errors.ssv)}
              value={draft?.ssv ?? ""}
              onChange={(event) => {
                setDraft((current) => current && { ...current, ssv: event.target.value });
                setErrors((current) => ({ ...current, ssv: undefined }));
              }}
              className={`${inputClass} text-right ${errors.ssv ? "border-error-500" : ""}`}
            />
            {errors.ssv && (
              <span className="text-theme-xs text-error-500 block text-left" role="alert">
                {errors.ssv}
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
      width: "w-[17%]",
      render: (item) => {
        const isActive = item.status === "active";
        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              aria-label={`${isActive ? "Tắt" : "Bật"} công đoạn con ${item.itemName}`}
              onClick={() => void toggleStatus(item)}
              disabled={isSavingItems || editingId !== undefined}
              className={`focus:ring-brand-500/20 relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:ring-3 focus:outline-none ${
                isActive ? "bg-success-500" : "bg-gray-300 dark:bg-gray-700"
              } disabled:opacity-50`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-xs transition ${isActive ? "translate-x-4" : "translate-x-0"}`}
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
      width: "w-[18%]",
      align: "center",
      render: (item) => (
        <div className="flex items-center justify-center gap-1">
          {editingId === item.id ? (
            <>
              <button
                type="button"
                aria-label={`Lưu công đoạn con ${item.itemName}`}
                onClick={() => void saveEdit(item)}
                disabled={isSavingItems}
                className="bg-brand-500 hover:bg-brand-600 rounded-lg px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
              >
                Lưu
              </button>
              <button
                type="button"
                aria-label={`Hủy sửa công đoạn con ${item.itemName}`}
                onClick={() => setEditingId(undefined)}
                disabled={isSavingItems}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                Hủy
              </button>
            </>
          ) : (
            <button
              type="button"
              aria-label={`Sửa công đoạn con ${item.itemName}`}
              onClick={() => startEdit(item)}
              disabled={isSavingItems || editingId !== undefined}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <PencilIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Sửa
            </button>
          )}
          <button
            type="button"
            aria-label={`Xóa ${item.itemName} khỏi nhóm ${group.groupName}`}
            title={items.length <= 1 ? "Nhóm phải có ít nhất một công đoạn con" : undefined}
            onClick={() => setRemoving(item)}
            disabled={items.length <= 1 || isSavingItems || editingId !== undefined}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/60 px-2 py-1 text-xs font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300"
          >
            <TrashBinIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Xóa
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Table
        embedded
        tableClassName="min-w-[1050px]"
        columns={columns}
        rows={items}
        getRowKey={(item) => item.id}
        emptyMessage="Nhóm chưa có công đoạn con nào."
      />
      {removing && (
        <ConfirmDialog
          open
          title="Xóa công đoạn con"
          description={`Bạn có chắc muốn xóa “${removing.itemName}” khỏi nhóm “${group.groupName}”?`}
          confirmLabel="Xóa"
          variant="danger"
          isSubmitting={isSavingItems}
          onClose={() => setRemoving(undefined)}
          onConfirm={() => void removeItem()}
        />
      )}
    </>
  );
}
