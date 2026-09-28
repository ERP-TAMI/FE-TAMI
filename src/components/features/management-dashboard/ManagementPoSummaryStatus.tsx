import type { ManagementPurchaseOrderSummaryStatus } from "@/types/management-dashboard";
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
      className={`text-theme-xs inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 leading-none font-medium ${display.badgeClassName}`}
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
