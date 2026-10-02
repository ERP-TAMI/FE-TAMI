import { useQuery } from "@tanstack/react-query";
import { managementDashboardApi } from "@/api/management-dashboard.api";
import { managementDashboardKeys } from "@/api/management-dashboard.keys";
import {
  dashboardPeriodSchema,
  managementDashboardMonthSchema,
} from "@/api/management-dashboard.schema";
import type { DashboardPeriod } from "@/types/management-dashboard";

export function useManagementDashboardSummary(period: DashboardPeriod) {
  return useQuery({
    queryKey: managementDashboardKeys.summary(period),
    queryFn: () => managementDashboardApi.getSummary(period),
    enabled: dashboardPeriodSchema.safeParse(period).success,
  });
}

export function useManagementPurchaseOrdersOverview(month: string, page: number, limit: number) {
  return useQuery({
    queryKey: managementDashboardKeys.purchaseOrdersByPage(month, page, limit),
    queryFn: ({ signal }) =>
      managementDashboardApi.getPurchaseOrdersOverview(month, page, limit, signal),
    enabled: managementDashboardMonthSchema.safeParse(month).success,
    placeholderData: (previousData, previousQuery) => {
      const previousFilters = previousQuery?.queryKey[2];
      if (
        previousData &&
        previousFilters &&
        typeof previousFilters === "object" &&
        "month" in previousFilters &&
        previousFilters.month === month
      ) {
        return previousData;
      }
      return undefined;
    },
  });
}
