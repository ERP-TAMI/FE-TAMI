import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ManagementDashboardPage from "./ManagementDashboardPage";

const hooks = vi.hoisted(() => ({
  useManagementDashboardSummary: vi.fn(),
}));

vi.mock("@/hooks/useManagementDashboard", () => ({
  useManagementDashboardSummary: hooks.useManagementDashboardSummary,
}));

const summary = {
  periodType: "month" as const,
  periodStart: "2026-09-01",
  periodEnd: "2026-09-30",
  trendGranularity: "day" as const,
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

describe("ManagementDashboardPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-08T09:00:00+07:00"));
    hooks.useManagementDashboardSummary.mockReturnValue({
      data: summary,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("shows operational metrics and management employee count", () => {
    render(<ManagementDashboardPage />);

    expect(screen.getByText("Tổng PO tháng").nextElementSibling?.textContent).toBe("12");
    expect(screen.getByText("PO hoàn thành").nextElementSibling?.textContent).toBe("5");
    expect(screen.getAllByText("PO có sản phẩm quá hạn")[0].nextElementSibling?.textContent).toBe(
      "3",
    );
    expect(screen.getByText("Nhân viên hoạt động").nextElementSibling?.textContent).toBe("24");
    expect(hooks.useManagementDashboardSummary).toHaveBeenCalledWith({
      periodType: "month",
      month: "2026-09",
    });
  });

  it("loads PO metrics again when the selected month changes", () => {
    render(<ManagementDashboardPage />);

    fireEvent.change(screen.getByLabelText("Tháng tiếp nhận PO"), {
      target: { value: "2026-08" },
    });

    expect(hooks.useManagementDashboardSummary).toHaveBeenLastCalledWith({
      periodType: "month",
      month: "2026-08",
    });
  });

  it("loads metrics for the selected year", () => {
    render(<ManagementDashboardPage />);
    fireEvent.change(screen.getByLabelText("Kỳ thống kê"), { target: { value: "year" } });
    fireEvent.change(screen.getByLabelText("Năm tiếp nhận PO"), { target: { value: "2025" } });

    expect(hooks.useManagementDashboardSummary).toHaveBeenLastCalledWith({
      periodType: "year",
      year: "2025",
    });
  });

  it("defaults to the current business month in Vietnam even when the browser uses UTC", () => {
    vi.stubEnv("TZ", "UTC");
    vi.setSystemTime(new Date("2026-09-30T18:00:00Z"));

    render(<ManagementDashboardPage />);

    expect(hooks.useManagementDashboardSummary).toHaveBeenCalledWith({
      periodType: "month",
      month: "2026-10",
    });
    expect(screen.getByLabelText("Tháng tiếp nhận PO")).toHaveProperty("value", "2026-10");
  });

  it("prevents selecting the unsupported year zero", () => {
    render(<ManagementDashboardPage />);

    expect(screen.getByLabelText("Tháng tiếp nhận PO").getAttribute("min")).toBe("0001-01");
  });

  it("requests the exact inclusive date range selected by the user", () => {
    render(<ManagementDashboardPage />);
    fireEvent.change(screen.getByLabelText("Kỳ thống kê"), { target: { value: "range" } });
    fireEvent.change(screen.getByLabelText("Từ ngày"), { target: { value: "2026-09-05" } });
    fireEvent.change(screen.getByLabelText("Đến ngày"), { target: { value: "2026-09-19" } });

    expect(hooks.useManagementDashboardSummary).toHaveBeenLastCalledWith({
      periodType: "range",
      fromDate: "2026-09-05",
      toDate: "2026-09-19",
    });
  });

  it("shows an accessible loading state", () => {
    hooks.useManagementDashboardSummary.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    render(<ManagementDashboardPage />);

    expect(screen.getByRole("status", { name: "Đang tải số liệu dashboard" })).toBeTruthy();
  });

  it("shows a retry action when loading fails", () => {
    const refetch = vi.fn();
    hooks.useManagementDashboardSummary.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    });

    render(<ManagementDashboardPage />);
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));

    expect(refetch).toHaveBeenCalledOnce();
  });

  it("keeps the KPI cards visible when every metric is zero", () => {
    hooks.useManagementDashboardSummary.mockReturnValue({
      data: {
        ...summary,
        totalPurchaseOrders: 0,
        completedPurchaseOrders: 0,
        cancelledPurchaseOrders: 0,
        processingPurchaseOrders: 0,
        overdueProductPurchaseOrders: 0,
        upcomingProductPurchaseOrders: 0,
        pendingBomCount: 0,
        activeEmployees: 0,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<ManagementDashboardPage />);

    expect(screen.getByText("Tổng PO tháng").nextElementSibling?.textContent).toBe("0");
    expect(screen.getByText("Nhân viên hoạt động").nextElementSibling?.textContent).toBe("0");
  });
});
