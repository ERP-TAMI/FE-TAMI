import apiClient from "@/lib/apiClient";
import type {
  ManagementDashboardSummary,
  ManagementPurchaseOrdersOverview,
} from "@/types/management-dashboard";
import {
  managementDashboardSummarySchema,
  managementPurchaseOrdersOverviewSchema,
} from "./management-dashboard.schema";

const resource = "/management/dashboard/summary";

export const managementDashboardApi = {
  async getSummary(month: string): Promise<ManagementDashboardSummary> {
    const response = await apiClient.get<ManagementDashboardSummary>(resource, {
      params: { month },
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
