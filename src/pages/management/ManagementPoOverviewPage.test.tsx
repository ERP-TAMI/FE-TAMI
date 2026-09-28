import { cleanup, render, screen, within } from "@testing-library/react";
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
    render(<ManagementPoOverviewPage />);

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
    render(<ManagementPoOverviewPage />);

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

    render(<ManagementPoOverviewPage />);

    const table = screen.getByRole("table");
    const row = within(table).getByRole("row", { name: /PO-PARENT-RESPONSE/ });
    expect(within(row).getByText("Trễ hạn")).toBeTruthy();
    expect(within(row).getByText("Trễ 2 ngày")).toBeTruthy();
  });
});
