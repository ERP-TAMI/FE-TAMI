import type {
  ManagementPurchaseOrderItem,
  ManagementPurchaseOrderSummaryStatus,
} from "@/types/management-dashboard";

type ManagementPoSummaryInput = Pick<
  ManagementPurchaseOrderItem,
  "status" | "deadline" | "managementStatus" | "daysToDeadline"
>;

export type ManagementPoSummary = {
  managementStatus: ManagementPurchaseOrderSummaryStatus;
  daysToDeadline: number;
};

export function getVietnamBusinessDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function getUtcDayNumber(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(0);
  value.setUTCFullYear(year, month - 1, day);
  value.setUTCHours(0, 0, 0, 0);
  return value.getTime() / 86_400_000;
}

function getManagementStatus(
  item: ManagementPoSummaryInput,
  daysToDeadline: number,
): ManagementPurchaseOrderSummaryStatus {
  if (item.status === "cancelled") return "cancelled";
  if (item.status === "closed") return "completed";
  return daysToDeadline < 0 ? "overdue" : "not_completed";
}

export function resolveManagementPoSummary(
  item: ManagementPoSummaryInput,
  today = getVietnamBusinessDate(),
): ManagementPoSummary {
  const daysToDeadline =
    item.daysToDeadline ?? getUtcDayNumber(item.deadline) - getUtcDayNumber(today);
  return {
    managementStatus: item.managementStatus ?? getManagementStatus(item, daysToDeadline),
    daysToDeadline,
  };
}

type ManagementPoStatusDisplay = {
  label: string;
  badgeClassName: string;
  dotClassName: string;
};

const managementPoStatusDisplays: Record<
  ManagementPurchaseOrderSummaryStatus,
  ManagementPoStatusDisplay
> = {
  not_completed: {
    label: "Chưa xong",
    badgeClassName:
      "border-blue-200/80 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300",
    dotClassName: "bg-blue-500",
  },
  completed: {
    label: "Hoàn thành",
    badgeClassName:
      "border-success-200/80 bg-success-50 text-success-700 dark:border-success-900/50 dark:bg-success-950/30 dark:text-success-300",
    dotClassName: "bg-success-500",
  },
  overdue: {
    label: "Trễ hạn",
    badgeClassName:
      "border-error-200/80 bg-error-50 text-error-700 dark:border-error-900/50 dark:bg-error-950/30 dark:text-error-300",
    dotClassName: "bg-error-500",
  },
  cancelled: {
    label: "Đã hủy",
    badgeClassName:
      "border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300",
    dotClassName: "bg-gray-500",
  },
};

export function getManagementPoStatusDisplay(
  status: ManagementPurchaseOrderSummaryStatus,
): ManagementPoStatusDisplay {
  return managementPoStatusDisplays[status];
}

type DeadlineTone = "danger" | "warning" | "neutral";

type ManagementPoDeadlineDisplay = {
  label: string;
  tone: DeadlineTone;
  className: string;
};

export function getManagementPoDeadlineDisplay(
  status: ManagementPurchaseOrderSummaryStatus,
  daysToDeadline: number,
): ManagementPoDeadlineDisplay {
  if (status === "completed" || status === "cancelled") {
    return { label: "—", tone: "neutral", className: "text-gray-500 dark:text-gray-400" };
  }

  if (status === "overdue") {
    return {
      label: `Trễ ${Math.abs(daysToDeadline)} ngày`,
      tone: "danger",
      className: "text-error-700 dark:text-error-300",
    };
  }

  if (daysToDeadline === 0) {
    return {
      label: "Đến hạn hôm nay",
      tone: "warning",
      className: "text-amber-700 dark:text-amber-300",
    };
  }

  if (daysToDeadline < 7) {
    return {
      label: `Còn ${daysToDeadline} ngày`,
      tone: "warning",
      className: "text-amber-700 dark:text-amber-300",
    };
  }

  return {
    label: `Còn ${daysToDeadline} ngày`,
    tone: "neutral",
    className: "text-gray-700 dark:text-gray-300",
  };
}
