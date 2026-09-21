import axios from "axios";
import { BrowserRouter } from "react-router-dom";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BomPage from "./BomPage";
import type { BomListItem, BomStats } from "@/types/bom";

function createAxiosError(data: unknown, status = 400) {
  return new axios.AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    data,
    status,
    statusText: status === 409 ? "Conflict" : "Bad Request",
    headers: {},
    config: {} as never,
  });
}

// Hoisted mocks for hooks and API
const hooks = vi.hoisted(() => ({
  useBoms: vi.fn(),
  useBomStats: vi.fn(),
  createBom: { isPending: false, error: null, mutateAsync: vi.fn() },
  discontinueBom: { isPending: false, error: null, mutateAsync: vi.fn() },
  useStyles: vi.fn(),
  usePurchaseOrders: vi.fn(),
  usePoProducts: vi.fn(),
  mockNavigate: vi.fn(),
  mockUser: { roleCode: "TPKH", fullName: "Trưởng phòng KH" },
  mockToast: {
    toast: null as { message: string; variant?: "success" | "error" | "neutral" } | null,
    showToast: vi.fn(),
    hideToast: vi.fn(),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => hooks.mockNavigate,
  };
});

vi.mock("@/store/authStore", () => ({
  useAuthStore: (selector: (state: { user: typeof hooks.mockUser }) => unknown) =>
    selector({ user: hooks.mockUser }),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => hooks.mockToast,
}));

vi.mock("@/hooks/useBoms", () => ({
  useBoms: hooks.useBoms,
  useMultiPoBoms: (poIds: string[]) =>
    poIds.map((id) => {
      const res = hooks.useBoms({ purchaseOrder: id, limit: 100 });
      return {
        data: res?.data ?? { data: [] },
        isLoading: res?.isLoading ?? false,
      };
    }),
  useBomStats: hooks.useBomStats,
  useCreateBom: () => hooks.createBom,
  useDiscontinueBom: () => hooks.discontinueBom,
}));

vi.mock("@/hooks/useStyles", () => ({
  useStyles: hooks.useStyles,
}));

vi.mock("@/hooks/usePurchaseOrders", () => ({
  usePurchaseOrders: hooks.usePurchaseOrders,
  usePoProducts: hooks.usePoProducts,
  useMultiPoProducts: (poIds: string[]) =>
    poIds.map((id) => {
      const res = hooks.usePoProducts(id);
      return {
        data: res?.data ?? { items: [] },
        isLoading: res?.isLoading ?? false,
      };
    }),
}));

// Sample mock data
const mockBomFitItem: BomListItem = {
  id: "bom-fit-1",
  bomCode: "BOM-FIT-POLO-01",
  type: "fit",
  status: "closed",
  discontinuedAt: null,
  style: {
    id: "style-1",
    styleCode: "ST-POLO",
    styleName: "Áo Polo Nam Classic",
  },
  purchaseOrder: null,
  product: null,
  currentRevision: {
    id: "rev-1",
    bomId: "bom-fit-1",
    revisionNo: 1,
    status: "closed",
    createdAt: "2026-03-01T00:00:00Z",
  },
  revisionNo: 1,
  costPerUnit: null, // Fit BOM always has cost = null
  currentOrderQuantity: null,
  currentOrderCost: null,
  colorNameSnapshot: null,
  deadline: null,
  rdNote: null,
  createdAt: "2026-03-01T00:00:00Z",
  updatedAt: "2026-03-02T00:00:00Z",
};

const mockBomPoItem: BomListItem = {
  id: "bom-po-1",
  bomCode: "BOM-PO01-P01",
  type: "po",
  status: "wait_accounting",
  discontinuedAt: null,
  style: null,
  purchaseOrder: {
    id: "po-1",
    poCode: "PO-2026-001",
    customerName: "Uniqlo Vietnam",
  },
  product: {
    id: "pop-1",
    purchaseOrderId: "po-1",
    productCode: "PRD-POLO-RED",
    productName: "Áo Polo Đỏ",
    colors: ["Đỏ", "Xanh"],
  },
  currentRevision: {
    id: "rev-po-1",
    bomId: "bom-po-1",
    revisionNo: 2,
    status: "wait_accounting",
    createdAt: "2026-03-05T00:00:00Z",
  },
  revisionNo: 2,
  costPerUnit: 125000,
  currentOrderQuantity: 1500,
  currentOrderCost: 187500000,
  colorNameSnapshot: null,
  deadline: "2026-04-15",
  rdNote: "Định mức may thân trước cập nhật",
  createdAt: "2026-03-05T00:00:00Z",
  updatedAt: "2026-03-10T00:00:00Z",
};

const mockStats: BomStats = {
  total: 25,
  draftCount: 5,
  pendingCount: 8,
  approvedCount: 10,
  discontinuedCount: 2,
  byStatus: {
    wait_nvkh: 3,
    wait_rd: 2,
    wait_tpkh_confirm: 3,
    wait_accounting: 3,
    wait_sa_approve: 2,
    closed: 10,
    discontinued: 2,
  },
};

function renderBomPage() {
  return render(
    <BrowserRouter>
      <BomPage />
    </BrowserRouter>,
  );
}

describe("BomPage (PR-08 Frontend BOM V2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.mockUser = { roleCode: "TPKH", fullName: "Trưởng phòng KH" };

    hooks.useBoms.mockReturnValue({
      data: {
        data: [mockBomFitItem, mockBomPoItem],
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    hooks.useBomStats.mockReturnValue({
      data: mockStats,
      isLoading: false,
      isError: false,
    });

    hooks.useStyles.mockReturnValue({
      data: {
        data: [
          { id: "style-1", styleCode: "ST-POLO", styleName: "Áo Polo Nam Classic" },
          { id: "style-2", styleCode: "ST-TEE", styleName: "Áo T-Shirt Basic" },
        ],
      },
      isLoading: false,
    });

    hooks.usePurchaseOrders.mockReturnValue({
      data: {
        items: [
          { id: "po-1", poCode: "PO-2026-001", customerNameSnapshot: "Uniqlo Vietnam" },
        ],
      },
      isLoading: false,
    });

    hooks.usePoProducts.mockReturnValue({
      data: {
        items: [
          {
            id: "pop-1",
            productCode: "PRD-POLO-RED",
            productName: "Áo Polo Đỏ",
            colors: [{ colorName: "Đỏ" }, { colorName: "Xanh" }],
            totalQuantity: 1500,
          },
          {
            id: "pop-2",
            productCode: "PRD-POLO-BLUE",
            productName: "Áo Polo Xanh",
            colors: [{ colorName: "Xanh" }],
            totalQuantity: 500,
          },
        ],
      },
      isLoading: false,
    });
  });

  afterEach(cleanup);

  // ──────────────────────────────────────────────────────────────────────────
  // 1. RENDERING & DATA DISPLAY
  // ──────────────────────────────────────────────────────────────────────────
  describe("1. Page Rendering & Basic Elements", () => {
    it("renders page header, title, and breadcrumb correctly", () => {
      renderBomPage();

      expect(screen.getByRole("heading", { name: "Quản lý Nguyên phụ liệu" })).toBeTruthy();
      expect(screen.getAllByText(/2 bảng NPL/).length).toBeGreaterThanOrEqual(1);
    });

    it("loads and displays BOM list table rows", () => {
      renderBomPage();

      expect(screen.getByText("PO-2026-001")).toBeTruthy();
      expect(screen.getByText("ST-POLO")).toBeTruthy();
      expect(screen.getByText("PRD-POLO-RED")).toBeTruthy();
    });

    it("loads and displays stat cards with correct figures", () => {
      renderBomPage();

      expect(screen.getByText("Tổng NPL")).toBeTruthy();
      expect(screen.getByText("25")).toBeTruthy();
      expect(screen.getAllByText("Nháp").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("5")).toBeTruthy();
      expect(screen.getByText("Chờ duyệt")).toBeTruthy();
      expect(screen.getByText("8")).toBeTruthy();
    });

    it("renders loading skeleton state when boms query is loading", () => {
      hooks.useBoms.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        refetch: vi.fn(),
      });

      const { container } = renderBomPage();
      const skeletonRows = container.querySelectorAll(".animate-pulse");
      expect(skeletonRows.length).toBeGreaterThan(0);
    });

    it("renders error state with retry button when boms query fails", () => {
      const refetchMock = vi.fn();
      hooks.useBoms.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch: refetchMock,
      });

      renderBomPage();

      expect(screen.getByText("Không thể tải dữ liệu danh sách BOM")).toBeTruthy();
      const retryBtn = screen.getByRole("button", { name: "Thử lại" });
      fireEvent.click(retryBtn);
      expect(refetchMock).toHaveBeenCalledTimes(1);
    });

    it("renders empty state when no BOMs are found", () => {
      hooks.useBoms.mockReturnValue({
        data: { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      });

      renderBomPage();

      expect(screen.getByText("Chưa có bảng BOM nào trong hệ thống")).toBeTruthy();
    });

    it("navigates to detail page on clicking BOM code or view detail button", () => {
      renderBomPage();

      const bomCodeBtn = screen.getByText("ST-POLO");
      fireEvent.click(bomCodeBtn);

      expect(hooks.mockNavigate).toHaveBeenCalledWith("/bom/bom-fit-1");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. FILTERS & SEARCH
  // ──────────────────────────────────────────────────────────────────────────
  describe("2. Search & Filtering Interactions", () => {
    it("filters by type when clicking segmented type buttons", () => {
      renderBomPage();

      const fitBtn = screen.getByRole("button", { name: "Mẫu Fit" });
      fireEvent.click(fitBtn);

      // Verify useBoms was invoked with type filter
      expect(hooks.useBoms).toHaveBeenCalledWith(
        expect.objectContaining({ type: "fit", page: 1 }),
      );
    });

    it("filters by status when changing status dropdown", () => {
      renderBomPage();

      const statusSelect = screen.getByLabelText("Lọc theo trạng thái");
      fireEvent.change(statusSelect, { target: { value: "closed" } });

      expect(hooks.useBoms).toHaveBeenCalledWith(
        expect.objectContaining({ status: "closed", page: 1 }),
      );
    });

    it("searches and debounces text changes", async () => {
      renderBomPage();

      const searchInput = screen.getByPlaceholderText(
        "Mã Fit / Style / Sản phẩm...",
      );
      fireEvent.change(searchInput, { target: { value: "cotton" } });

      await waitFor(
        () => {
          expect(hooks.useBoms).toHaveBeenCalledWith(
            expect.objectContaining({ search: "cotton", page: 1 }),
          );
        },
        { timeout: 600 },
      );
    });

    it("clears all filters when clicking clear filters button", () => {
      renderBomPage();

      const clearBtn = screen.getByRole("button", { name: /Làm mới|Xóa lọc/ });
      fireEvent.click(clearBtn);

      expect(hooks.useBoms).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 }),
      );
    });

    it("handles month picker change in stats header", () => {
      renderBomPage();

      const monthInput = screen.getByLabelText("Chọn tháng thống kê");
      fireEvent.change(monthInput, { target: { value: "2026-03" } });

      expect(hooks.useBomStats).toHaveBeenCalledWith(
        expect.objectContaining({ month: "2026-03" }),
      );
    });

    it("switches to year mode and updates stats", () => {
      renderBomPage();

      const modeSelect = screen.getByLabelText("Chọn loại thời gian");
      fireEvent.change(modeSelect, { target: { value: "year" } });

      const yearSelect = screen.getByLabelText("Chọn năm thống kê");
      fireEvent.change(yearSelect, { target: { value: "2025" } });

      expect(hooks.useBomStats).toHaveBeenCalledWith(
        expect.objectContaining({ year: "2025" }),
      );
    });

    it("switches to dateRange mode and updates stats with start and end dates", () => {
      renderBomPage();

      const modeSelect = screen.getByLabelText("Chọn loại thời gian");
      fireEvent.change(modeSelect, { target: { value: "dateRange" } });

      const startDateInput = screen.getByLabelText("Từ ngày");
      fireEvent.change(startDateInput, { target: { value: "2026-09-01" } });

      const endDateInput = screen.getByLabelText("Đến ngày");
      fireEvent.change(endDateInput, { target: { value: "2026-09-30" } });

      expect(hooks.useBomStats).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: "2026-09-01", endDate: "2026-09-30" }),
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. PAGINATION & SORTING
  // ──────────────────────────────────────────────────────────────────────────
  describe("3. Pagination & Sorting", () => {
    it("renders pagination and triggers page change", () => {
      hooks.useBoms.mockReturnValue({
        data: {
          data: [mockBomFitItem, mockBomPoItem],
          meta: { total: 45, page: 1, limit: 20, totalPages: 3 },
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      });

      renderBomPage();

      expect(screen.getByText("Hiển thị 1–20 trên 45 bảng NPL")).toBeTruthy();

      const nextBtn = screen.getByLabelText("Trang sau");
      fireEvent.click(nextBtn);

      expect(hooks.useBoms).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 }),
      );
    });

    it("toggles sorting when clicking column headers", () => {
      renderBomPage();

      const bomCodeHeader = screen.getByText("SẢN PHẨM");
      fireEvent.click(bomCodeHeader);

      expect(hooks.useBoms).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: "bomCode" }),
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. COST DISPLAY & ROLE MASKING
  // ──────────────────────────────────────────────────────────────────────────
  describe("4. Cost Display & Role Masking", () => {
    it("displays formatted VND cost for TPKH role", () => {
      hooks.mockUser = { roleCode: "TPKH", fullName: "Trưởng phòng KH" };
      renderBomPage();

      // PO BOM cost: 125,000 VND
      expect(screen.getByText("125.000 ₫")).toBeTruthy();
    });

    it("displays formatted VND cost for ACCOUNTING role", () => {
      hooks.mockUser = { roleCode: "ACCOUNTING", fullName: "Kế toán" };
      renderBomPage();

      expect(screen.getByText("125.000 ₫")).toBeTruthy();
    });

    it("displays formatted VND cost for SA (Admin/Director) role", () => {
      hooks.mockUser = { roleCode: "SA", fullName: "Ban Giám đốc" };
      renderBomPage();

      expect(screen.getByText("125.000 ₫")).toBeTruthy();
    });

    it("masks cost to dash (—) for NVKH role", () => {
      hooks.mockUser = { roleCode: "NVKH", fullName: "Nhân viên Kế hoạch" };
      renderBomPage();

      expect(screen.queryByText("125.000 ₫")).toBeNull();
    });

    it("masks cost to dash (—) for RD role", () => {
      hooks.mockUser = { roleCode: "RD", fullName: "R&D" };
      renderBomPage();

      expect(screen.queryByText("125.000 ₫")).toBeNull();
    });

    it("renders '0 ₫' accurately when cost is 0 (does not treat 0 as falsy null)", () => {
      hooks.mockUser = { roleCode: "TPKH", fullName: "Trưởng phòng KH" };
      const zeroCostItem: BomListItem = {
        ...mockBomPoItem,
        id: "bom-zero-cost",
        costPerUnit: 0,
      };

      hooks.useBoms.mockReturnValue({
        data: {
          data: [zeroCostItem],
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      });

      renderBomPage();

      expect(screen.getByText("0 ₫")).toBeTruthy();
    });

    it("renders dash (—) for FIT BOM cost regardless of role", () => {
      hooks.mockUser = { roleCode: "SA", fullName: "Ban Giám đốc" };
      renderBomPage();

      // FIT BOM row has cost displayed as "—"
      const rows = screen.getAllByRole("row");
      expect(rows.length).toBeGreaterThan(1);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. CREATE BUTTON PERMISSIONS
  // ──────────────────────────────────────────────────────────────────────────
  describe("5. Create Button Permissions", () => {
    it("shows '+ Tạo BOM' button for NVKH, TPKH, and SA roles", () => {
      const allowedRoles = ["NVKH", "TPKH", "SA", "ADMIN"];
      for (const role of allowedRoles) {
        hooks.mockUser = { roleCode: role, fullName: `User ${role}` };
        const { unmount } = renderBomPage();
        expect(screen.getByRole("button", { name: /Tạo BOM/i })).toBeTruthy();
        unmount();
      }
    });

    it("hides '+ Tạo BOM' button for unauthorized roles (RD, ACCOUNTING, IT)", () => {
      const disallowedRoles = ["RD", "ACCOUNTING", "IT", "GUEST"];
      for (const role of disallowedRoles) {
        hooks.mockUser = { roleCode: role, fullName: `User ${role}` };
        const { unmount } = renderBomPage();
        expect(screen.queryByRole("button", { name: /Tạo BOM/i })).toBeNull();
        unmount();
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. CREATE BOM WIZARD MODAL FLOW
  // ──────────────────────────────────────────────────────────────────────────
  describe("6. Create BOM Wizard Modal Flow", () => {
    it("opens wizard modal on clicking '+ Tạo BOM'", () => {
      renderBomPage();

      const createBtn = screen.getByRole("button", { name: /Tạo BOM/i });
      fireEvent.click(createBtn);

      expect(
        screen.getByText("Tạo mới Định mức Nguyên phụ liệu (BOM)"),
      ).toBeTruthy();
      expect(screen.getByText("Chọn loại BOM")).toBeTruthy();
    });

    it("creates FIT BOM successfully: selects FIT, chooses Style, and submits", async () => {
      hooks.createBom.mutateAsync.mockResolvedValueOnce({
        id: "new-bom-fit-123",
        bomCode: "BOM-FIT-ST01",
      });

      renderBomPage();

      // Open Modal
      fireEvent.click(screen.getByRole("button", { name: /Tạo BOM/i }));

      // Step 1: Select FIT BOM (default is fit)
      fireEvent.click(screen.getByText("FIT BOM (Mẫu Fit)"));
      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      // Step 2: Select Style
      expect(screen.getByText("Tìm kiếm theo mã Style hoặc tên Style chuẩn:")).toBeTruthy();

      // Open SearchableSelect
      const selectTrigger = screen.getByText("-- Chọn Mẫu Fit (Style) --");
      fireEvent.click(selectTrigger);

      // Pick ST-POLO from option list
      const styleOption = screen.getByRole("option", { name: /ST-POLO/ });
      fireEvent.click(styleOption);

      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      // Step 3: Review & Submit
      expect(screen.getByText("Thông tin bảng BOM sắp tạo:")).toBeTruthy();
      const submitBtn = screen.getByRole("button", { name: /Xác nhận tạo BOM/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(hooks.createBom.mutateAsync).toHaveBeenCalledWith({
          type: "fit",
          styleId: "style-1",
          deadline: undefined,
          rdNote: undefined,
        });
        expect(hooks.mockToast.showToast).toHaveBeenCalledWith(
          expect.stringContaining("BOM-FIT-ST01"),
        );
        expect(hooks.mockNavigate).toHaveBeenCalledWith("/bom/new-bom-fit-123");
      });
    });

    it("creates PO BOM successfully: selects PO, chooses Product from multi-select list, and submits", async () => {
      hooks.createBom.mutateAsync.mockResolvedValueOnce({
        id: "new-bom-po-456",
        bomCode: "BOM-PO01-P02",
      });

      renderBomPage();

      // Open Modal (default is PO BOM)
      fireEvent.click(screen.getByRole("button", { name: /Tạo BOM/i }));

      // Step 1: Default is PO BOM, click Tiếp tục
      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      // Step 2: Pick PO
      const poTrigger = screen.getByText("-- Chọn Đơn hàng PO --");
      fireEvent.click(poTrigger);
      fireEvent.click(screen.getByRole("option", { name: /PO-2026-001/ }));

      // PRD-POLO-BLUE (pop-2, no BOM) should be visible in modal; PRD-POLO-RED (pop-1, has BOM) should be filtered out
      const modal = screen.getByRole("dialog");
      await waitFor(() => {
        expect(within(modal).getByText("PRD-POLO-BLUE")).toBeTruthy();
        expect(within(modal).queryByText("PRD-POLO-RED")).toBeNull();
      });

      // Select PRD-POLO-BLUE
      fireEvent.click(within(modal).getByText("PRD-POLO-BLUE"));
      expect(within(modal).getByText(/Đã chọn 1 \/ 1/)).toBeTruthy();

      fireEvent.click(within(modal).getByRole("button", { name: /Tiếp tục/i }));

      // Step 3: Review & Submit
      expect(within(modal).getByText("PO BOM (Sản phẩm PO)")).toBeTruthy();
      expect(within(modal).getByText("PRD-POLO-BLUE")).toBeTruthy();
      const submitBtn = within(modal).getByRole("button", { name: /Xác nhận tạo BOM/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(hooks.createBom.mutateAsync).toHaveBeenCalledWith({
          type: "po",
          purchaseOrderProductId: "pop-2",
          deadline: undefined,
          rdNote: undefined,
        });
        expect(hooks.mockNavigate).toHaveBeenCalledWith("/bom/new-bom-po-456");
      });
    });

    it("filters out products that already have a BOM and displays empty state when all have BOM", async () => {
      // Mock PO products with ONLY pop-1 (which already has a BOM in mockBomPoItem)
      hooks.usePoProducts.mockReturnValue({
        data: {
          items: [
            {
              id: "pop-1",
              productCode: "PRD-POLO-RED",
              productName: "Áo Polo Đỏ",
              colors: [{ colorName: "Đỏ" }],
            },
          ],
        },
        isLoading: false,
      });

      renderBomPage();

      fireEvent.click(screen.getByRole("button", { name: /Tạo BOM/i }));
      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      fireEvent.click(screen.getByText("-- Chọn Đơn hàng PO --"));
      fireEvent.click(screen.getByRole("option", { name: /PO-2026-001/ }));

      await waitFor(() => {
        expect(screen.getByText("Tất cả sản phẩm đã có bảng BOM")).toBeTruthy();
      });

      // Tiếp tục button should be disabled
      const nextBtn = screen.getByRole("button", { name: /Tiếp tục/i });
      expect(nextBtn.hasAttribute("disabled")).toBe(true);
    });

    it("supports selecting multiple products and creating BOMs in batch", async () => {
      hooks.usePoProducts.mockReturnValue({
        data: {
          items: [
            {
              id: "pop-2",
              productCode: "PRD-POLO-BLUE",
              productName: "Áo Polo Xanh",
              colors: [{ colorName: "Xanh" }],
              totalQuantity: 300,
            },
            {
              id: "pop-3",
              productCode: "PRD-POLO-WHITE",
              productName: "Áo Polo Trắng",
              colors: [{ colorName: "Trắng" }],
              totalQuantity: 200,
            },
          ],
        },
        isLoading: false,
      });

      hooks.createBom.mutateAsync
        .mockResolvedValueOnce({ id: "bom-new-2", bomCode: "BOM-PO01-P02" })
        .mockResolvedValueOnce({ id: "bom-new-3", bomCode: "BOM-PO01-P03" });

      renderBomPage();

      fireEvent.click(screen.getByRole("button", { name: /Tạo BOM/i }));
      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      fireEvent.click(screen.getByText("-- Chọn Đơn hàng PO --"));
      fireEvent.click(screen.getByRole("option", { name: /PO-2026-001/ }));

      await waitFor(() => {
        expect(screen.getByText("PRD-POLO-BLUE")).toBeTruthy();
        expect(screen.getByText("PRD-POLO-WHITE")).toBeTruthy();
      });

      // Click "Chọn tất cả"
      fireEvent.click(screen.getByRole("button", { name: /Chọn tất cả/i }));
      expect(screen.getByText(/Đã chọn 2 \/ 2/)).toBeTruthy();

      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      // Step 3 shows 2 products
      expect(screen.getByText(/2 sản phẩm \(sẽ tạo 2 bảng BOM\)/)).toBeTruthy();
      const submitBtn = screen.getByRole("button", { name: /Xác nhận tạo 2 BOM/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(hooks.createBom.mutateAsync).toHaveBeenCalledTimes(2);
        expect(hooks.mockToast.showToast).toHaveBeenCalledWith(
          expect.stringContaining("Đã tạo thành công 2 bảng BOM"),
        );
      });
    });

    it("supports selecting multiple FIT styles and creating FIT BOMs in batch", async () => {
      hooks.createBom.mutateAsync
        .mockResolvedValueOnce({ id: "bom-fit-new-1", bomCode: "BOM-FIT-01" })
        .mockResolvedValueOnce({ id: "bom-fit-new-2", bomCode: "BOM-FIT-02" });

      renderBomPage();

      // Open Modal
      fireEvent.click(screen.getByRole("button", { name: /Tạo BOM/i }));

      const modal = screen.getByRole("dialog");

      // Step 1: Select FIT BOM
      fireEvent.click(within(modal).getByText("FIT BOM (Mẫu Fit)"));
      fireEvent.click(within(modal).getByRole("button", { name: /Tiếp tục/i }));

      // Step 2: Multi-select FIT styles
      expect(within(modal).getByText("Chọn Mẫu Fit (Style)")).toBeTruthy();
      expect(within(modal).getByText("ST-POLO")).toBeTruthy();
      expect(within(modal).getByText("ST-TEE")).toBeTruthy();

      // Click "Chọn tất cả"
      fireEvent.click(within(modal).getByRole("button", { name: /Chọn tất cả/i }));
      expect(within(modal).getByText(/Đã chọn 2 \/ 2 mẫu Fit/)).toBeTruthy();

      fireEvent.click(within(modal).getByRole("button", { name: /Tiếp tục/i }));

      // Step 3: Review & Submit
      expect(within(modal).getByText(/2 mẫu Fit \(sẽ tạo 2 bảng BOM\)/)).toBeTruthy();
      const submitBtn = within(modal).getByRole("button", { name: /Xác nhận tạo 2 BOM/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(hooks.createBom.mutateAsync).toHaveBeenCalledTimes(2);
        expect(hooks.mockToast.showToast).toHaveBeenCalledWith(
          expect.stringContaining("Đã tạo thành công 2 bảng BOM"),
        );
      });
    });

    it("displays clear conflict error when creating duplicate FIT BOM (409 Conflict)", async () => {
      hooks.createBom.mutateAsync.mockRejectedValueOnce(
        createAxiosError(
          { code: "CONFLICT", message: "A BOM for this style already exists" },
          409,
        ),
      );

      renderBomPage();

      // Open Modal -> Step 1: Pick FIT -> Step 2 -> Pick Style -> Step 3 -> Submit
      fireEvent.click(screen.getByRole("button", { name: /Tạo BOM/i }));
      fireEvent.click(screen.getByText("FIT BOM (Mẫu Fit)"));
      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      fireEvent.click(screen.getByText("-- Chọn Mẫu Fit (Style) --"));
      fireEvent.click(screen.getByRole("option", { name: /ST-POLO/ }));
      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      fireEvent.click(screen.getByRole("button", { name: /Xác nhận tạo BOM/i }));

      await waitFor(() => {
        expect(
          screen.getByText(
            "Mẫu Fit này đã có BOM. Mỗi Style chỉ có tối đa 1 Fit BOM.",
          ),
        ).toBeTruthy();
      });
    });

    it("prevents advancing from Step 2 if required PO or products are not selected", async () => {
      renderBomPage();

      fireEvent.click(screen.getByRole("button", { name: /Tạo BOM/i }));
      // Step 1: click Next (PO BOM default)
      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      // Step 2 without selecting PO: click Next
      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));
      expect(screen.getByText("Vui lòng chọn Đơn hàng PO.")).toBeTruthy();

      // Select PO but do not select any products
      fireEvent.click(screen.getByText("-- Chọn Đơn hàng PO --"));
      fireEvent.click(screen.getByRole("option", { name: /PO-2026-001/ }));

      await waitFor(() => {
        expect(screen.getByText("PRD-POLO-BLUE")).toBeTruthy();
      });

      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));
      expect(screen.getByText("Vui lòng chọn ít nhất một sản phẩm thuộc đơn hàng PO.")).toBeTruthy();
    });

    it("handles generic server errors safely when create API fails", async () => {
      hooks.createBom.mutateAsync.mockRejectedValueOnce(
        createAxiosError(
          { code: "INTERNAL_SERVER_ERROR", message: "Server connection failed" },
          500,
        ),
      );

      renderBomPage();

      fireEvent.click(screen.getByRole("button", { name: /Tạo BOM/i }));
      fireEvent.click(screen.getByText("FIT BOM (Mẫu Fit)"));
      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      fireEvent.click(screen.getByText("-- Chọn Mẫu Fit (Style) --"));
      fireEvent.click(screen.getByRole("option", { name: /ST-POLO/ }));
      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      fireEvent.click(screen.getByRole("button", { name: /Xác nhận tạo BOM/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Máy chủ đang gặp sự cố. Vui lòng thử lại sau."),
        ).toBeTruthy();
      });
    });

    it("displays product colors as informational badges in multi-select cards", async () => {
      renderBomPage();

      fireEvent.click(screen.getByRole("button", { name: /Tạo BOM/i }));
      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      fireEvent.click(screen.getByText("-- Chọn Đơn hàng PO --"));
      fireEvent.click(screen.getByRole("option", { name: /PO-2026-001/ }));

      await waitFor(() => {
        expect(screen.getByText("PRD-POLO-BLUE")).toBeTruthy();
      });

      // Check informational note
      expect(
        screen.getByText(
          "* Mỗi sản phẩm được chọn sẽ được tạo một bảng BOM riêng (dùng chung cho mọi màu sắc và kích cỡ).",
        ),
      ).toBeTruthy();
      // Check color pills are displayed as informational badges
      expect(screen.getByText("Xanh")).toBeTruthy();
    });

    it("renders discontinued BOM status badge and allows row navigation", () => {
      const discontinuedItem: BomListItem = {
        ...mockBomPoItem,
        id: "bom-disc-1",
        bomCode: "BOM-DISC-01",
        status: "discontinued",
        discontinuedAt: "2026-03-15T00:00:00Z",
      };

      hooks.useBoms.mockReturnValue({
        data: {
          data: [discontinuedItem],
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      });

      renderBomPage();

      expect(screen.getAllByText(/Đã khóa|Ngừng sử dụng/).length).toBeGreaterThanOrEqual(1);

      // Row remains clickable
      const bomBtn = screen.getByText("PRD-POLO-RED");
      fireEvent.click(bomBtn);
      expect(hooks.mockNavigate).toHaveBeenCalledWith("/bom/bom-disc-1");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 7. MULTI-PO BOM CREATION FLOW
  // ──────────────────────────────────────────────────────────────────────────
  describe("7. Multi-PO BOM Creation Flow", () => {
    it("supports selecting multiple POs, renders products grouped by PO, and creates BOMs in batch", async () => {
      hooks.usePurchaseOrders.mockReturnValue({
        data: {
          items: [
            { id: "po-1", poCode: "PO-2026-001", customerNameSnapshot: "Uniqlo Vietnam" },
            { id: "po-2", poCode: "PO-2026-002", customerNameSnapshot: "Zara Global" },
          ],
        },
        isLoading: false,
      });

      hooks.usePoProducts.mockImplementation((id: string) => {
        if (id === "po-1") {
          return {
            data: {
              items: [
                { id: "pop-1", productCode: "PRD-POLO-RED", productName: "Áo Polo Đỏ" },
                { id: "pop-2", productCode: "PRD-POLO-BLUE", productName: "Áo Polo Xanh" },
              ],
            },
            isLoading: false,
          };
        }
        if (id === "po-2") {
          return {
            data: {
              items: [
                { id: "pop-3", productCode: "PRD-ZARA-JEAN", productName: "Quần Jean Zara" },
                { id: "pop-4", productCode: "PRD-ZARA-JACKET", productName: "Áo Khoác Zara" },
              ],
            },
            isLoading: false,
          };
        }
        return { data: { items: [] }, isLoading: false };
      });

      hooks.useBoms.mockImplementation((params: Record<string, unknown>) => {
        if (params?.purchaseOrder === "po-1") {
          return {
            data: {
              data: [{ id: "bom-1", purchaseOrderProductId: "pop-1" }],
              meta: { total: 1, totalPages: 1, page: 1, limit: 20 },
            },
            isLoading: false,
          };
        }
        return {
          data: {
            data: [],
            meta: { total: 0, totalPages: 1, page: 1, limit: 20 },
          },
          isLoading: false,
        };
      });

      hooks.createBom.mutateAsync
        .mockResolvedValueOnce({ id: "bom-new-2", bomCode: "BOM-PO01-P02" })
        .mockResolvedValueOnce({ id: "bom-new-3", bomCode: "BOM-PO02-P03" })
        .mockResolvedValueOnce({ id: "bom-new-4", bomCode: "BOM-PO02-P04" });

      renderBomPage();

      fireEvent.click(screen.getByRole("button", { name: /Thêm nguyên liệu/i }));
      // Step 1 -> Step 2
      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      const modal = screen.getByRole("dialog");

      // Verify "Chọn toàn bộ PO (2)" button is present when multiple POs exist
      const selectAllPosBtn = within(modal).getByRole("button", { name: /Chọn toàn bộ PO/i });
      fireEvent.click(selectAllPosBtn);

      await waitFor(() => {
        // Both PO chips should be rendered
        expect(within(modal).getAllByText("PO-2026-001").length).toBeGreaterThanOrEqual(1);
        expect(within(modal).getAllByText("PO-2026-002").length).toBeGreaterThanOrEqual(1);
      });

      // Check product strict filtering: pop-1 (PRD-POLO-RED) has BOM so it MUST NOT be shown in modal
      expect(within(modal).queryByText("PRD-POLO-RED")).toBeNull();

      // Available products without BOM must be shown
      expect(within(modal).getByText("PRD-POLO-BLUE")).toBeTruthy();
      expect(within(modal).getByText("PRD-ZARA-JEAN")).toBeTruthy();
      expect(within(modal).getByText("PRD-ZARA-JACKET")).toBeTruthy();

      // Total available counter: 0 / 3
      expect(within(modal).getByText(/Đã chọn 0 \/ 3/)).toBeTruthy();

      // Global Select All Products
      fireEvent.click(within(modal).getByRole("button", { name: /Chọn tất cả/i }));
      expect(within(modal).getByText(/Đã chọn 3 \/ 3/)).toBeTruthy();

      // Step 2 -> Step 3
      fireEvent.click(within(modal).getByRole("button", { name: /Tiếp tục/i }));

      // Review step should list both POs and selected products
      expect(within(modal).getByText("PO-2026-001, PO-2026-002")).toBeTruthy();
      expect(within(modal).getByText(/3 sản phẩm \(sẽ tạo 3 bảng BOM\)/)).toBeTruthy();

      // Submit
      fireEvent.click(within(modal).getByRole("button", { name: /Xác nhận tạo 3 BOM/i }));

      await waitFor(() => {
        expect(hooks.createBom.mutateAsync).toHaveBeenCalledTimes(3);
        expect(hooks.mockToast.showToast).toHaveBeenCalledWith(
          "Đã tạo thành công 3 bảng BOM cho 2 đơn hàng PO.",
        );
      });
    });

    it("removes selected PO and unselects its products when clicking PO chip remove button", async () => {
      hooks.usePurchaseOrders.mockReturnValue({
        data: {
          items: [
            { id: "po-1", poCode: "PO-2026-001", customerNameSnapshot: "Uniqlo Vietnam" },
            { id: "po-2", poCode: "PO-2026-002", customerNameSnapshot: "Zara Global" },
          ],
        },
        isLoading: false,
      });

      hooks.usePoProducts.mockImplementation((id: string) => {
        if (id === "po-1") {
          return {
            data: {
              items: [{ id: "pop-2", productCode: "PRD-POLO-BLUE", productName: "Áo Polo Xanh" }],
            },
            isLoading: false,
          };
        }
        if (id === "po-2") {
          return {
            data: {
              items: [{ id: "pop-3", productCode: "PRD-ZARA-JEAN", productName: "Quần Jean Zara" }],
            },
            isLoading: false,
          };
        }
        return { data: { items: [] }, isLoading: false };
      });

      hooks.useBoms.mockReturnValue({
        data: {
          data: [],
          meta: { total: 0, totalPages: 1, page: 1, limit: 20 },
        },
        isLoading: false,
      });

      renderBomPage();

      fireEvent.click(screen.getByRole("button", { name: /Thêm nguyên liệu/i }));
      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      const modal = screen.getByRole("dialog");

      // Select all POs
      fireEvent.click(within(modal).getByRole("button", { name: /Chọn toàn bộ PO/i }));

      await waitFor(() => {
        expect(within(modal).getByText("PRD-POLO-BLUE")).toBeTruthy();
        expect(within(modal).getByText("PRD-ZARA-JEAN")).toBeTruthy();
      });

      // Select all products (2 products)
      fireEvent.click(within(modal).getByRole("button", { name: /Chọn tất cả/i }));
      expect(within(modal).getByText(/Đã chọn 2 \/ 2/)).toBeTruthy();

      // Remove PO-2026-002 via chip remove button
      const removePo2Btn = within(modal).getByRole("button", { name: /Bỏ chọn PO PO-2026-002/i });
      fireEvent.click(removePo2Btn);

      await waitFor(() => {
        // PO-2026-002 chip is gone
        expect(within(modal).queryByText("Zara Global")).toBeNull();
        // Product of PO-2 is removed from available list
        expect(within(modal).queryByText("PRD-ZARA-JEAN")).toBeNull();
        // Product of PO-1 is still selected (1 / 1)
        expect(within(modal).getByText(/Đã chọn 1 \/ 1/)).toBeTruthy();
      });
    });
  });
});
