import { useQuery } from "@tanstack/react-query";
import { managementDashboardApi } from "@/api/management-dashboard.api";
import { managementDashboardKeys } from "@/api/management-dashboard.keys";

export function useManagementDashboardSummary(month: string) {
  return useQuery({
    queryKey: managementDashboardKeys.summary(month),
    queryFn: () => managementDashboardApi.getSummary(month),
  });
}
