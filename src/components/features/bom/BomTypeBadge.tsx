import type { BomType } from "@/types/bom";
import { BADGE_BASE, BADGE_BLUE, BADGE_PURPLE } from "@/components/features/audit/auditShared";

interface BomTypeBadgeProps {
  type: BomType;
  showDot?: boolean;
}

export function BomTypeBadge({ type, showDot = true }: BomTypeBadgeProps) {
  const badgeColor = type === "fit" ? BADGE_PURPLE : BADGE_BLUE;
  const dotColor = type === "fit" ? "bg-purple-600 dark:bg-purple-400" : "bg-blue-600 dark:bg-blue-400";

  if (type === "fit") {
    return (
      <span className={`${BADGE_BASE} ${badgeColor} inline-flex items-center gap-1.5`}>
        {showDot && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />}
        Mẫu Fit
      </span>
    );
  }

  return (
    <span className={`${BADGE_BASE} ${badgeColor} inline-flex items-center gap-1.5`}>
      {showDot && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />}
      PO
    </span>
  );
}
