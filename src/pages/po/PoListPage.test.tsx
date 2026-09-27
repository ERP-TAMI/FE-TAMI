import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PoListPage from "./PoListPage";
import * as usePurchaseOrdersModule from "@/hooks/usePurchaseOrders";

vi.mock("@/hooks/usePurchaseOrders", () => ({
  usePurchaseOrders: vi.fn(),
  useCreatePurchaseOrder: vi.fn(),
  useDeletePurchaseOrder: vi.fn(),
}));

describe("PoListPage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();

    vi.mocked(usePurchaseOrdersModule.useCreatePurchaseOrder).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof usePurchaseOrdersModule.useCreatePurchaseOrder>);

    vi.mocked(usePurchaseOrdersModule.useDeletePurchaseOrder).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof usePurchaseOrdersModule.useDeletePurchaseOrder>);
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PoListPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

  it("renders PO list title and create button", () => {
    vi.mocked(usePurchaseOrdersModule.usePurchaseOrders).mockReturnValue({
      data: { items: [], total: 0, page: 1, limit: 10, totalPages: 1 },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePurchaseOrdersModule.usePurchaseOrders>);

    renderComponent();

    expect(screen.getByRole("heading", { name: "Quản lý Purchase Orders" })).toBeTruthy();
    expect(screen.getAllByText("+ Tạo PO mới")[0]).toBeTruthy();
  });

  it("renders PO items when data is returned", () => {
    const mockItems = [
      {
        id: "po-1",
        poCode: "PO-2026-001",
        customerPoCode: "CUST-99",
        customerId: "cust-1",
        customerNameSnapshot: "Khách hàng Tấn Minh",
        receivedDate: "2026-09-07",
        note: null,
        status: "draft" as const,
        createdAt: "2026-09-07T00:00:00Z",
        updatedAt: "2026-09-07T00:00:00Z",
      },
    ];

    vi.mocked(usePurchaseOrdersModule.usePurchaseOrders).mockReturnValue({
      data: { items: mockItems, total: 1, page: 1, limit: 10, totalPages: 1 },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePurchaseOrdersModule.usePurchaseOrders>);

    renderComponent();

    expect(screen.getByText("PO-2026-001")).toBeTruthy();
    expect(screen.getByText("Khách hàng Tấn Minh")).toBeTruthy();
    expect(screen.getAllByText("Nháp").length).toBeGreaterThan(0);
  });

  it("opens create modal when clicking create PO button", () => {
    vi.mocked(usePurchaseOrdersModule.usePurchaseOrders).mockReturnValue({
      data: { items: [], total: 0, page: 1, limit: 10, totalPages: 1 },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePurchaseOrdersModule.usePurchaseOrders>);

    renderComponent();

    const createBtn = screen.getAllByText("+ Tạo PO mới")[0];
    fireEvent.click(createBtn);

    expect(screen.getByText("Tạo đơn hàng PO mới")).toBeTruthy();
  });
});

