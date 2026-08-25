import { useState } from "react";
import { Table, type TableColumn } from "@/components/shared/Table";
import { ChevronDownIcon, PencilIcon, TrashBinIcon } from "@/icons";
import type { StageGroupItemInput, StageGroupSummary } from "@/types/stage-group";
import { StageGroupExpandedRow } from "./StageGroupExpandedRow";

type StageGroupTableProps = {
  groups: StageGroupSummary[];
  togglingId?: string;
  loading?: boolean;
  isSavingItems?: boolean;
  onEdit: (group: StageGroupSummary) => void;
  onDelete: (group: StageGroupSummary) => void;
  onToggleStatus: (group: StageGroupSummary) => void;
  onSsvEditingChange?: (isEditing: boolean) => void;
  onSsvDirtyChange?: (isDirty: boolean) => void;
  onSaveItems: (groupId: string, items: StageGroupItemInput[]) => Promise<boolean>;
};

export function StageGroupTable({
  groups,
  togglingId,
  loading = false,
  isSavingItems,
  onEdit,
  onDelete,
  onToggleStatus,
  onSsvEditingChange,
  onSsvDirtyChange,
  onSaveItems,
}: StageGroupTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [ssvEditingId, setSsvEditingId] = useState<string>();
  const toggleExpanded = (groupId: string) => {
    if (ssvEditingId === groupId) return;
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };
  const startSsvEdit = (groupId: string) => {
    setExpandedIds((current) => new Set(current).add(groupId));
    setSsvEditingId(groupId);
    onSsvDirtyChange?.(false);
    onSsvEditingChange?.(true);
  };
  const closeSsvEdit = () => {
    setSsvEditingId(undefined);
    onSsvDirtyChange?.(false);
    onSsvEditingChange?.(false);
  };
  const columns: TableColumn<StageGroupSummary>[] = [
    {
      key: "expand",
      header: "",
      width: "w-[5%]",
      align: "center",
      render: (group) => {
        const isExpanded = expandedIds.has(group.id);
        return (
          <button
            type="button"
            onClick={() => toggleExpanded(group.id)}
            disabled={ssvEditingId === group.id}
            aria-expanded={isExpanded}
            aria-controls={`stage-group-items-${group.id}`}
            aria-label={`${isExpanded ? "Thu gọn" : "Xem"} các công đoạn của ${group.groupName}`}
            title={
              ssvEditingId === group.id
                ? "Hãy lưu hoặc hủy sửa SSV trước khi thu gọn"
                : isExpanded
                  ? "Thu gọn danh sách công đoạn"
                  : "Xem đầy đủ công đoạn"
            }
            className="hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 focus:ring-brand-500/20 dark:hover:border-brand-700 dark:hover:bg-brand-950/30 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition focus:ring-3 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <ChevronDownIcon
              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        );
      },
    },
    {
      key: "code",
      header: "Mã nhóm",
      width: "w-[13%]",
      render: (group) => (
        <span
          title={group.groupCode}
          className="block truncate font-semibold text-gray-900 dark:text-white"
        >
          {group.groupCode}
        </span>
      ),
    },
    {
      key: "name",
      header: "Tên nhóm",
      width: "w-[17%]",
      render: (group) => (
        <span title={group.groupName} className="block truncate font-medium">
          {group.groupName}
        </span>
      ),
    },
    {
      key: "description",
      header: "Mô tả",
      width: "w-[16%]",
      render: (group) => (
        <span title={group.description ?? undefined} className="block truncate text-gray-500">
          {group.description || "—"}
        </span>
      ),
    },
    {
      key: "itemCount",
      header: "Số công đoạn",
      width: "w-[10%]",
      align: "center",
      render: (group) => <span className="font-semibold tabular-nums">{group.itemCount}</span>,
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "w-[15%]",
      align: "right",
      render: (group) => {
        const isToggling = togglingId === group.id;
        return (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onToggleStatus(group)}
              disabled={isToggling || ssvEditingId !== undefined}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                group.status === "active" ? "bg-success-500" : "bg-gray-300 dark:bg-gray-700"
              } ${isToggling || ssvEditingId !== undefined ? "cursor-not-allowed opacity-50" : ""}`}
              title={
                group.status === "active" ? "Đang sử dụng (Bấm để tắt)" : "Đã tắt (Bấm để bật)"
              }
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-xs transition ${
                  group.status === "active" ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-theme-xs inline-block w-20 shrink-0 text-left whitespace-nowrap">
              {group.status === "active" ? "Đang sử dụng" : "Đã tắt"}
            </span>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Thao tác",
      width: "w-[24%]",
      align: "center",
      render: (group) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => startSsvEdit(group.id)}
            aria-label={
              ssvEditingId === group.id
                ? `Đang sửa SSV nhóm ${group.groupName}`
                : `Sửa SSV nhóm ${group.groupName}`
            }
            title="Sửa SSV toàn bộ công đoạn con"
            disabled={ssvEditingId !== undefined}
            className="border-brand-200 bg-brand-50/60 text-brand-600 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-950/30 dark:text-brand-300 dark:hover:bg-brand-900/40 inline-flex items-center rounded-lg border px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sửa SSV
          </button>
          <button
            type="button"
            onClick={() => onEdit(group)}
            disabled={ssvEditingId !== undefined}
            title="Chỉnh sửa nhóm công đoạn"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <PencilIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Sửa</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(group)}
            disabled={ssvEditingId !== undefined}
            title="Xóa nhóm công đoạn"
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/60 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/60"
          >
            <TrashBinIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Xóa</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <Table
      embedded
      tableClassName="min-w-[1120px]"
      columns={columns}
      rows={groups}
      getRowKey={(group) => group.id}
      renderExpandedRow={(group) =>
        expandedIds.has(group.id) ? (
          <StageGroupExpandedRow
            group={group}
            isSavingItems={isSavingItems}
            ssvEditMode={ssvEditingId === group.id}
            onCloseSsvEdit={closeSsvEdit}
            onSsvDirtyChange={(isDirty) => onSsvDirtyChange?.(isDirty)}
            onSaveItems={onSaveItems}
          />
        ) : undefined
      }
      loading={loading}
      emptyMessage="Không tìm thấy nhóm công đoạn phù hợp."
    />
  );
}
