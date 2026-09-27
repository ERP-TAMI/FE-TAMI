import { Alert, Button, Table } from "@/components/shared";
import { useStageGroup } from "@/hooks/useStageGroups";
import { getApiError } from "@/lib/apiError";
import type { StageGroupItemInput, StageGroupSummary } from "@/types/stage-group";
import { StageGroupExpandedItemTable } from "./StageGroupExpandedItemTable";
import { StageGroupSsvInlineTable } from "./StageGroupSsvInlineTable";

type StageGroupExpandedRowProps = {
  group: StageGroupSummary;
  isSavingItems?: boolean;
  ssvEditMode?: boolean;
  onCloseSsvEdit: () => void;
  onSsvDirtyChange: (isDirty: boolean) => void;
  onSaveItems: (groupId: string, items: StageGroupItemInput[]) => Promise<boolean>;
};

const loadingColumns = [
  { key: "position", header: "STT", width: "w-[5%]" },
  { key: "name", header: "Tên công đoạn con", width: "w-[21%]" },
  { key: "description", header: "Mô tả", width: "w-[25%]" },
  { key: "ssv", header: "SSV (giây)", width: "w-[13%]" },
  { key: "status", header: "Trạng thái", width: "w-[17%]" },
  { key: "actions", header: "Thao tác", width: "w-[18%]" },
];

export function StageGroupExpandedRow({
  group,
  isSavingItems,
  ssvEditMode = false,
  onCloseSsvEdit,
  onSsvDirtyChange,
  onSaveItems,
}: StageGroupExpandedRowProps) {
  const detail = useStageGroup(group.id);
  // Nested table reuses the shared <Table>, which is styled identically to the
  // parent group table — shrink it and indent it under a connecting line (same
  // "this belongs to that" language as the sidebar's nested submenu) so it
  // reads as this row's children rather than another top-level table.
  const nestedTableScale =
    "[&_thead_th]:bg-gray-100/80 [&_thead_th]:py-1.5 [&_thead_th]:text-[10px] [&_thead_th]:font-medium [&_thead_th]:normal-case [&_thead_th]:tracking-normal [&_thead_th]:text-gray-400 dark:[&_thead_th]:bg-gray-800/60 dark:[&_thead_th]:text-gray-500 [&_tbody_td]:py-2 [&_tbody_td]:text-theme-xs";

  return (
    <div
      id={`stage-group-items-${group.id}`}
      role="region"
      aria-label={`Các công đoạn của ${group.groupName}`}
      className="bg-brand-50/30 dark:bg-brand-950/10 border-y border-gray-100 py-3 pr-4 pl-4 dark:border-gray-800"
    >
      <div className="border-brand-200 dark:border-brand-900/50 ml-8 border-l-2 pl-4">
        {detail.isError ? (
          <Alert variant="error" title="Không thể tải các công đoạn trong nhóm">
            {getApiError(detail.error, "Không thể tải chi tiết nhóm công đoạn.").message}{" "}
            <Button variant="ghost" size="sm" onClick={() => void detail.refetch()}>
              Thử lại
            </Button>
          </Alert>
        ) : detail.isLoading ? (
          <div
            className={`overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 ${nestedTableScale}`}
          >
            <Table
              embedded
              tableClassName="min-w-[1120px]"
              columns={loadingColumns}
              rows={[]}
              getRowKey={(_, index) => index}
              loading
              loadingRowCount={Math.min(Math.max(group.itemCount, 3), 8)}
            />
          </div>
        ) : (
          <div
            className={`overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 ${nestedTableScale}`}
          >
            {ssvEditMode ? (
              <StageGroupSsvInlineTable
                group={group}
                items={detail.data?.items ?? []}
                isSavingItems={isSavingItems}
                onClose={onCloseSsvEdit}
                onDirtyChange={onSsvDirtyChange}
                onSaveItems={onSaveItems}
              />
            ) : (
              <StageGroupExpandedItemTable
                group={group}
                items={detail.data?.items ?? []}
                isSavingItems={isSavingItems}
                onSaveItems={onSaveItems}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
