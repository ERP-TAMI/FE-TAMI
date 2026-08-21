import type { Style } from "@/types/style";

interface Props {
  styles: Style[];
  totalCount: number;
}

export function StyleStatCards({ styles, totalCount }: Props) {
  const draftCount = styles.filter((s) => s.status === "draft").length;
  const approvedCount = styles.filter((s) => s.status === "approved").length;
  const activeCount = styles.filter((s) => s.status === "active").length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Card */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Tổng số Mẫu Fit
            </p>
            <h3 className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">
              {totalCount}
            </h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            👕
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
          <span className="font-medium text-blue-600">ERP Master Data</span>
          <span>• Tất cả mẫu Fit</span>
        </div>
      </div>

      {/* Draft Card */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-200/60 bg-amber-50/30 p-5 shadow-sm transition hover:shadow-md dark:border-amber-900/40 dark:bg-amber-950/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Bản Nháp (Draft)
            </p>
            <h3 className="mt-2 text-3xl font-extrabold text-amber-900 dark:text-amber-200">
              {draftCount}
            </h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-2xl text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
            📝
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-700/80 dark:text-amber-400/80">
          <span>Đang tạo hoặc chỉnh sửa</span>
        </div>
      </div>

      {/* Approved Card */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-200/60 bg-blue-50/30 p-5 shadow-sm transition hover:shadow-md dark:border-blue-900/40 dark:bg-blue-950/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Đã Duyệt (Approved)
            </p>
            <h3 className="mt-2 text-3xl font-extrabold text-blue-900 dark:text-blue-200">
              {approvedCount}
            </h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
            ✓
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-700/80 dark:text-blue-400/80">
          <span>Sẵn sàng đưa vào sản xuất</span>
        </div>
      </div>

      {/* Active Card */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-emerald-50/30 p-5 shadow-sm transition hover:shadow-md dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Hoạt động (Active)
            </p>
            <h3 className="mt-2 text-3xl font-extrabold text-emerald-900 dark:text-emerald-200">
              {activeCount}
            </h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-2xl text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
            ★
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700/80 dark:text-emerald-400/80">
          <span>Đang sử dụng chính thức</span>
        </div>
      </div>
    </div>
  );
}
