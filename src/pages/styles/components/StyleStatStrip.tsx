import type { Style } from "@/types/style";

interface Props {
  styles: Style[];
  totalCount: number;
}

export function StyleStatStrip({ styles, totalCount }: Props) {
  const draftCount = styles.filter((s) => s.status === "draft").length;
  const approvedCount = styles.filter((s) => s.status === "approved").length;
  const activeCount = styles.filter((s) => s.status === "active").length;

  return (
    <div className="rounded-xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:divide-x sm:divide-gray-100 sm:dark:divide-gray-800">
        {/* Total Metric */}
        <div className="sm:pr-6">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Tổng số Mẫu Fit
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {totalCount}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Master Data
            </span>
          </div>
        </div>

        {/* Draft Metric */}
        <div className="sm:px-6">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Draft
            </span>
          </div>
          <div className="mt-1">
            <span className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {draftCount}
            </span>
          </div>
        </div>

        {/* Approved Metric */}
        <div className="sm:px-6">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Approved
            </span>
          </div>
          <div className="mt-1">
            <span className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {approvedCount}
            </span>
          </div>
        </div>

        {/* Active Metric */}
        <div className="sm:pl-6">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Active
            </span>
          </div>
          <div className="mt-1">
            <span className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {activeCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
