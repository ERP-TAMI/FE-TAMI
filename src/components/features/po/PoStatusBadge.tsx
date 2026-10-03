import type { PoStatus } from "@/types/po";
import { STATUS_BADGE_BASE as BASE } from "@/components/shared/badgeStyles";

interface Props {
  status: PoStatus;
  showDot?: boolean;
}

export function PoStatusBadge({ status, showDot = true }: Props) {
  switch (status) {
    case "draft":
      return (
        <span
          className={`${BASE} border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300`}
        >
          {showDot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-500" />}
          Nháp
        </span>
      );
    case "pending_rd":
      return (
        <span
          className={`${BASE} border-purple-200/80 bg-purple-50 text-purple-700 dark:border-purple-900/50 dark:bg-purple-950/30 dark:text-purple-300`}
        >
          {showDot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />}
          Chờ R&D
        </span>
      );
    case "in_progress":
      return (
        <span
          className={`${BASE} border-blue-200/80 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300`}
        >
          {showDot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />}
          Đang xử lý
        </span>
      );
    case "closed":
      return (
        <span
          className={`${BASE} border-success-200/80 bg-success-50 text-success-700 dark:border-success-900/50 dark:bg-success-950/30 dark:text-success-300`}
        >
          {showDot && <span className="bg-success-500 h-1.5 w-1.5 shrink-0 rounded-full" />}
          Khóa
        </span>
      );
    case "cancelled":
      return (
        <span
          className={`${BASE} border-error-200/80 bg-error-50 text-error-700 dark:border-error-900/50 dark:bg-error-950/30 dark:text-error-300`}
        >
          {showDot && <span className="bg-error-500 h-1.5 w-1.5 shrink-0 rounded-full" />}
          Đã hủy
        </span>
      );
    default:
      return (
        <span
          className={`${BASE} border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300`}
        >
          Không xác định
        </span>
      );
  }
}
