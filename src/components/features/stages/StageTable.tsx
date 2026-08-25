import { Table, type TableColumn } from "@/components/shared/Table";
import { PencilIcon, TrashBinIcon } from "@/icons";
import type { Stage } from "@/types/stage";

type StageTableProps = {
  stages: Stage[];
  bulkMode?: boolean;
  bulkValues?: Record<string, string>;
  bulkErrors?: Record<string, string | undefined>;
  togglingId?: string;
  loading?: boolean;
  onEdit: (stage: Stage) => void;
  onDelete: (stage: Stage) => void;
  onToggleStatus: (stage: Stage) => void;
  onBulkValueChange?: (id: string, value: string) => void;
};

export function StageTable({
  stages,
  bulkMode = false,
  bulkValues = {},
  bulkErrors = {},
  togglingId,
  loading = false,
  onEdit,
  onDelete,
  onToggleStatus,
  onBulkValueChange,
}: StageTableProps) {
  const columns: TableColumn<Stage>[] = [
    {
      key: "code",
      header: "Mã công đoạn",
      width: "w-[18%]",
      render: (stage) => (
        <span
          title={stage.stageCode}
          className="block truncate font-medium text-gray-900 dark:text-white"
        >
          {stage.stageCode}
        </span>
      ),
    },
    {
      key: "name",
      header: "Tên công đoạn",
      width: "w-[19%]",
      render: (stage) => (
        <span title={stage.stageName} className="block truncate font-medium">
          {stage.stageName}
        </span>
      ),
    },
    {
      key: "description",
      header: "Mô tả",
      width: "w-[19%]",
      render: (stage) => (
        <span title={stage.description ?? undefined} className="block truncate text-gray-500">
          {stage.description || "—"}
        </span>
      ),
    },
    {
      key: "ssv",
      header: "SSV (giây)",
      width: "w-[10%]",
      align: "right",
      render: (stage) =>
        bulkMode ? (
          <div className="ml-auto w-28 space-y-1">
            <input
              type="text"
              inputMode="decimal"
              aria-label={`SSV cho ${stage.stageCode}`}
              aria-invalid={Boolean(bulkErrors[stage.id])}
              value={bulkValues[stage.id] ?? stage.ssv}
              onChange={(event) => onBulkValueChange?.(stage.id, event.target.value)}
              className={`h-9 w-full rounded-lg border bg-white px-2 text-right font-medium outline-none focus:ring-3 dark:bg-gray-900 ${
                bulkErrors[stage.id]
                  ? "border-error-500 focus:ring-error-500/10"
                  : "focus:border-brand-500 focus:ring-brand-500/10 border-gray-300 dark:border-gray-700"
              }`}
            />
            {bulkErrors[stage.id] && (
              <span className="text-theme-xs text-error-500" role="alert">
                {bulkErrors[stage.id]}
              </span>
            )}
          </div>
        ) : (
          <span className="font-medium text-gray-900 tabular-nums dark:text-white">
            {stage.ssv}
          </span>
        ),
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "w-[17%]",
      render: (stage) => {
        const isToggling = togglingId === stage.id;
        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleStatus(stage)}
              disabled={isToggling || bulkMode}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                stage.status === "active" ? "bg-success-500" : "bg-gray-300 dark:bg-gray-700"
              } ${isToggling ? "opacity-50" : ""}`}
              title={
                stage.status === "active" ? "Đang sử dụng (Bấm để tắt)" : "Đã tắt (Bấm để bật)"
              }
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-xs transition ${
                  stage.status === "active" ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-theme-xs whitespace-nowrap">
              {stage.status === "active" ? "Đang sử dụng" : "Đã tắt"}
            </span>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Thao tác",
      width: "w-[17%]",
      align: "center",
      render: (stage) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(stage)}
            disabled={bulkMode}
            title="Chỉnh sửa công đoạn"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <PencilIcon className="h-3.5 w-3.5 shrink-0" />
            <span>Sửa</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(stage)}
            disabled={bulkMode}
            title="Xóa công đoạn"
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/60 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/60"
          >
            <TrashBinIcon className="h-3.5 w-3.5 shrink-0" />
            <span>Xóa</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <Table
      embedded
      tableClassName="min-w-[980px]"
      columns={columns}
      rows={stages}
      getRowKey={(stage) => stage.id}
      loading={loading}
      emptyMessage="Không tìm thấy công đoạn phù hợp."
    />
  );
}
