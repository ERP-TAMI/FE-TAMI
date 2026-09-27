import { useQuery } from "@tanstack/react-query";
import { managementDashboardApi } from "@/api/management-dashboard.api";
import { managementDashboardKeys } from "@/api/management-dashboard.keys";
import { managementDashboardMonthSchema } from "@/api/management-dashboard.schema";

export function useManagementDashboardSummary(month: string) {
  return useQuery({
    queryKey: managementDashboardKeys.summary(month),
    queryFn: () => managementDashboardApi.getSummary(month),
  });
}

export function useManagementPurchaseOrdersOverview(month: string, page: number, limit: number) {
  return useQuery({
    queryKey: managementDashboardKeys.purchaseOrders(month, page, limit),
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
