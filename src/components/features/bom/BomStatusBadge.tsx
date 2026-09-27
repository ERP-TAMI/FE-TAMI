import { BOM_STATUS_CONFIG } from "@/lib/bomAccess";

interface BomStatusBadgeProps {
  status: string;
  showDot?: boolean;
}

export function BomStatusBadge({ status, showDot = true }: BomStatusBadgeProps) {
  const cfg = BOM_STATUS_CONFIG[status] ?? {
    label: status,
    shortLabel: status,
    classes:
      "border-gray-200/60 bg-gray-50/60 text-gray-500 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-400",
    dotClass: "bg-gray-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-none ${cfg.classes}`}
    >
      {showDot && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dotClass}`} />}
      {cfg.label}
    </span>
  );
}
