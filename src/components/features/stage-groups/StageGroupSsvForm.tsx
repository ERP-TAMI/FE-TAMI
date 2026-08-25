import { useMemo, useState } from "react";
import { Button, ConfirmDialog, Modal, Table } from "@/components/shared";
import type { TableColumn } from "@/components/shared/Table";
import { STAGE_SSV_PATTERN } from "@/types/stage";
import type { StageGroup, StageGroupItem, StageGroupItemInput } from "@/types/stage-group";

type StageGroupSsvFormProps = {
  group: StageGroup;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (items: StageGroupItemInput[]) => void;
};

export function StageGroupSsvForm({
  group,
  isSubmitting,
  onClose,
  onSubmit,
}: StageGroupSsvFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(group.items.map((item) => [item.id, item.ssv])),
  );
  const [discardRequested, setDiscardRequested] = useState(false);
  const errors = useMemo(
    () =>
      Object.fromEntries(
        group.items.map((item) => {
          const value = values[item.id]?.trim() ?? "";
          return [
            item.id,
            STAGE_SSV_PATTERN.test(value)
              ? undefined
              : "SSV phải là số không âm, tối đa 3 chữ số thập phân",
          ];
        }),
      ) as Record<string, string | undefined>,
    [group.items, values],
  );
  const changedCount = group.items.filter((item) => values[item.id]?.trim() !== item.ssv).length;
  const hasErrors = Object.values(errors).some(Boolean);

  const requestClose = () => {
    if (changedCount > 0) {
      setDiscardRequested(true);
      return;
    }
    onClose();
  };
  const submit = () => {
    if (changedCount === 0 || hasErrors) return;
    onSubmit(
      group.items.map((item) => ({
        id: item.id,
        itemName: item.itemName,
        description: item.description,
        ssv: values[item.id].trim(),
        status: item.status,
        orderIndex: item.orderIndex,
      })),
    );
  };

  const columns: TableColumn<StageGroupItem>[] = [
    {
      key: "position",
      header: "STT",
      width: "w-[10%]",
      align: "center",
      render: (item) => <span className="font-semibold tabular-nums">{item.orderIndex + 1}</span>,
    },
    {
      key: "name",
      header: "Tên công đoạn con",
      width: "w-[55%]",
      render: (item) => (
        <span className="block truncate font-medium text-gray-900 dark:text-white">
          {item.itemName}
        </span>
      ),
    },
    {
      key: "ssv",
      header: "SSV (giây)",
      width: "w-[35%]",
      align: "right",
      render: (item) => (
        <div className="ml-auto w-36 space-y-1">
          <input
            type="text"
            inputMode="decimal"
            aria-label={`SSV cho công đoạn con ${item.itemName}`}
            aria-invalid={Boolean(errors[item.id])}
            value={values[item.id] ?? ""}
            onChange={(event) =>
              setValues((current) => ({ ...current, [item.id]: event.target.value }))
            }
            className={`h-9 w-full rounded-lg border bg-white px-3 text-right font-medium tabular-nums outline-none focus:ring-3 dark:bg-gray-900 ${
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
  ];

  return (
    <>
      <Modal
        open
        size="xl"
        title={`Sửa SSV - ${group.groupName}`}
        closeLabel="Đóng sửa SSV"
        onClose={requestClose}
        footer={
          <>
            <Button variant="outline" onClick={requestClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button
              loading={isSubmitting}
              disabled={changedCount === 0 || hasErrors}
              onClick={submit}
            >
              Lưu SSV
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            Chỉnh SSV cho toàn bộ {group.items.length} công đoạn con và lưu một lần.
          </p>
          <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <Table
              embedded
              tableClassName="min-w-[620px]"
              columns={columns}
              rows={group.items}
              getRowKey={(item) => item.id}
              emptyMessage="Nhóm chưa có công đoạn con nào."
            />
          </div>
          <p className="text-theme-xs text-gray-500" aria-live="polite">
            {changedCount > 0
              ? `Đã thay đổi SSV của ${changedCount} công đoạn con.`
              : "Chưa có giá trị SSV nào thay đổi."}
          </p>
        </div>
      </Modal>
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
