interface Props {
  status?: string | null;
  showDot?: boolean;
}

export function ProductStatusBadge({ status, showDot = true }: Props) {
  const isLocked = status === "closed";

  if (isLocked) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-rose-50 px-2.5 py-0.5 text-theme-xs font-semibold leading-none text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
        Khoá
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/80 bg-blue-50 px-2.5 py-0.5 text-theme-xs font-semibold leading-none text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
      {showDot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />}
      Đang Xử Lý
    </span>
  );
}
