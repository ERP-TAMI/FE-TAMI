import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BomPage from "./BomPage";
import * as useNplListModule from "@/hooks/useNplList";
import { useAuthStore } from "@/store/authStore";
import type { NplListItem } from "@/types/npl";

vi.mock("@/hooks/useNplList", () => ({
  useNplList: vi.fn(),
  nplKeys: {
    all: ["npl"],
    lists: () => ["npl", "list"],
  },
}));

const mockNplData: NplListItem[] = [
  {
    id: "npl-1",
    objectType: "fit",
    objectCode: "FIT-001",
    styleCode: "STY-101",
    productName: "Áo Polo Nam Fit",
    colorName: "Navy",
    status: "Draft",
    version: 1,
    totalCostPerUnit: 150000,
    createdAt: "2026-09-01T00:00:00.000Z",
    poId: "",
  },
  {
    id: "npl-2",
    objectType: "po",
    objectCode: "PO-2026-001",
    styleCode: "STY-202",
    productName: "Quần Jeans Nữ PO",
    colorName: "Đen",
    status: "Approved",
    version: 2,
    totalCostPerUnit: 280000,
    createdAt: "2026-09-02T00:00:00.000Z",
    poId: "po-uuid-123",
  },
];

describe("BomPage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();

    vi.mocked(useNplListModule.useNplList).mockReturnValue({
      data: mockNplData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useNplListModule.useNplList>);
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <BomPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

  it("renders page title 'Quản lý Nguyên phụ liệu' and breadcrumbs", () => {
    useAuthStore.setState({
      user: {
        id: "u1",
        email: "tpkh@tami.vn",
        fullName: "TP Kế Hoạch",
        roleCode: "TPKH",
        roleName: "TP Kế Hoạch",
        permissions: [],
      },
    });

    renderComponent();

    expect(screen.getByRole("heading", { name: "Quản lý Nguyên phụ liệu" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tất cả" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mẫu Fit" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sản phẩm PO" })).toBeTruthy();
  });

  it("renders both Mẫu Fit and Sản phẩm PO items in the list", () => {
    useAuthStore.setState({
      user: {
        id: "u1",
        email: "tpkh@tami.vn",
        fullName: "TP Kế Hoạch",
        roleCode: "TPKH",
        roleName: "TP Kế Hoạch",
        permissions: [],
      },
    });

    renderComponent();

    expect(screen.getByText("FIT-001")).toBeTruthy();
    expect(screen.getByText("PO-2026-001")).toBeTruthy();
    expect(screen.getByText("Áo Polo Nam Fit")).toBeTruthy();
    expect(screen.getByText("Quần Jeans Nữ PO")).toBeTruthy();
  });

  it("HIDES cost column when user is NVKH or RD", () => {
    useAuthStore.setState({
      user: {
        id: "u2",
        email: "nvkh@tami.vn",
        fullName: "NV Kế Hoạch",
        roleCode: "NVKH",
        roleName: "NV Kế Hoạch",
        permissions: [],
      },
    });

    renderComponent();

    expect(screen.queryByText("Giá thành/SP")).toBeNull();
    expect(screen.queryByText("150.000 ₫")).toBeNull();
    expect(screen.queryByText("280.000 ₫")).toBeNull();
  });

  it("HIDES cost column when user is RD", () => {
    useAuthStore.setState({
      user: {
        id: "u3",
        email: "rd@tami.vn",
        fullName: "R&D Staff",
        roleCode: "RD",
        roleName: "R&D",
        permissions: [],
      },
    });

    renderComponent();

    expect(screen.queryByText("Giá thành/SP")).toBeNull();
  });

  it("SHOWS cost column when user is TPKH, KT, or SA", () => {
    useAuthStore.setState({
      user: {
        id: "u1",
        email: "tpkh@tami.vn",
        fullName: "Trưởng phòng Kế hoạch",
        roleCode: "TPKH",
        roleName: "Trưởng phòng",
        permissions: [],
      },
    });

    renderComponent();

    expect(screen.getByText("Giá thành/SP")).toBeTruthy();
    expect(screen.getByText("150.000 ₫")).toBeTruthy();
    expect(screen.getByText("280.000 ₫")).toBeTruthy();
  });

  it("filters list by object type (Mẫu Fit vs Sản phẩm PO)", () => {
    useAuthStore.setState({
      user: {
        id: "u1",
        email: "sa@tami.vn",
        fullName: "Giám Đốc",
        roleCode: "SA",
        roleName: "Super Admin",
        permissions: [],
      },
    });

    renderComponent();

    // Click "Mẫu Fit" button
    const fitButton = screen.getByRole("button", { name: "Mẫu Fit" });
    fireEvent.click(fitButton);

    expect(screen.getByText("FIT-001")).toBeTruthy();
    expect(screen.queryByText("PO-2026-001")).toBeNull();

    // Click "Sản phẩm PO" button
    const poButton = screen.getByRole("button", { name: "Sản phẩm PO" });
    fireEvent.click(poButton);

    expect(screen.queryByText("FIT-001")).toBeNull();
    expect(screen.getByText("PO-2026-001")).toBeTruthy();
  });

  it("filters list by search term and resets with 'Xóa lọc'", () => {
    useAuthStore.setState({
      user: {
        id: "u1",
        email: "kt@tami.vn",
        fullName: "Kế Toán",
        roleCode: "KT",
        roleName: "Kế Toán",
        permissions: [],
      },
    });

    renderComponent();

    const searchInput = screen.getByPlaceholderText("Mã Fit / Style / Sản phẩm...");
    fireEvent.change(searchInput, { target: { value: "Polo" } });

    expect(screen.getByText("Áo Polo Nam Fit")).toBeTruthy();
    expect(screen.queryByText("Quần Jeans Nữ PO")).toBeNull();

    const clearButton = screen.getByRole("button", { name: "Xóa lọc" });
    fireEvent.click(clearButton);

    expect(screen.getByText("Áo Polo Nam Fit")).toBeTruthy();
    expect(screen.getByText("Quần Jeans Nữ PO")).toBeTruthy();
  });
});
