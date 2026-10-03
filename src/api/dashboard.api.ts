import apiClient from "@/lib/apiClient";
import type { DashboardPeriod, ManagementDashboardSummary } from "@/types/management-dashboard";
import {
  businessDashboardSummarySchema,
  dashboardPeriodSchema,
} from "./management-dashboard.schema";

export const dashboardApi = {
  async getSummary(period: DashboardPeriod): Promise<ManagementDashboardSummary> {
    const validatedPeriod = dashboardPeriodSchema.parse(period);
    const response = await apiClient.get<ManagementDashboardSummary>("/dashboard/summary", {
      params: validatedPeriod,
    });
    return businessDashboardSummarySchema.parse(response.data);
  },
};
