import { Alert, Button, Table } from "@/components/shared";
import type { TableColumn } from "@/components/shared/Table";
import { useStageGroup } from "@/hooks/useStageGroups";
import { getApiError } from "@/lib/apiError";
import type { StageGroupItem, StageGroupSummary } from "@/types/stage-group";

type StageGroupExpandedRowProps = {
  group: StageGroupSummary;
  activeStageIds?: ReadonlySet<string>;
};

function getColumns(activeStageIds?: ReadonlySet<string>): TableColumn<StageGroupItem>[] {
  return [
    {
      key: "position",
      header: "STT",
      width: "w-[7%]",
      align: "center",
      render: (item) => <span className="font-semibold tabular-nums">{item.orderIndex + 1}</span>,
    },
    {
      key: "code",
      header: "Mã công đoạn",
      width: "w-[20%]",
      render: (item) => (
        <span
          title={item.stageCode}
          className="block truncate font-semibold text-gray-900 dark:text-white"
        >
          {item.stageCode}
        </span>
      ),
    },
    {
      key: "name",
      header: "Tên công đoạn",
      width: "w-[21%]",
      render: (item) => (
        <span title={item.stageName} className="block truncate font-medium">
          {item.stageName}
        </span>
      ),
    },
    {
      key: "description",
      header: "Mô tả",
      width: "w-[22%]",
      render: (item) => (
        <span
          title={item.description ?? undefined}
          className="block truncate text-gray-500 dark:text-gray-400"
        >
          {item.description || "—"}
        </span>
      ),
    },
    {
      key: "ssv",
      header: "SSV (giây)",
      width: "w-[13%]",
      align: "right",
      render: (item) => <span className="font-semibold tabular-nums">{item.ssv}</span>,
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "w-[17%]",
      render: (item) => {
        const isActive = activeStageIds?.has(item.stageId);
        return (
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
              isActive === undefined
                ? "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                : isActive
                  ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            {isActive === undefined ? "—" : isActive ? "Đang sử dụng" : "Đã tắt"}
          </span>
        );
      },
    },
  ];
}

export function StageGroupExpandedRow({ group, activeStageIds }: StageGroupExpandedRowProps) {
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
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <Table
            embedded
            tableClassName="min-w-[920px]"
            columns={getColumns(activeStageIds)}
            rows={detail.data?.items ?? []}
            getRowKey={(item) => item.stageId}
            loading={detail.isLoading}
            loadingRowCount={Math.min(Math.max(group.itemCount, 3), 8)}
            emptyMessage="Nhóm chưa có công đoạn nào."
          />
        </div>
      )}
    </div>
  );
}
