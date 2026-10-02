import apiClient from "@/lib/apiClient";
import type {
  DashboardPeriod,
  ManagementDashboardManagementSummary,
  ManagementPurchaseOrdersOverview,
} from "@/types/management-dashboard";
import {
  managementDashboardSummarySchema,
  dashboardPeriodSchema,
  managementPurchaseOrdersOverviewSchema,
} from "./management-dashboard.schema";

const resource = "/management/dashboard/summary";

export const managementDashboardApi = {
  async getSummary(period: DashboardPeriod): Promise<ManagementDashboardManagementSummary> {
    const validatedPeriod = dashboardPeriodSchema.parse(period);
    const response = await apiClient.get<ManagementDashboardManagementSummary>(resource, {
      params: validatedPeriod,
    });
    return managementDashboardSummarySchema.parse(response.data);
  },
  async getPurchaseOrdersOverview(
    month: string,
    page: number,
    limit: number,
    signal: AbortSignal,
  ): Promise<ManagementPurchaseOrdersOverview> {
    const response = await apiClient.get<ManagementPurchaseOrdersOverview>(
      "/management/dashboard/purchase-orders",
      { params: { month, page, limit }, signal },
    );
    return managementPurchaseOrdersOverviewSchema.parse(response.data);
  },
};
