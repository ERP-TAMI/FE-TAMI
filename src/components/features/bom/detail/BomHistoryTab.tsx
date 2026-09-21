import { Clock, ArrowRight, RotateCcw, CheckCircle2, ShieldAlert } from "lucide-react";
import type { BomWorkflowHistoryItem } from "@/types/bom";
import { BomStatusBadge } from "../BomStatusBadge";
import { formatDate } from "@/lib/bomAccess";

interface BomHistoryTabProps {
  history: BomWorkflowHistoryItem[];
  isLoading: boolean;
}

export function BomHistoryTab({ history, isLoading }: BomHistoryTabProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="h-6 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-16 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        <div className="h-16 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
        <Clock className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
        <p className="mt-3 font-medium text-gray-700 dark:text-gray-300">
          Chưa có nhật ký chuyển trạng thái nào
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-6">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Nhật ký luân chuyển quy trình (Workflow Audit Trail)
        </h3>
        <p className="text-theme-xs text-gray-500 dark:text-gray-400">
          Lịch sử các bước phê duyệt, chuyển tiếp và từ chối của định mức
        </p>
      </div>

      <div className="relative pl-6">
        {/* Vertical Line */}
        <div className="absolute bottom-3 left-2.5 top-3 w-0.5 bg-gray-200 dark:bg-gray-700" />

        <div className="flex flex-col gap-6">
          {history.map((item, idx) => {
            const isReject = item.reason != null;
            const isApprove = item.toStatus === "closed";

            return (
              <div key={item.id || idx} className="relative flex items-start gap-4">
                {/* Node Icon */}
                <div
                  className={`absolute -left-6 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white dark:bg-gray-900 ${
                    isReject
                      ? "border-amber-500 text-amber-500"
                      : isApprove
                      ? "border-emerald-500 text-emerald-500"
                      : "border-brand-500 text-brand-500"
                  }`}
                >
                  {isReject ? (
                    <RotateCcw className="h-3 w-3" />
                  ) : isApprove ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <ArrowRight className="h-3 w-3" />
                  )}
                </div>

                {/* Content Box */}
                <div className="flex-1 rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <BomStatusBadge status={item.fromStatus} showDot={false} />
                      <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                      <BomStatusBadge status={item.toStatus} />
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  {item.reason && (
                    <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 text-theme-xs text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300">
                      <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
                      <div>
                        <span className="font-semibold">Lý do trả lại: </span>
                        <span>{item.reason}</span>
                      </div>
                    </div>
                  )}

                  {item.note && (
                    <p className="mt-2 text-theme-xs text-gray-600 dark:text-gray-300">
                      <span className="font-semibold text-gray-700 dark:text-gray-200">Ghi chú: </span>
                      {item.note}
                    </p>
                  )}

                  {item.changedBy && (
                    <div className="mt-2 text-[11px] text-gray-400">
                      Thực hiện bởi: <span className="font-medium text-gray-600 dark:text-gray-300">{item.changedBy}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
