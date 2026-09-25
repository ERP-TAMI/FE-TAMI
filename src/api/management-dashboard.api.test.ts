import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/apiClient";
import { managementDashboardApi } from "./management-dashboard.api";

vi.mock("@/lib/apiClient", () => ({
  default: {
    get: vi.fn(),
  },
}));

const summary = {
  month: "2026-09",
  totalPurchaseOrders: 12,
  completedPurchaseOrders: 5,
  overduePurchaseOrders: 3,
  activeEmployees: 24,
};

describe("managementDashboardApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests and validates the dashboard summary for the selected month", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: summary });

    await expect(managementDashboardApi.getSummary("2026-09")).resolves.toEqual(summary);
    expect(apiClient.get).toHaveBeenCalledWith("/management/dashboard/summary", {
      params: { month: "2026-09" },
    });
  });

  it("rejects an invalid response instead of displaying corrupt metrics", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { ...summary, overduePurchaseOrders: -1 },
    });

    await expect(managementDashboardApi.getSummary("2026-09")).rejects.toThrow();
  });

  it("rejects a response containing the unsupported year zero", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { ...summary, month: "0000-01" },
    });

    await expect(managementDashboardApi.getSummary("2026-09")).rejects.toThrow();
  });
});
