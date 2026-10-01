import { GitBranch, GitCompare, CheckCircle2, RotateCcw } from "lucide-react";
import type { RevisionListItem } from "@/types/bom";
import { BomStatusBadge } from "../BomStatusBadge";
import { formatDate } from "@/lib/bomAccess";
import { EntityHistoryButton } from "@/components/features/audit/EntityHistoryButton";

interface BomRevisionsTabProps {
  bomId: string;
  revisions: RevisionListItem[];
  isLoading: boolean;
  currentRevisionId?: string;
  canPromote?: boolean;
  onOpenDiff: (revId: string) => void;
  onPromote?: (revId: string) => void;
}

export function BomRevisionsTab({
  bomId,
  revisions,
  isLoading,
  currentRevisionId,
  canPromote = false,
  onOpenDiff,
  onPromote,
}: BomRevisionsTabProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="h-6 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-20 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        <div className="h-20 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  if (!revisions || revisions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
        <GitBranch className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
        <p className="mt-3 font-medium text-gray-700 dark:text-gray-300">
          Chưa có dữ liệu phiên bản nào
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-4 dark:border-gray-800">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Lịch sử các phiên bản định mức
          </h3>
          <EntityHistoryButton
            aggregateType="BomTimeline"
            parentId={bomId}
            title="Lịch sử thay đổi NPL và các phiên bản"
            label="Lịch sử NPL"
            size="sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="text-theme-sm w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200/80 bg-gray-50/75 text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400">
                <th className="py-3.5 pr-2 pl-4">Phiên bản</th>
                <th className="px-3.5 py-3.5">Trạng thái</th>
                <th className="px-3.5 py-3.5">Lý do thay đổi</th>
                <th className="px-3.5 py-3.5">Thời điểm tạo</th>
                <th className="px-3.5 py-3.5">Phê duyệt</th>
                <th className="py-3.5 pr-4 pl-2 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {revisions.map((rev) => {
                const isCurrent = rev.id === currentRevisionId || rev.isCurrent;

                return (
                  <tr
                    key={rev.id}
                    className={`transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/50 ${
                      isCurrent ? "bg-brand-50/20 dark:bg-brand-950/10" : ""
                    }`}
                  >
                    {/* Rev No */}
                    <td className="py-3.5 pr-2 pl-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                          Phiên bản {rev.revisionNo}
                        </span>
                        {isCurrent && (
                          <span className="bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold">
                            Hiện tại
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-3.5 py-3.5">
                      <BomStatusBadge status={rev.status} />
                    </td>

                    {/* Change Reason */}
                    <td className="text-theme-xs max-w-[260px] truncate px-3.5 py-3.5 text-gray-600 dark:text-gray-300">
                      {rev.changeReason || "—"}
                    </td>

                    {/* Created Date */}
                    <td className="text-theme-xs px-3.5 py-3.5 text-gray-500 dark:text-gray-400">
                      {formatDate(rev.createdAt)}
                    </td>

                    {/* Approved Info */}
                    <td className="text-theme-xs px-3.5 py-3.5 text-gray-500 dark:text-gray-400">
                      {rev.approvedAt ? (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{formatDate(rev.approvedAt)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 pr-4 pl-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenDiff(rev.id)}
                          className="text-theme-xs inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 font-medium text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                          title="So sánh với phiên bản khác"
                        >
                          <GitCompare className="text-brand-600 dark:text-brand-400 h-3.5 w-3.5" />
                          <span>So sánh</span>
                        </button>
                        {canPromote && !isCurrent && onPromote && (
                          <button
                            type="button"
                            onClick={() => onPromote(rev.id)}
                            className="border-brand-200 bg-brand-50 text-theme-xs text-brand-700 hover:bg-brand-100 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-300 inline-flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1 font-medium shadow-2xs"
                            title="Đặt làm phiên bản hiện hành"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Đặt làm hiện hành</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
