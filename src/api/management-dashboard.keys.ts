export const managementDashboardKeys = {
  all: ["management-dashboard"] as const,
  summaries: () => [...managementDashboardKeys.all, "summary"] as const,
  summary: (month: string) => [...managementDashboardKeys.summaries(), { month }] as const,
};
