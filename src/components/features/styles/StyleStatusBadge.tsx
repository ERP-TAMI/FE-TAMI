import type { StyleStatus } from "@/types/style";

interface Props {
  status: StyleStatus;
  showDot?: boolean;
}

export function StyleStatusBadge({ status, showDot = true }: Props) {
  switch (status) {
    case "draft":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40">
          {showDot && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />}
          Nháp
        </span>
      );
    case "active":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40">
          {showDot && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />}
          Hoạt động
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
          Không xác định
        </span>
      );
  }
}
