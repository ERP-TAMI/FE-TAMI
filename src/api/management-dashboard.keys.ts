export const managementDashboardKeys = {
  all: ["management-dashboard"] as const,
  summaries: () => [...managementDashboardKeys.all, "summary"] as const,
  summary: (month: string) => [...managementDashboardKeys.summaries(), { month }] as const,
  purchaseOrders: () => [...managementDashboardKeys.all, "purchase-orders"] as const,
  purchaseOrdersByPage: (month: string, page: number, limit: number) =>
    [...managementDashboardKeys.purchaseOrders(), { month, page, limit }] as const,
};
