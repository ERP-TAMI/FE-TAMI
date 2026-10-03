import { BOM_STATUS_CONFIG } from "@/lib/bomAccess";
import {
  BADGE_AMBER,
  BADGE_BASE,
  BADGE_GREEN,
  BADGE_NEUTRAL,
  BADGE_RED,
} from "@/components/features/audit/auditShared";

const STATUS_BADGE_COLORS: Record<string, string> = {
  wait_nvkh: BADGE_NEUTRAL,
  Draft: BADGE_NEUTRAL,
  wait_rd: BADGE_AMBER,
  Wait_RD: BADGE_AMBER,
  wait_tpkh_confirm: BADGE_AMBER,
  Wait_TP_Approve: BADGE_AMBER,
  wait_accounting: BADGE_AMBER,
  Wait_Price: BADGE_AMBER,
  wait_sa_approve: BADGE_AMBER,
  Wait_SA_Approve: BADGE_AMBER,
  closed: BADGE_GREEN,
  Approved: BADGE_GREEN,
  discontinued: BADGE_RED,
  Locked: BADGE_RED,
};

interface BomStatusBadgeProps {
  status: string;
  showDot?: boolean;
}

export function BomStatusBadge({ status, showDot = true }: BomStatusBadgeProps) {
  const cfg = BOM_STATUS_CONFIG[status];

  return (
    <span
      className={`${BADGE_BASE} ${STATUS_BADGE_COLORS[status] ?? BADGE_NEUTRAL} inline-flex items-center gap-1.5`}
    >
      {showDot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80" />}
      {cfg?.label ?? status}
    </span>
  );
}
