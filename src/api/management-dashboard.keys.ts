import type { DashboardPeriod } from "@/types/management-dashboard";

export const managementDashboardKeys = {
  all: ["management-dashboard"] as const,
  summaries: () => [...managementDashboardKeys.all, "summary"] as const,
  summary: (period: DashboardPeriod) => [...managementDashboardKeys.summaries(), period] as const,
  purchaseOrders: () => [...managementDashboardKeys.all, "purchase-orders"] as const,
  purchaseOrdersByPage: (month: string, page: number, limit: number) =>
    [...managementDashboardKeys.purchaseOrders(), { month, page, limit }] as const,
};
