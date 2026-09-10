import apiClient from "@/lib/apiClient";
import type { ManagementDashboardSummary } from "@/types/management-dashboard";
import { managementDashboardSummarySchema } from "./management-dashboard.schema";

const resource = "/management/dashboard/summary";

export const managementDashboardApi = {
  async getSummary(month: string): Promise<ManagementDashboardSummary> {
    const response = await apiClient.get<ManagementDashboardSummary>(resource, {
      params: { month },
    });
    return managementDashboardSummarySchema.parse(response.data);
  },
};
