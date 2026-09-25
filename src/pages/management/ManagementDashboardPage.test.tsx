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
  month: "2026-09",
  totalPurchaseOrders: 12,
  completedPurchaseOrders: 5,
  overduePurchaseOrders: 3,
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
    vi.useRealTimers();
  });

  it("shows the four approved metrics", () => {
    render(<ManagementDashboardPage />);

    expect(screen.getByText("Tổng số PO").nextElementSibling?.textContent).toBe("12");
    expect(screen.getByText("PO đã hoàn thành").nextElementSibling?.textContent).toBe("5");
    expect(screen.getByText("PO trễ hạn").nextElementSibling?.textContent).toBe("3");
    expect(screen.getByText("Nhân viên đang hoạt động").nextElementSibling?.textContent).toBe("24");
    expect(hooks.useManagementDashboardSummary).toHaveBeenCalledWith("2026-09");
  });

  it("loads PO metrics again when the selected month changes", () => {
    render(<ManagementDashboardPage />);

    fireEvent.change(screen.getByLabelText("Tháng báo cáo"), {
      target: { value: "2026-08" },
    });

    expect(hooks.useManagementDashboardSummary).toHaveBeenLastCalledWith("2026-08");
  });

  it("prevents selecting the unsupported year zero", () => {
    render(<ManagementDashboardPage />);

    expect(screen.getByLabelText("Tháng báo cáo").getAttribute("min")).toBe("0001-01");
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

  it("keeps all four cards visible when every metric is zero", () => {
    hooks.useManagementDashboardSummary.mockReturnValue({
      data: {
        ...summary,
        totalPurchaseOrders: 0,
        completedPurchaseOrders: 0,
        overduePurchaseOrders: 0,
        activeEmployees: 0,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<ManagementDashboardPage />);

    expect(screen.getAllByText("0")).toHaveLength(4);
  });
});
