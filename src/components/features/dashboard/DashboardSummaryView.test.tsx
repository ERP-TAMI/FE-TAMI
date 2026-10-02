import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
    expect(screen.getByRole("link", { name: "Mở đơn hàng PO-OVERDUE" }).getAttribute("href")).toBe(
      "/po/00000000-0000-4000-8000-000000000001",
    );
    expect(screen.getByRole("link", { name: "Mở BOM BOM-1" }).getAttribute("href")).toBe(
      "/bom/00000000-0000-4000-8000-000000000002",
    );
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

    fireEvent.change(screen.getByLabelText("Kỳ thống kê"), {
      target: { value: "year" },
    });
    expect(onPeriodChange).toHaveBeenCalledWith({ periodType: "year", year: "2026" });
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
    expect(screen.getByText(/Chưa chọn tháng/)).toBeTruthy();
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
