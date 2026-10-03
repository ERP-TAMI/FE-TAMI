import type { StyleStatus } from "@/types/style";
import { STATUS_BADGE_BASE as BASE } from "@/components/shared/badgeStyles";

interface Props {
  status: StyleStatus;
  showDot?: boolean;
}

export function StyleStatusBadge({ status, showDot = true }: Props) {
  switch (status) {
    case "draft":
      return (
        <span
          className={`${BASE} border-amber-200/60 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-400`}
        >
          {showDot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />}
          Nháp
        </span>
      );
    case "active":
      return (
        <span
          className={`${BASE} border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-400`}
        >
          {showDot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />}
          Hoạt động
        </span>
      );
    default:
      return (
        <span
          className={`${BASE} border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300`}
        >
          Không xác định
        </span>
      );
  }
}
