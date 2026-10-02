import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardSummaryView } from "./DashboardSummaryView";

const data = {
  periodType: "month" as const,
  periodStart: "2026-09-01",
  periodEnd: "2026-09-30",
  trendGranularity: "day" as const,
  totalPurchaseOrders: 10,
  completedPurchaseOrders: 4,
  cancelledPurchaseOrders: 1,
  processingPurchaseOrders: 6,
  overdueProductPurchaseOrders: 2,
  upcomingProductPurchaseOrders: 3,
  pendingBomCount: 5,
  trend: [{ period: "2026-09-01", received: 10, completed: 4 }],
  comparison: {
    periodStart: "2026-08-01",
    periodEnd: "2026-08-31",
    currentEnd: "2026-09-30",
    trend: [{ period: "2026-09-01", received: 6 }],
  },
  purchaseOrderStatuses: [{ status: "in_progress", count: 6 }],
  bomRevisionStatuses: [{ status: "wait_rd", count: 5 }],
  topCustomers: [{ customerName: "Khách A", count: 3 }],
  overdueQueue: [
    {
      purchaseOrderId: "00000000-0000-4000-8000-000000000001",
      poCode: "PO-OVERDUE",
      customerName: "Khách A",
      deadline: "2026-09-28",
      productCount: 2,
    },
  ],
  upcomingQueue: [],
  pendingBomQueue: [
    {
      bomId: "00000000-0000-4000-8000-000000000002",
      bomCode: "BOM-1",
      productName: "Áo thun",
      bomType: "po" as const,
      status: "wait_rd" as const,
      createdAt: "2026-09-29T10:00:00.000Z",
    },
  ],
};

afterEach(cleanup);

describe("DashboardSummaryView", () => {
  it("compares PO receipts in the selected and previous periods with explicit date ranges", () => {
    render(
      <MemoryRouter>
        <DashboardSummaryView
          period={{ periodType: "month", month: "2026-09" }}
          onPeriodChange={vi.fn()}
          data={data}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("region", { name: "PO tiếp nhận" })).toBeTruthy();
    expect(screen.getByText("Kỳ đang chọn · 01/09/2026 – 30/09/2026")).toBeTruthy();
    expect(screen.getByText("Kỳ liền trước · 01/08/2026 – 31/08/2026")).toBeTruthy();
    const chart = screen.getByRole("img", { name: "Biểu đồ PO tiếp nhận theo ngày" });
    expect(chart.querySelectorAll("path")).toHaveLength(2);
    expect(chart.querySelector('path[stroke-dasharray="6 5"]')).toBeTruthy();
    expect(
      screen.getByText("2026-09-01: 10 PO tiếp nhận, 6 PO tiếp nhận kỳ liền trước"),
    ).toBeTruthy();
    expect(
      within(screen.getByRole("region", { name: "PO tiếp nhận" })).queryByText("PO hoàn thành"),
    ).toBeNull();
  });

  it("clips an in-progress period at its actual end date", () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardSummaryView
          period={{ periodType: "month", month: "2026-10" }}
          onPeriodChange={vi.fn()}
          data={{
            ...data,
            periodStart: "2026-10-01",
            periodEnd: "2026-10-31",
            trend: [
              { period: "2026-10-01", received: 2, completed: 1 },
              { period: "2026-10-02", received: 1, completed: 0 },
              { period: "2026-10-03", received: 0, completed: 0 },
            ],
            comparison: {
              periodStart: "2026-09-01",
              periodEnd: "2026-09-02",
              currentEnd: "2026-10-02",
              trend: [
                { period: "2026-10-01", received: 3 },
                { period: "2026-10-02", received: 2 },
                { period: "2026-10-03", received: null },
              ],
            },
          }}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Kỳ đang chọn · 01/10/2026 – 02/10/2026")).toBeTruthy();
    expect(screen.getByText("Kỳ liền trước · 01/09/2026 – 02/09/2026")).toBeTruthy();
    expect(container.querySelectorAll('[data-testid="trend-current-point"]')).toHaveLength(2);
  });

  it("shows only the yearly PO trend for all time without a comparison legend", () => {
    render(
      <MemoryRouter>
        <DashboardSummaryView
          period={{ periodType: "all" }}
          onPeriodChange={vi.fn()}
          data={{
            ...data,
            periodType: "all",
            periodStart: "2024-04-01",
            periodEnd: "2026-09-30",
            trendGranularity: "year",
            trend: [
              { period: "2024", received: 8, completed: 3 },
              { period: "2025", received: 11, completed: 6 },
              { period: "2026", received: 10, completed: 4 },
            ],
            comparison: null,
          }}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(
      within(screen.getByRole("region", { name: "PO tiếp nhận" })).getByText("Toàn thời gian"),
    ).toBeTruthy();
    expect(screen.queryByText(/Kỳ liền trước/)).toBeNull();
    const chart = screen.getByRole("img", { name: "Biểu đồ PO tiếp nhận theo năm" });
    expect(chart.querySelectorAll("path")).toHaveLength(1);
  });

  it("shows an empty state instead of an empty chart when the selected period has no buckets", () => {
    render(
      <MemoryRouter>
        <DashboardSummaryView
          period={{ periodType: "month", month: "2026-09" }}
          onPeriodChange={vi.fn()}
          data={{ ...data, trend: [], comparison: null }}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
        />
      </MemoryRouter>,
    );

    const chartPanel = screen.getByRole("region", { name: "PO tiếp nhận" });
    expect(within(chartPanel).getByText("Chưa có dữ liệu PO trong kỳ được chọn.")).toBeTruthy();
    expect(within(chartPanel).queryByRole("img")).toBeNull();
  });
  it("shows operational metrics and links queue items to their details", () => {
    render(
      <MemoryRouter>
        <DashboardSummaryView
          period={{ periodType: "month", month: "2026-09" }}
          onPeriodChange={vi.fn()}
          data={data}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getAllByText("PO có sản phẩm quá hạn")[0].parentElement?.textContent).toContain(
      "2",
    );
    expect(screen.getAllByText("PO sắp đến hạn")[0].parentElement?.textContent).toContain("3");
    expect(screen.getAllByText("BOM chờ xử lý")[0].parentElement?.textContent).toContain("5");
    expect(screen.queryByText("Tổng quan vận hành")).toBeNull();
    expect(screen.queryByText(/Theo dõi đơn hàng, hạn sản phẩm/)).toBeNull();
    expect(screen.queryByText(/PO lọc theo ngày tiếp nhận/)).toBeNull();
    expect(screen.queryByText(/nhóm PO tiếp nhận/)).toBeNull();
    expect(screen.queryByText(/revision tạo trong/)).toBeNull();
    expect(screen.getByRole("link", { name: "Mở đơn hàng PO-OVERDUE" }).getAttribute("href")).toBe(
      "/po/00000000-0000-4000-8000-000000000001",
    );
    expect(screen.getByRole("link", { name: "Mở BOM BOM-1" }).getAttribute("href")).toBe(
      "/bom/00000000-0000-4000-8000-000000000002",
    );
  });

  it("keeps month and day context on trend labels when the selected range crosses boundaries", () => {
    const { rerender } = render(
      <MemoryRouter>
        <DashboardSummaryView
          period={{ periodType: "range", fromDate: "2025-12-01", toDate: "2026-01-31" }}
          onPeriodChange={vi.fn()}
          data={{
            ...data,
            periodType: "range",
            periodStart: "2025-12-01",
            periodEnd: "2026-01-31",
            trendGranularity: "month",
            trend: [
              { period: "2025-12", received: 2, completed: 1 },
              { period: "2026-01", received: 3, completed: 2 },
            ],
          }}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("12/2025")).toBeTruthy();
    expect(screen.getByText("01/2026")).toBeTruthy();

    rerender(
      <MemoryRouter>
        <DashboardSummaryView
          period={{ periodType: "range", fromDate: "2026-08-28", toDate: "2026-09-03" }}
          onPeriodChange={vi.fn()}
          data={{
            ...data,
            periodType: "range",
            periodStart: "2026-08-28",
            periodEnd: "2026-09-03",
            trendGranularity: "day",
            trend: [
              { period: "2026-08-28", received: 2, completed: 1 },
              { period: "2026-09-03", received: 3, completed: 2 },
            ],
          }}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("28/08")).toBeTruthy();
    expect(screen.getByText("03/09")).toBeTruthy();
  });

  it("lets the user switch to a selected calendar year", () => {
    const onPeriodChange = vi.fn();
    render(
      <MemoryRouter>
        <DashboardSummaryView
          period={{ periodType: "month", month: "2026-09" }}
          onPeriodChange={onPeriodChange}
          data={data}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
        />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Kỳ thống kê" }), {
      target: { value: "year" },
    });
    expect(onPeriodChange).toHaveBeenCalledWith({ periodType: "year", year: "2026" });
  });

  it.each([
    { label: "Tháng", period: { periodType: "month" as const, month: "2026-09" } },
    { label: "Năm", period: { periodType: "year" as const, year: "2026" } },
    {
      label: "Khoảng ngày",
      period: { periodType: "range" as const, fromDate: "2026-09-01", toDate: "2026-09-30" },
    },
    { label: "Toàn thời gian", period: { periodType: "all" as const } },
  ])("keeps all period choices visible when $label is selected", ({ label, period }) => {
    render(
      <MemoryRouter>
        <DashboardSummaryView
          period={period}
          onPeriodChange={vi.fn()}
          data={data}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
        />
      </MemoryRouter>,
    );

    const periodSelect = screen.getByRole("combobox", {
      name: "Kỳ thống kê",
    }) as HTMLSelectElement;
    const periodOptions = Array.from(periodSelect.querySelectorAll("option")).map(
      (option) => option.value,
    );
    expect(periodOptions).toEqual(["month", "year", "range", "all"]);
    expect(periodSelect.value).toBe(period.periodType);
    expect(periodSelect.selectedOptions[0].textContent).toBe(label);
  });

  it("switches to the all-time period and explains its date scope", () => {
    const onPeriodChange = vi.fn();
    const { rerender } = render(
      <MemoryRouter>
        <DashboardSummaryView
          period={{ periodType: "year", year: "2026" }}
          onPeriodChange={onPeriodChange}
          data={data}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
        />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Kỳ thống kê" }), {
      target: { value: "all" },
    });
    expect(onPeriodChange).toHaveBeenCalledWith({ periodType: "all" });

    rerender(
      <MemoryRouter>
        <DashboardSummaryView
          period={{ periodType: "all" }}
          onPeriodChange={onPeriodChange}
          data={data}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("Từ dữ liệu cũ nhất đến mới nhất")).toBeTruthy();
  });

  it("keeps KPI and dashboard panel placeholders visible while loading", () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardSummaryView
          period={{ periodType: "month", month: "2026-09" }}
          onPeriodChange={vi.fn()}
          isLoading
          isError={false}
          onRetry={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("status", { name: "Đang tải số liệu dashboard" })).toBeTruthy();
    expect(container.querySelectorAll('[data-testid="dashboard-kpi-skeleton"]')).toHaveLength(7);
    expect(container.querySelectorAll('[data-testid="dashboard-panel-skeleton"]')).toHaveLength(7);
    expect(screen.getByRole("combobox", { name: "Kỳ thống kê" })).toBeTruthy();
  });

  it("matches management loading placeholders to the eight management KPIs", () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardSummaryView
          period={{ periodType: "month", month: "2026-09" }}
          onPeriodChange={vi.fn()}
          isLoading
          isError={false}
          onRetry={vi.fn()}
          managementView
        />
      </MemoryRouter>,
    );

    expect(container.querySelectorAll('[data-testid="dashboard-kpi-skeleton"]')).toHaveLength(8);
  });

  it("lets the user choose a year from a dropdown", () => {
    const onPeriodChange = vi.fn();
    render(
      <MemoryRouter>
        <DashboardSummaryView
          period={{ periodType: "year", year: "2026" }}
          onPeriodChange={onPeriodChange}
          data={data}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
        />
      </MemoryRouter>,
    );

    const yearSelect = screen.getByRole("combobox", { name: "Năm tiếp nhận PO" });
    const anotherYear = Array.from(yearSelect.querySelectorAll("option"))
      .map((option) => option.value)
      .find((year) => year !== "2026");

    expect(anotherYear).toBeDefined();
    fireEvent.change(yearSelect, { target: { value: anotherYear } });
    expect(onPeriodChange).toHaveBeenCalledWith({ periodType: "year", year: anotherYear });
  });

  it("lets the user choose an inclusive start and end date", () => {
    const onPeriodChange = vi.fn();
    render(
      <MemoryRouter>
        <DashboardSummaryView
          period={{ periodType: "range", fromDate: "2026-09-01", toDate: "2026-09-30" }}
          onPeriodChange={onPeriodChange}
          data={data}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
        />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Từ ngày"), { target: { value: "2026-09-05" } });
    expect(onPeriodChange).toHaveBeenCalledWith({
      periodType: "range",
      fromDate: "2026-09-05",
      toDate: "2026-09-30",
    });
  });

  it("explains that a month is required when the month filter is cleared", () => {
    render(
      <MemoryRouter>
        <DashboardSummaryView
          period={{ periodType: "month", month: "" }}
          onPeriodChange={vi.fn()}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("alert").textContent).toBe("Chọn tháng tiếp nhận PO.");
    expect(screen.getByLabelText("Tháng tiếp nhận PO").getAttribute("aria-invalid")).toBe("true");
    expect(screen.queryByText("Xu hướng PO theo ngày")).toBeNull();
  });

  it("explains which endpoint is missing in an incomplete date range", () => {
    const { rerender } = render(
      <MemoryRouter>
        <DashboardSummaryView
          period={{ periodType: "range", fromDate: "", toDate: "2026-09-30" }}
          onPeriodChange={vi.fn()}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("alert").textContent).toBe("Chọn ngày bắt đầu.");
    expect(screen.queryByText(/undefined/)).toBeNull();

    rerender(
      <MemoryRouter>
        <DashboardSummaryView
          period={{ periodType: "range", fromDate: "2026-09-01", toDate: "" }}
          onPeriodChange={vi.fn()}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("alert").textContent).toBe("Chọn ngày kết thúc.");
    expect(screen.queryByText(/undefined/)).toBeNull();
  });
});
