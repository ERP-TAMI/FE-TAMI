import type { DashboardPeriod } from "@/types/management-dashboard";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: (period: DashboardPeriod) => [...dashboardKeys.all, "summary", period] as const,
};
