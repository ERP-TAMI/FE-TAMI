import type { NplStatus } from "@/types/npl";

interface Props {
  status: NplStatus;
  showDot?: boolean;
}

const config: Record<NplStatus, { label: string; classes: string; dotClass: string }> = {
  Approved: {
    label: "Đã duyệt",
    classes:
      "border-brand-200/70 bg-brand-50/70 text-brand-700 dark:border-brand-900/40 dark:bg-brand-950/30 dark:text-brand-300",
    dotClass: "bg-brand-500",
  },
  Wait_RD: {
    label: "Chờ R&D",
    classes:
      "border-amber-200/40 bg-amber-50/40 text-amber-700/80 dark:border-amber-900/20 dark:bg-amber-950/15 dark:text-amber-300/80",
    dotClass: "bg-amber-400/80",
  },
  Wait_Price: {
    label: "Chờ nhập giá",
    classes:
      "border-amber-200/40 bg-amber-50/40 text-amber-700/80 dark:border-amber-900/20 dark:bg-amber-950/15 dark:text-amber-300/80",
    dotClass: "bg-amber-400/80",
  },
  Wait_TP_Approve: {
    label: "Chờ TP duyệt",
    classes:
      "border-amber-200/40 bg-amber-50/40 text-amber-700/80 dark:border-amber-900/20 dark:bg-amber-950/15 dark:text-amber-300/80",
    dotClass: "bg-amber-400/80",
  },
  Wait_SA_Approve: {
    label: "Chờ GĐ duyệt",
    classes:
      "border-amber-200/40 bg-amber-50/40 text-amber-700/80 dark:border-amber-900/20 dark:bg-amber-950/15 dark:text-amber-300/80",
    dotClass: "bg-amber-400/80",
  },
  Draft: {
    label: "Nháp",
    classes:
      "border-gray-200/60 bg-gray-50/60 text-gray-500 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-400",
    dotClass: "bg-gray-400",
  },
  Locked: {
    label: "Đã khóa",
    classes:
      "border-gray-200/60 bg-gray-50/60 text-gray-500 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-400",
    dotClass: "bg-gray-400",
  },
};

export function NplStatusBadge({ status, showDot = true }: Props) {
  const cfg = config[status] ?? {
    label: status,
    classes:
      "border-gray-200/60 bg-gray-50/60 text-gray-500 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-400",
    dotClass: "bg-gray-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-theme-xs font-medium leading-none ${cfg.classes}`}
    >
      {showDot && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dotClass}`} />}
      {cfg.label}
    </span>
  );
}
