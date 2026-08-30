import { useMemo, useState } from "react";
import { Button, ConfirmDialog, Table } from "@/components/shared";
import type { TableColumn } from "@/components/shared/Table";
import { PencilIcon, TrashBinIcon } from "@/icons";
import { STAGE_SSV_PATTERN } from "@/types/stage";
import type { StageGroupItem, StageGroupItemInput, StageGroupSummary } from "@/types/stage-group";

type StageGroupSsvInlineTableProps = {
  group: StageGroupSummary;
  items: StageGroupItem[];
  isSavingItems?: boolean;
  onClose: () => void;
  onDirtyChange: (isDirty: boolean) => void;
  onSaveItems: (groupId: string, items: StageGroupItemInput[]) => Promise<boolean>;
};

const inputClass =
  "h-9 w-28 rounded-lg border bg-white px-2 text-right text-sm font-medium tabular-nums outline-none focus:ring-3 dark:bg-gray-900";

export function StageGroupSsvInlineTable({
  group,
  items,
  isSavingItems = false,
  onClose,
  onDirtyChange,
  onSaveItems,
}: StageGroupSsvInlineTableProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((item) => [item.id, item.ssv])),
  );
  const [discardRequested, setDiscardRequested] = useState(false);
  const errors = useMemo(
    () =>
      Object.fromEntries(
        items.map((item) => {
          const value = values[item.id]?.trim() ?? "";
          return [
            item.id,
            STAGE_SSV_PATTERN.test(value)
              ? undefined
              : "SSV phải là số không âm, tối đa 3 chữ số thập phân",
          ];
        }),
      ) as Record<string, string | undefined>,
    [items, values],
  );
  const changedCount = items.filter((item) => values[item.id]?.trim() !== item.ssv).length;
  const hasErrors = Object.values(errors).some(Boolean);

  const requestClose = () => {
    if (changedCount > 0) setDiscardRequested(true);
    else onClose();
  };
  const updateValue = (itemId: string, value: string) => {
    const next = { ...values, [itemId]: value };
    setValues(next);
    onDirtyChange(items.some((item) => next[item.id]?.trim() !== item.ssv));
  };
  const save = async () => {
    if (changedCount === 0 || hasErrors) return;
    const nextItems = items.map((item, orderIndex) => ({
      id: item.id,
      itemName: item.itemName,
      description: item.description,
      ssv: values[item.id].trim(),
      status: item.status,
      orderIndex,
    }));
    if (await onSaveItems(group.id, nextItems)) onClose();
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
      render: (item) => (
        <span className="block truncate font-semibold text-gray-900 dark:text-white">
          {item.itemName}
        </span>
      ),
    },
    {
      key: "description",
      header: "Mô tả",
      width: "w-[25%]",
      render: (item) => (
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
      render: (item) => (
        <div className="ml-auto space-y-1">
          <input
            type="text"
            inputMode="decimal"
            aria-label={`SSV cho công đoạn con ${item.itemName}`}
            aria-invalid={Boolean(errors[item.id])}
            value={values[item.id] ?? ""}
            onChange={(event) => updateValue(item.id, event.target.value)}
            className={`${inputClass} ${
              errors[item.id]
                ? "border-error-500 focus:ring-error-500/10"
                : "focus:border-brand-500 focus:ring-brand-500/10 border-gray-300 dark:border-gray-700"
            }`}
          />
          {errors[item.id] && (
            <span className="text-theme-xs text-error-500 block text-left" role="alert">
              {errors[item.id]}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "w-[17%]",
      render: (item) => (
        <div className="flex items-center gap-2 opacity-60">
          <span
            aria-hidden="true"
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full ${
              item.status === "active" ? "bg-success-500" : "bg-gray-300 dark:bg-gray-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow-xs ${
                item.status === "active" ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </span>
          <span className="text-theme-xs whitespace-nowrap">
            {item.status === "active" ? "Đang sử dụng" : "Đã tắt"}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      width: "w-[18%]",
      align: "center",
      render: () => (
        <div className="flex items-center justify-center gap-1 opacity-50" aria-hidden="true">
          <span className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs">
            <PencilIcon className="h-3.5 w-3.5" /> Sửa
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600">
            <TrashBinIcon className="h-3.5 w-3.5" /> Xóa
          </span>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:bg-gray-800/60">
        <p className="text-theme-sm text-gray-500 dark:text-gray-400" aria-live="polite">
          {changedCount > 0
            ? `Đã thay đổi SSV của ${changedCount} công đoạn con.`
            : `Sửa SSV trực tiếp cho ${items.length} công đoạn con.`}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={isSavingItems} onClick={requestClose}>
            Hủy sửa SSV
          </Button>
          <Button
            size="sm"
            loading={isSavingItems}
            disabled={changedCount === 0 || hasErrors}
            onClick={() => void save()}
          >
            Lưu SSV
          </Button>
        </div>
      </div>
      <Table
        embedded
        tableClassName="min-w-[1050px]"
        columns={columns}
        rows={items}
        getRowKey={(item) => item.id}
        emptyMessage="Nhóm chưa có công đoạn con nào."
      />
      <ConfirmDialog
        open={discardRequested}
        title="Hủy sửa SSV?"
        description="Các giá trị SSV chưa lưu sẽ bị mất. Bạn có chắc muốn tiếp tục?"
        confirmLabel="Bỏ thay đổi"
        cancelLabel="Tiếp tục chỉnh sửa"
        variant="danger"
        onClose={() => setDiscardRequested(false)}
        onConfirm={onClose}
      />
    </>
  );
}
