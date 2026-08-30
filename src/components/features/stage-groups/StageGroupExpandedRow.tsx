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

  return (
    <div
      id={`stage-group-items-${group.id}`}
      role="region"
      aria-label={`Các công đoạn của ${group.groupName}`}
      className="border-brand-100 bg-brand-50/30 dark:border-brand-900/40 dark:bg-brand-950/10 border-y px-4 py-4"
    >
      {detail.isError ? (
        <Alert variant="error" title="Không thể tải các công đoạn trong nhóm">
          {getApiError(detail.error, "Không thể tải chi tiết nhóm công đoạn.").message}{" "}
          <Button variant="ghost" size="sm" onClick={() => void detail.refetch()}>
            Thử lại
          </Button>
        </Alert>
      ) : detail.isLoading ? (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <Table
            embedded
            tableClassName="min-w-[1280px]"
            columns={loadingColumns}
            rows={[]}
            getRowKey={(_, index) => index}
            loading
            loadingRowCount={Math.min(Math.max(group.itemCount, 3), 8)}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
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
  );
}
