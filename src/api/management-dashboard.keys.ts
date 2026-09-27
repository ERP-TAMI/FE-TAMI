export const managementDashboardKeys = {
  all: ["management-dashboard"] as const,
  summaries: () => [...managementDashboardKeys.all, "summary"] as const,
  summary: (month: string) => [...managementDashboardKeys.summaries(), { month }] as const,
  purchaseOrders: (month: string, page: number, limit: number) =>
    [...managementDashboardKeys.all, "purchase-orders", { month, page, limit }] as const,
};
