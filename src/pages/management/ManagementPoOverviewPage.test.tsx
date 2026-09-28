import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ManagementPoOverviewPage from "./ManagementPoOverviewPage";

const hooks = vi.hoisted(() => ({
  useManagementPurchaseOrdersOverview: vi.fn(),
}));

vi.mock("@/hooks/useManagementDashboard", () => ({
  useManagementPurchaseOrdersOverview: hooks.useManagementPurchaseOrdersOverview,
}));

const overview = {
  month: "2026-09",
  totalPurchaseOrders: 4,
  overduePurchaseOrders: 1,
  upcomingPurchaseOrders: 1,
  items: [
    {
      id: "po-overdue",
      poCode: "PO-OVERDUE",
      customerNameSnapshot: "Khách hàng Quá hạn",
      receivedDate: "2026-09-01",
      deadline: "2026-09-25",
      status: "in_progress",
      managementStatus: "overdue",
      daysToDeadline: -2,
    },
    {
      id: "po-completed",
      poCode: "PO-COMPLETED",
      customerNameSnapshot: "Khách hàng Hoàn thành",
      receivedDate: "2026-09-02",
      deadline: "2026-09-20",
      status: "closed",
      managementStatus: "completed",
      daysToDeadline: -7,
    },
    {
      id: "po-cancelled",
      poCode: "PO-CANCELLED",
      customerNameSnapshot: "Khách hàng Đã hủy",
      receivedDate: "2026-09-03",
      deadline: "2026-09-18",
      status: "cancelled",
      managementStatus: "cancelled",
      daysToDeadline: -9,
    },
    {
      id: "po-not-completed",
      poCode: "PO-NOT-COMPLETED",
      customerNameSnapshot: "Khách hàng Chưa xong",
      receivedDate: "2026-09-04",
      deadline: "2026-10-03",
      status: "draft",
      managementStatus: "not_completed",
      daysToDeadline: 6,
    },
  ],
  meta: { total: 4, page: 1, limit: 10, totalPages: 1 },
};

function renderPage(initialEntry = "/management/purchase-orders") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ManagementPoOverviewPage />
    </MemoryRouter>,
  );
}

describe("ManagementPoOverviewPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-27T09:00:00+07:00"));
    hooks.useManagementPurchaseOrdersOverview.mockReturnValue({
      data: overview,
      isLoading: false,
      isFetching: false,
      isPlaceholderData: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("shows the six requested columns and no assignee", () => {
    renderPage();

    const table = screen.getByRole("table");
    for (const heading of [
      "Mã PO",
      "Khách hàng",
      "Ngày nhận",
      "Deadline xuất hàng",
      "Còn/trễ",
      "Trạng thái",
    ]) {
      expect(within(table).getByRole("columnheader", { name: heading })).toBeTruthy();
    }
    expect(screen.queryByText(/Người phụ trách/i)).toBeNull();
  });

  it("shows the grouped management status and deadline text for each PO", () => {
    renderPage();

    const table = screen.getByRole("table");
    const cases = [
      ["PO-OVERDUE", "Trễ hạn", "Trễ 2 ngày"],
      ["PO-COMPLETED", "Hoàn thành", "—"],
      ["PO-CANCELLED", "Đã hủy", "—"],
      ["PO-NOT-COMPLETED", "Chưa xong", "Còn 6 ngày"],
    ];
    for (const [poCode, status, deadlineText] of cases) {
      const row = within(table).getByRole("row", { name: new RegExp(poCode) });
      expect(within(row).getByText(status)).toBeTruthy();
      expect(within(row).getByText(deadlineText)).toBeTruthy();
    }
  });

  it("opens each PO from desktop and mobile with the current month and page context", () => {
    renderPage("/management/purchase-orders?month=2026-10&page=3");

    expect(hooks.useManagementPurchaseOrdersOverview).toHaveBeenLastCalledWith("2026-10", 3, 10);
    const links = screen.getAllByRole("link", { name: "PO-OVERDUE" });
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link.getAttribute("href")).toBe(
        "/management/purchase-orders/po-overdue?fromMonth=2026-10&fromPage=3",
      );
    }
  });

  it("renders parent-version PO rows without the additive backend fields", () => {
    hooks.useManagementPurchaseOrdersOverview.mockReturnValue({
      data: {
        ...overview,
        items: [
          {
            id: "po-parent-response",
            poCode: "PO-PARENT-RESPONSE",
            customerNameSnapshot: "Khách hàng từ API cha",
            receivedDate: "2026-09-01",
            deadline: "2026-09-25",
            status: "in_progress",
          },
        ],
      },
      isLoading: false,
      isFetching: false,
      isPlaceholderData: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderPage();

    const table = screen.getByRole("table");
    const row = within(table).getByRole("row", { name: /PO-PARENT-RESPONSE/ });
    expect(within(row).getByText("Trễ hạn")).toBeTruthy();
    expect(within(row).getByText("Trễ 2 ngày")).toBeTruthy();
  });

  it("resets to page one when the selected month changes from another page", () => {
    hooks.useManagementPurchaseOrdersOverview.mockImplementation((month: string, page: number) => ({
      data: {
        ...overview,
        totalPurchaseOrders: 21,
        meta: { total: 21, page, limit: 10, totalPages: 3 },
        month,
      },
      isLoading: false,
      isFetching: false,
      isPlaceholderData: false,
      isError: false,
      refetch: vi.fn(),
    }));
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Trang sau" }));
    expect(hooks.useManagementPurchaseOrdersOverview).toHaveBeenLastCalledWith("2026-09", 2, 10);

    fireEvent.change(screen.getByLabelText("Tháng xem báo cáo"), {
      target: { value: "2026-10" },
    });

    expect(hooks.useManagementPurchaseOrdersOverview).toHaveBeenLastCalledWith("2026-10", 1, 10);
  });

  it("does not show the previous month's data while the new month is loading", () => {
    hooks.useManagementPurchaseOrdersOverview.mockImplementation((month: string) =>
      month === "2026-09"
        ? {
            data: overview,
            isLoading: false,
            isFetching: false,
            isPlaceholderData: false,
            isError: false,
            refetch: vi.fn(),
          }
        : {
            data: undefined,
            isLoading: true,
            isFetching: true,
            isPlaceholderData: false,
            isError: false,
            refetch: vi.fn(),
          },
    );
    renderPage();

    fireEvent.change(screen.getByLabelText("Tháng xem báo cáo"), {
      target: { value: "2026-10" },
    });

    expect(screen.getByRole("status", { name: /tháng 10\/2026/i })).toBeTruthy();
    expect(screen.queryByText("PO-OVERDUE")).toBeNull();
    expect(screen.queryByText("4", { selector: "p" })).toBeNull();
  });

  it("loads the selected page from the pagination controls", () => {
    hooks.useManagementPurchaseOrdersOverview.mockImplementation((month: string, page: number) => ({
      data: {
        ...overview,
        totalPurchaseOrders: 21,
        meta: { total: 21, page, limit: 10, totalPages: 3 },
        month,
      },
      isLoading: false,
      isFetching: false,
      isPlaceholderData: false,
      isError: false,
      refetch: vi.fn(),
    }));
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Trang sau" }));

    expect(hooks.useManagementPurchaseOrdersOverview).toHaveBeenLastCalledWith("2026-09", 2, 10);
    expect(screen.getByText("Trang 2/3")).toBeTruthy();
  });

  it("shows an API error with a retry action", () => {
    const refetch = vi.fn();
    hooks.useManagementPurchaseOrdersOverview.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isPlaceholderData: false,
      isError: true,
      refetch,
    });
    renderPage();

    expect(screen.getByRole("alert").textContent).toContain("Không tải được tổng quan PO");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("shows a clear empty state when the selected month has no POs", () => {
    hooks.useManagementPurchaseOrdersOverview.mockReturnValue({
      data: {
        ...overview,
        totalPurchaseOrders: 0,
        overduePurchaseOrders: 0,
        upcomingPurchaseOrders: 0,
        items: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
      },
      isLoading: false,
      isFetching: false,
      isPlaceholderData: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderPage();

    expect(screen.getByText("Không có PO giao trong tháng 09/2026")).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "Phân trang PO" })).toBeNull();
  });

  it("ignores a non-empty month value that does not match the month schema", () => {
    renderPage();
    const monthInput = screen.getByLabelText("Tháng xem báo cáo");
    let inputValue = "2026-99";
    Object.defineProperty(monthInput, "value", {
      configurable: true,
      get: () => inputValue,
      set: (value: string) => {
        inputValue = value;
      },
    });

    fireEvent.change(monthInput);

    expect(inputValue).toBe("2026-09");
    expect(hooks.useManagementPurchaseOrdersOverview).toHaveBeenLastCalledWith("2026-09", 1, 10);
  });
});
