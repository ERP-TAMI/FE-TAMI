import { Alert, Button, Table } from "@/components/shared";
import { useStageGroup } from "@/hooks/useStageGroups";
import { getApiError } from "@/lib/apiError";
import type { Stage } from "@/types/stage";
import type { StageGroupItemInput, StageGroupSummary } from "@/types/stage-group";
import { StageGroupExpandedItemTable } from "./StageGroupExpandedItemTable";

type StageGroupExpandedRowProps = {
  group: StageGroupSummary;
  stagesById?: ReadonlyMap<string, Stage>;
  isSavingItems?: boolean;
  togglingStageId?: string;
  onEditStage: (stage: Stage) => void;
  onToggleStageStatus: (stage: Stage) => void;
  onSaveItemSsv: (groupId: string, items: StageGroupItemInput[]) => Promise<boolean>;
  onRemoveItem: (groupId: string, items: StageGroupItemInput[]) => Promise<boolean>;
};

const loadingColumns = [
  { key: "position", header: "STT", width: "w-[5%]" },
  { key: "code", header: "Mã công đoạn", width: "w-[15%]" },
  { key: "name", header: "Tên công đoạn", width: "w-[16%]" },
  { key: "description", header: "Mô tả", width: "w-[17%]" },
  { key: "ssv", header: "SSV (giây)", width: "w-[12%]" },
  { key: "status", header: "Trạng thái", width: "w-[12%]" },
  { key: "actions", header: "Thao tác", width: "w-[23%]" },
];

export function StageGroupExpandedRow({
  group,
  stagesById,
  isSavingItems,
  togglingStageId,
  onEditStage,
  onToggleStageStatus,
  onSaveItemSsv,
  onRemoveItem,
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
          <StageGroupExpandedItemTable
            group={group}
            items={detail.data?.items ?? []}
            stagesById={stagesById}
            isSavingItems={isSavingItems}
            togglingStageId={togglingStageId}
            onEditStage={onEditStage}
            onToggleStageStatus={onToggleStageStatus}
            onSaveItemSsv={onSaveItemSsv}
            onRemoveItem={onRemoveItem}
          />
        </div>
      )}
    </div>
  );
}
