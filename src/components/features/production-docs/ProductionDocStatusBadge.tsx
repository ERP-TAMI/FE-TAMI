import type { ProductionDocStatus } from "@/types/production-doc";

const config: Record<ProductionDocStatus, { label: string; className: string }> = {
  draft: {
    label: "Nháp",
    className:
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
  },
  in_progress: {
    label: "Đang soạn",
    className:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/50",
  },
  completed: {
    label: "Hoàn tất",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50",
  },
};

interface Props {
  status: ProductionDocStatus;
  className?: string;
}

export function ProductionDocStatusBadge({ status, className = "" }: Props) {
  const item = config[status] ?? config.draft;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors ${item.className} ${className}`}
    >
      {item.label}
    </span>
  );
}
