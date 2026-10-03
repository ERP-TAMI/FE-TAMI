import { STATUS_BADGE_BASE as BASE } from "@/components/shared/badgeStyles";

interface Props {
  status?: string | null;
  showDot?: boolean;
}

export function ProductStatusBadge({ status, showDot = true }: Props) {
  const isLocked = status === "closed";

  if (isLocked) {
    return (
      <span
        className={`${BASE} border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300`}
      >
        {showDot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />}
        Khóa
      </span>
    );
  }

  return (
    <span
      className={`${BASE} border-blue-200/80 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300`}
    >
      {showDot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />}
      Đang xử lý
    </span>
  );
}
