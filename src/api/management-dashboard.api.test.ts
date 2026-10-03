import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/apiClient";
import { managementDashboardApi } from "./management-dashboard.api";

vi.mock("@/lib/apiClient", () => ({
  default: {
    get: vi.fn(),
  },
}));

const summary = {
  periodType: "month",
  periodStart: "2026-09-01",
  periodEnd: "2026-09-30",
  trendGranularity: "day",
  totalPurchaseOrders: 12,
  completedPurchaseOrders: 5,
  cancelledPurchaseOrders: 2,
  processingPurchaseOrders: 18,
  overdueProductPurchaseOrders: 3,
  upcomingProductPurchaseOrders: 4,
  pendingBomCount: 7,
  trend: [],
  purchaseOrderStatuses: [],
  bomRevisionStatuses: [],
  topCustomers: [],
  overdueQueue: [],
  upcomingQueue: [],
  pendingBomQueue: [],
  activeEmployees: 24,
};

describe("managementDashboardApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests and validates the dashboard summary for the selected date range", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: summary });

    await expect(
      managementDashboardApi.getSummary({
        periodType: "range",
        fromDate: "2026-09-01",
        toDate: "2026-09-30",
      }),
    ).resolves.toEqual(summary);
    expect(apiClient.get).toHaveBeenCalledWith("/management/dashboard/summary", {
      params: { periodType: "range", fromDate: "2026-09-01", toDate: "2026-09-30" },
    });
  });

  it("rejects an invalid response instead of displaying corrupt metrics", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { ...summary, overdueProductPurchaseOrders: -1 },
    });

    await expect(
      managementDashboardApi.getSummary({ periodType: "month", month: "2026-09" }),
    ).rejects.toThrow();
  });

  it("rejects a response containing the unsupported year zero", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { ...summary, periodStart: "0000-09-01" },
    });

    await expect(
      managementDashboardApi.getSummary({ periodType: "month", month: "2026-09" }),
    ).rejects.toThrow();
  });

  it("rejects trend periods that do not match the declared granularity", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        ...summary,
        trend: [{ period: "2026-09", received: 12, completed: 5 }],
      },
    });

    await expect(
      managementDashboardApi.getSummary({ periodType: "month", month: "2026-09" }),
    ).rejects.toThrow();
  });

  it("requests and validates management status and deadline-day fields", async () => {
    const overview = {
      month: "2026-09",
      totalPurchaseOrders: 1,
      overduePurchaseOrders: 1,
      upcomingPurchaseOrders: 0,
      items: [
        {
          id: "00000000-0000-4000-8000-000000000001",
          poCode: "PO-OVERDUE",
          customerNameSnapshot: "Khách hàng A",
          receivedDate: "2026-09-01",
          deadline: "2026-09-25",
          status: "in_progress",
          managementStatus: "overdue",
          daysToDeadline: -2,
        },
      ],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };
    const signal = new AbortController().signal;
    vi.mocked(apiClient.get).mockResolvedValue({ data: overview });

    await expect(
      managementDashboardApi.getPurchaseOrdersOverview("2026-09", 1, 10, signal),
    ).resolves.toEqual(overview);

    expect(apiClient.get).toHaveBeenCalledWith("/management/dashboard/purchase-orders", {
      params: { month: "2026-09", page: 1, limit: 10 },
      signal,
    });
  });

  it("accepts the S34-DASH-03 parent response before additive status fields land", async () => {
    const parentVersionOverview = {
      month: "2026-09",
      totalPurchaseOrders: 1,
      overduePurchaseOrders: 1,
      upcomingPurchaseOrders: 0,
      items: [
        {
          id: "00000000-0000-4000-8000-000000000001",
          poCode: "PO-OVERDUE",
          customerNameSnapshot: "Khách hàng A",
          receivedDate: "2026-09-01",
          deadline: "2026-09-25",
          status: "in_progress",
        },
      ],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: parentVersionOverview });

    await expect(
      managementDashboardApi.getPurchaseOrdersOverview(
        "2026-09",
        1,
        10,
        new AbortController().signal,
      ),
    ).resolves.toEqual(parentVersionOverview);
  });

  it("rejects unsupported management statuses and fractional deadline-day values", async () => {
    const item = {
      id: "00000000-0000-4000-8000-000000000001",
      poCode: "PO-OVERDUE",
      customerNameSnapshot: "Khách hàng A",
      receivedDate: "2026-09-01",
      deadline: "2026-09-25",
      status: "in_progress",
      managementStatus: "past_due",
      daysToDeadline: -1.5,
    };
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        month: "2026-09",
        totalPurchaseOrders: 1,
        overduePurchaseOrders: 1,
        upcomingPurchaseOrders: 0,
        items: [item],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      },
    });

    await expect(
      managementDashboardApi.getPurchaseOrdersOverview(
        "2026-09",
        1,
        10,
        new AbortController().signal,
      ),
    ).rejects.toThrow();
  });
});
