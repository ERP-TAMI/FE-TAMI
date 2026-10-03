import type { ManagementPurchaseOrderSummaryStatus } from "@/types/management-dashboard";
import { STATUS_BADGE_BASE as BASE } from "@/components/shared/badgeStyles";
import {
  getManagementPoDeadlineDisplay,
  getManagementPoStatusDisplay,
} from "./managementPoOverviewPresentation";

type StatusBadgeProps = {
  status: ManagementPurchaseOrderSummaryStatus;
};

export function ManagementPoSummaryStatusBadge({ status }: StatusBadgeProps) {
  const display = getManagementPoStatusDisplay(status);

  return (
    <span
      aria-label={`Trạng thái: ${display.label}`}
      className={`${BASE} py-1 ${display.badgeClassName}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${display.dotClassName}`}
      />
      {display.label}
    </span>
  );
}

type DeadlineLabelProps = {
  status: ManagementPurchaseOrderSummaryStatus;
  daysToDeadline: number;
};

export function ManagementPoDeadlineLabel({ status, daysToDeadline }: DeadlineLabelProps) {
  const display = getManagementPoDeadlineDisplay(status, daysToDeadline);

  return (
    <span className={`font-medium whitespace-nowrap ${display.className}`}>{display.label}</span>
  );
}
