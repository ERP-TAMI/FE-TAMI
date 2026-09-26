import { ArrowRight } from "lucide-react";

interface BomRdBottomBarProps {
  totalCount: number;
  enteredCount: number;
  onCancel: () => void;
  onComplete: () => void;
  isSubmitting?: boolean;
}

export function BomRdBottomBar({
  totalCount,
  enteredCount,
  onCancel,
  onComplete,
  isSubmitting = false,
}: BomRdBottomBarProps) {
  const remaining = Math.max(0, totalCount - enteredCount);
  const percentage = totalCount > 0 ? Math.round((enteredCount / totalCount) * 100) : 0;

  return (
    <div className="sticky bottom-4 z-30 mt-6 w-full">
      <div className="flex items-center justify-between rounded-2xl border border-gray-200/90 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95">
        {/* Left: Progress Ring & Status */}
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <svg className="h-12 w-12 -rotate-90 transform" viewBox="0 0 36 36">
              <path
                className="text-gray-200 dark:text-gray-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-brand-600 transition-all duration-300 dark:text-brand-500"
                strokeDasharray={`${percentage}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute font-bold text-xs font-mono text-gray-900 dark:text-white">
              {enteredCount}/{totalCount}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="font-bold text-sm text-gray-900 dark:text-white">
              Đã nhập định mức
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {remaining > 0
                ? `Còn ${remaining} vật tư chưa nhập`
                : `Đã nhập đủ định mức cho ${totalCount}/${totalCount} vật tư`}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="cursor-pointer rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onComplete}
            disabled={isSubmitting}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50"
          >
            <span>{isSubmitting ? "Đang xử lý..." : "Hoàn tất định mức"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
