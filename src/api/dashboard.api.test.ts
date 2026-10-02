import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/apiClient";
import { dashboardApi } from "./dashboard.api";

vi.mock("@/lib/apiClient", () => ({
  default: { get: vi.fn() },
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
  trend: [{ period: "2026-09-01", received: 12, completed: 5 }],
  purchaseOrderStatuses: [{ status: "in_progress", count: 18 }],
  bomRevisionStatuses: [{ status: "wait_rd", count: 7 }],
  topCustomers: [{ customerName: "Khách hàng A", count: 4 }],
  overdueQueue: [
    {
      purchaseOrderId: "00000000-0000-4000-8000-000000000001",
      poCode: "PO-OVERDUE",
      customerName: "Khách hàng A",
      deadline: "2026-09-28",
      productCount: 2,
    },
  ],
  upcomingQueue: [],
  pendingBomQueue: [
    {
      bomId: "00000000-0000-4000-8000-000000000002",
      bomCode: "BOM-2026-001",
      productName: "Áo thun",
      bomType: "po",
      status: "wait_rd",
      createdAt: "2026-09-29T10:00:00.000Z",
    },
  ],
};

describe("dashboardApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requests and validates the selected calendar year's business summary", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: summary });

    await expect(dashboardApi.getSummary({ periodType: "year", year: "2026" })).resolves.toEqual(
      summary,
    );
    expect(apiClient.get).toHaveBeenCalledWith("/dashboard/summary", {
      params: { periodType: "year", year: "2026" },
    });
  });

  it("accepts aligned current and previous receipt trends while allowing legacy responses", async () => {
    const comparison = {
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      currentEnd: "2026-09-30",
      trend: [{ period: "2026-09-01", received: 8 }],
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: { ...summary, comparison } });

    await expect(
      dashboardApi.getSummary({ periodType: "month", month: "2026-09" }),
    ).resolves.toMatchObject({ comparison });

    vi.mocked(apiClient.get).mockResolvedValue({ data: summary });
    await expect(
      dashboardApi.getSummary({ periodType: "month", month: "2026-09" }),
    ).resolves.toMatchObject({ trend: summary.trend });
  });

  it("rejects comparison trends whose buckets do not align with the selected trend", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        ...summary,
        comparison: {
          periodStart: "2026-08-01",
          periodEnd: "2026-08-31",
          currentEnd: "2026-09-30",
          trend: [{ period: "2026-08-01", received: 8 }],
        },
      },
    });

    await expect(
      dashboardApi.getSummary({ periodType: "month", month: "2026-09" }),
    ).rejects.toThrow();
  });

  it("sends the selected date range as inclusive endpoints", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        ...summary,
        periodType: "range",
        periodStart: "2026-09-05",
        periodEnd: "2026-09-12",
        trendGranularity: "day",
      },
    });

    await dashboardApi.getSummary({
      periodType: "range",
      fromDate: "2026-09-05",
      toDate: "2026-09-12",
    });
    expect(apiClient.get).toHaveBeenCalledWith("/dashboard/summary", {
      params: { periodType: "range", fromDate: "2026-09-05", toDate: "2026-09-12" },
    });
  });

  it("rejects unapproved financial fields instead of accepting them silently", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { ...summary, poValue: 1200 } });

    await expect(
      dashboardApi.getSummary({ periodType: "month", month: "2026-09" }),
    ).rejects.toThrow();
  });

  it("rejects impossible dates and period precision that conflicts with trend granularity", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        ...summary,
        trend: [{ period: "2026-02-31", received: 12, completed: 5 }],
      },
    });

    await expect(
      dashboardApi.getSummary({ periodType: "month", month: "2026-09" }),
    ).rejects.toThrow();

    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        ...summary,
        trendGranularity: "month",
        trend: [{ period: "2026-09-01", received: 12, completed: 5 }],
      },
    });

    await expect(
      dashboardApi.getSummary({ periodType: "month", month: "2026-09" }),
    ).rejects.toThrow();
  });
});
