import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/api/dashboard.api";
import { dashboardKeys } from "@/api/dashboard.keys";
import { dashboardPeriodSchema } from "@/api/management-dashboard.schema";
import type { DashboardPeriod } from "@/types/management-dashboard";

export function useDashboardSummary(period: DashboardPeriod) {
  return useQuery({
    queryKey: dashboardKeys.summary(period),
    queryFn: () => dashboardApi.getSummary(period),
    enabled: dashboardPeriodSchema.safeParse(period).success,
  });
}
