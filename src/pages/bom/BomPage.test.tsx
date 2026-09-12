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
    list: (filter?: unknown) => ["npl", "list", filter],
  },
}));

// Create 15 items to properly test pagination (10 on page 1, 5 on page 2)
const mockNplData: NplListItem[] = Array.from({ length: 15 }, (_, i) => {
  const index = i + 1;
  const isFit = index % 2 !== 0;
  return {
    id: `npl-${index}`,
    objectType: isFit ? "fit" : "po",
    objectCode: isFit ? `FIT-2026-00${index}` : `PO-2026-00${index}`,
    styleCode: `STY-${100 + index}`,
    productName: isFit ? `Mẫu Fit Áo Polo ${index}` : `Sản phẩm Quần Jeans ${index}`,
    colorName: index % 3 === 0 ? "Navy" : index % 3 === 1 ? "Đen" : "Trắng",
    status: index % 4 === 0 ? "Draft" : index % 4 === 1 ? "Wait_RD" : "Approved",
    version: 1,
    totalCostPerUnit: isFit ? null : 150000 + index * 10000,
    createdAt: new Date(2026, 8, index).toISOString(),
    poId: isFit ? "" : `po-uuid-${index}`,
  };
});

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

  it("renders both Mẫu Fit and Sản phẩm PO items in the first page", () => {
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

    expect(screen.getByText("FIT-2026-001")).toBeTruthy();
    expect(screen.getByText("PO-2026-002")).toBeTruthy();
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
    expect(screen.queryByText("170.000 ₫")).toBeNull();
  });

  it("SHOWS cost column when user is TPKH, SA, or ACCOUNTING", () => {
    useAuthStore.setState({
      user: {
        id: "u3",
        email: "ketoan@tami.vn",
        fullName: "Kế Toán Viên",
        roleCode: "ACCOUNTING",
        roleName: "Kế toán",
        permissions: [],
      },
    });

    renderComponent();

    expect(screen.getByText("Giá thành/SP")).toBeTruthy();
  });

  it("displays '—' when totalCostPerUnit is null (e.g. Fit BOM) and NEVER '0 ₫'", () => {
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

    // Fit BOM has null cost, so it must render "—"
    const dashCells = screen.getAllByText("—");
    expect(dashCells.length).toBeGreaterThan(0);
    // Must not render "0 ₫" anywhere
    expect(screen.queryByText("0 ₫")).toBeNull();
  });

  // ─── PAGINATION TESTS ──────────────────────────────────────────────────────

  describe("Pagination", () => {
    beforeEach(() => {
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
    });

    it("renders pagination summary with total count on page 1", () => {
      renderComponent();

      expect(screen.getByText("Hiển thị 1–10 trên 15 bảng NPL")).toBeTruthy();
      // Items 1-10 are visible
      expect(screen.getByText("FIT-2026-001")).toBeTruthy();
      // Item 11 is on page 2, so it should not be on page 1
      expect(screen.queryByText("FIT-2026-0011")).toBeNull();
    });

    it("navigates to page 2 when clicking 'Trang sau' and displays items 11-15", () => {
      renderComponent();

      const nextButton = screen.getByRole("button", { name: "Trang sau" });
      expect(nextButton).toBeTruthy();
      fireEvent.click(nextButton);

      expect(screen.getByText("Hiển thị 11–15 trên 15 bảng NPL")).toBeTruthy();
      expect(screen.getByText("FIT-2026-0011")).toBeTruthy();
      expect(screen.queryByText("FIT-2026-001")).toBeNull();
    });

    it("navigates back to page 1 when clicking 'Trang trước'", () => {
      renderComponent();

      const nextButton = screen.getByRole("button", { name: "Trang sau" });
      fireEvent.click(nextButton);
      expect(screen.getByText("Hiển thị 11–15 trên 15 bảng NPL")).toBeTruthy();

      const prevButton = screen.getByRole("button", { name: "Trang trước" });
      fireEvent.click(prevButton);
      expect(screen.getByText("Hiển thị 1–10 trên 15 bảng NPL")).toBeTruthy();
      expect(screen.getByText("FIT-2026-001")).toBeTruthy();
    });

    it("navigates directly to page 2 when clicking page number button '2'", () => {
      renderComponent();

      const page2Button = screen.getByRole("button", { name: "Trang 2" });
      fireEvent.click(page2Button);

      expect(screen.getByText("Hiển thị 11–15 trên 15 bảng NPL")).toBeTruthy();
      expect(screen.getByText("FIT-2026-0011")).toBeTruthy();
    });

    it("changes page size to 5 per page and updates pagination", () => {
      renderComponent();

      const select = screen.getByLabelText("Số lượng mỗi trang");
      fireEvent.change(select, { target: { value: "5" } });

      expect(screen.getByText("Hiển thị 1–5 trên 15 bảng NPL")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Trang 3" })).toBeTruthy();
    });

    it("resets page to 1 when changing object type filter from page 2", () => {
      renderComponent();

      // Go to page 2
      const nextButton = screen.getByRole("button", { name: "Trang sau" });
      fireEvent.click(nextButton);
      expect(screen.getByText("Hiển thị 11–15 trên 15 bảng NPL")).toBeTruthy();

      // Click "Mẫu Fit"
      const fitButton = screen.getByRole("button", { name: "Mẫu Fit" });
      fireEvent.click(fitButton);

      // Total Fit items = 8, so page 1 displays 1-8
      expect(screen.getByText("Hiển thị 1–8 trên 8 bảng NPL")).toBeTruthy();
    });

    it("resets page to 1 when searching while on page 2", () => {
      renderComponent();

      // Go to page 2
      const nextButton = screen.getByRole("button", { name: "Trang sau" });
      fireEvent.click(nextButton);
      expect(screen.getByText("Hiển thị 11–15 trên 15 bảng NPL")).toBeTruthy();

      // Type search
      const searchInput = screen.getByPlaceholderText("Mã Fit / Style / Sản phẩm...");
      fireEvent.change(searchInput, { target: { value: "Polo" } });

      // Should reset to page 1
      expect(screen.getByText("Hiển thị 1–8 trên 8 bảng NPL")).toBeTruthy();
    });
  });
});
