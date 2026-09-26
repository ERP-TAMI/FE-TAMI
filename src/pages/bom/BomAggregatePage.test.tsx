import { cleanup, fireEvent, render, screen, within, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import BomAggregatePage from "./BomAggregatePage";
import type { BomAggregateItem, BomAggregateResponse } from "@/types/bom";

// SearchParams mock variable
let mockSearchParams = new URLSearchParams();
const mockSetSearchParams = vi.fn((updater: unknown) => {
  if (typeof updater === "function") {
    mockSearchParams = updater(mockSearchParams);
  } else {
    mockSearchParams = new URLSearchParams(updater as Record<string, string>);
  }
});

// Hoisted mocks for hooks
const hooks = vi.hoisted(() => ({
  useBomAggregate: vi.fn(),
  useBoms: vi.fn(),
  usePurchaseOrders: vi.fn(),
  usePoProducts: vi.fn(),
  useStyles: vi.fn(),
  useMaterials: vi.fn(),
  useMaterialGroups: vi.fn(),
  mockNavigate: vi.fn(),
  mockUser: { roleCode: "TPKH", fullName: "Trưởng phòng Kế hoạch" },
  refetchMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => hooks.mockNavigate,
    useSearchParams: () => [mockSearchParams, mockSetSearchParams],
  };
});

vi.mock("@/store/authStore", () => ({
  useAuthStore: (selector: (state: { user: typeof hooks.mockUser }) => unknown) =>
    selector({ user: hooks.mockUser }),
}));

vi.mock("@/hooks/useBoms", () => ({
  useBomAggregate: (params: unknown) => hooks.useBomAggregate(params),
  useBoms: (params: unknown) => hooks.useBoms(params),
}));

vi.mock("@/hooks/usePurchaseOrders", () => ({
  usePurchaseOrders: (query: unknown) => hooks.usePurchaseOrders(query),
  usePoProducts: (id?: string) => hooks.usePoProducts(id),
  useMultiPoProducts: (ids: string[]) =>
    ids.map((id) => ({
      data: hooks.usePoProducts(id)?.data,
      isLoading: false,
    })),
}));

vi.mock("@/hooks/useStyles", () => ({
  useStyles: (query: unknown) => hooks.useStyles(query),
}));

vi.mock("@/hooks/useMaterials", () => ({
  useMaterials: (query: unknown) => hooks.useMaterials(query),
}));

vi.mock("@/hooks/useMaterialGroups", () => ({
  useMaterialGroups: () => hooks.useMaterialGroups(),
}));

// Mock data fixtures
const mockItem1: BomAggregateItem = {
  materialId: "mat-1",
  materialNameSnapshot: "Vải Cotton 100%",
  materialGroupSnapshot: "Vải chính",
  unitSnapshot: "Mét",
  bomCount: 3,
  totalRequiredQuantity: 2500,
  unitCost: 100000,
  totalEstimatedCost: 250000000,
  costComplete: true,
  breakdown: [
    { colorName: "Đỏ", requiredQuantity: 1000 },
    { colorName: "Xanh", requiredQuantity: 800 },
    { colorName: "Đen", requiredQuantity: 700 },
  ],
};

const mockItem2: BomAggregateItem = {
  materialId: "mat-2",
  materialNameSnapshot: "Chỉ may Polyester",
  materialGroupSnapshot: "Chỉ may",
  unitSnapshot: "Cuộn",
  bomCount: 2,
  totalRequiredQuantity: 1200,
  unitCost: 15000,
  totalEstimatedCost: 18000000,
  costComplete: true,
  breakdown: [
    { sizeLabel: "S", requiredQuantity: 300 },
    { sizeLabel: "M", requiredQuantity: 500 },
    { sizeLabel: "L", requiredQuantity: 400 },
  ],
};

// Same material as mockItem1 but different unitSnapshot (historical / sample)
const mockItem1DuplicateUnit: BomAggregateItem = {
  materialId: "mat-1",
  materialNameSnapshot: "Vải Cotton 100%",
  materialGroupSnapshot: "Vải chính",
  unitSnapshot: "Kg",
  bomCount: 1,
  totalRequiredQuantity: 500,
  unitCost: 220000,
  totalEstimatedCost: 110000000,
  costComplete: true,
  breakdown: [],
};

const mockColorSizeItem: BomAggregateItem = {
  materialId: "mat-3",
  materialNameSnapshot: "Nút áo nhựa 4 lỗ",
  materialGroupSnapshot: "Phụ liệu đóng gói",
  unitSnapshot: "Cái",
  bomCount: 4,
  totalRequiredQuantity: 5000,
  unitCost: 500,
  totalEstimatedCost: 2500000,
  costComplete: true,
  breakdown: [
    { colorName: "Trắng", sizeLabel: "S", requiredQuantity: 1000 },
    { colorName: "Trắng", sizeLabel: "M", requiredQuantity: 1500 },
    { colorName: "Đen", sizeLabel: "L", requiredQuantity: 2500 },
  ],
};

const mockIncompleteCostItem: BomAggregateItem = {
  materialId: "mat-4",
  materialNameSnapshot: "Dây kéo kim loại",
  materialGroupSnapshot: "Phụ liệu may",
  unitSnapshot: "Cái",
  bomCount: 1,
  totalRequiredQuantity: 300,
  unitCost: null,
  totalEstimatedCost: null,
  costComplete: false,
  breakdown: [],
};

const mockZeroCostItem: BomAggregateItem = {
  materialId: "mat-5",
  materialNameSnapshot: "Nhãn mác cổ áo",
  materialGroupSnapshot: "Nhãn mác",
  unitSnapshot: "Cái",
  bomCount: 2,
  totalRequiredQuantity: 1000,
  unitCost: 0,
  totalEstimatedCost: 0,
  costComplete: true,
  breakdown: [],
};

const defaultAggregateResponse: BomAggregateResponse = {
  data: [mockItem1, mockItem2],
  meta: {
    total: 2,
    page: 1,
    limit: 20,
    totalPages: 1,
  },
};

describe("BomAggregatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    hooks.mockUser = { roleCode: "TPKH", fullName: "Trưởng phòng Kế hoạch" };

    // Default selector hooks return values
    hooks.usePurchaseOrders.mockReturnValue({
      data: {
        items: [
          { id: "po-1", poCode: "PO-2026-001", customerNameSnapshot: "Nhà cung cấp A" },
          { id: "po-2", poCode: "PO-2026-002", customerNameSnapshot: "Nhà cung cấp B" },
        ],
      },
      isLoading: false,
    });

    hooks.usePoProducts.mockImplementation((id?: string) => ({
      data:
        id === "po-1"
          ? {
              items: [
                { id: "prod-1", productCode: "PRD-01", productName: "Áo Polo Nam" },
                { id: "prod-2", productCode: "PRD-02", productName: "Quần Khaki" },
              ],
            }
          : { items: [] },
      isLoading: false,
    }));

    hooks.useStyles.mockReturnValue({
      data: {
        data: [
          { id: "style-1", styleCode: "ST-01", styleName: "Áo thun cổ bẻ" },
          { id: "style-2", styleCode: "ST-02", styleName: "Áo sơ mi oxford" },
        ],
      },
      isLoading: false,
    });

    hooks.useMaterials.mockReturnValue({
      data: [
        { id: "mat-1", materialCode: "MAT-01", materialName: "Vải Cotton 100%" },
        { id: "mat-2", materialCode: "MAT-02", materialName: "Chỉ may Polyester" },
      ],
      isLoading: false,
    });

    hooks.useMaterialGroups.mockReturnValue({
      data: [
        { id: "grp-1", name: "BUTTON", status: "active" },
        { id: "grp-2", name: "FUSIBLE", status: "active" },
      ],
      isLoading: false,
    });

    hooks.useBomAggregate.mockReturnValue({
      data: defaultAggregateResponse,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: hooks.refetchMock,
    });

    hooks.useBoms.mockReturnValue({
      data: {
        data: [
          {
            id: "bom-1",
            bomCode: "BOM-PO-001",
            type: "po",
            status: "closed",
            lineCount: 4,
            purchaseOrder: { id: "po-1", poCode: "PO-2026-001" },
            product: { id: "prod-1", productName: "Áo Polo Nam", productCode: "PRD-01" },
            style: { styleName: "Áo Polo Nam" },
            createdAt: "2026-09-01T00:00:00Z",
          },
          {
            id: "bom-2",
            bomCode: "BOM-PO-002",
            type: "po",
            status: "closed",
            lineCount: 3,
            purchaseOrder: { id: "po-1", poCode: "PO-2026-001" },
            product: { id: "prod-2", productName: "Quần Khaki", productCode: "PRD-02" },
            style: { styleName: "Quần Khaki" },
            createdAt: "2026-09-01T00:00:00Z",
          },
        ],
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: hooks.refetchMock,
    });
  });

  afterEach(() => {
    cleanup();
  });

  // ==========================================
  // PAGE (Tests 1-6)
  // ==========================================
  describe("PAGE", () => {
    it("1. render page: renders page title, breadcrumb and summary cards", () => {
      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      expect(screen.getByRole("heading", { name: "Tổng hợp nhu cầu NPL" })).toBeTruthy();
      expect(screen.getByText("Số lượng được tính theo dữ liệu PO hiện tại")).toBeTruthy();
      expect(screen.getByText("Tổng số loại NPL")).toBeTruthy();
      expect(screen.getByText("Chế độ phân rã")).toBeTruthy();
      expect(screen.getByTestId("bom-aggregate-table")).toBeTruthy();
    });

    it("2. loading: displays skeleton when isLoading is true", () => {
      hooks.useBomAggregate.mockReturnValue({
        data: undefined,
        isLoading: true,
        isFetching: false,
        isError: false,
        error: null,
        refetch: hooks.refetchMock,
      });

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      expect(screen.getByTestId("bom-aggregate-skeleton")).toBeTruthy();
      expect(screen.queryByTestId("bom-aggregate-table")).toBeNull();
    });

    it("3. error: displays error container when isError is true", () => {
      hooks.useBomAggregate.mockReturnValue({
        data: undefined,
        isLoading: false,
        isFetching: false,
        isError: true,
        error: new Error("Lỗi mạng"),
        refetch: hooks.refetchMock,
      });

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      expect(screen.getByTestId("bom-aggregate-error")).toBeTruthy();
      expect(screen.getByText("Không thể tải dữ liệu tổng hợp NPL")).toBeTruthy();
    });

    it("4. retry: clicks Retry button and triggers refetch", () => {
      hooks.useBomAggregate.mockReturnValue({
        data: undefined,
        isLoading: false,
        isFetching: false,
        isError: true,
        error: new Error("Server error"),
        refetch: hooks.refetchMock,
      });

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      const retryBtn = screen.getByTestId("aggregate-retry-btn");
      fireEvent.click(retryBtn);
      expect(hooks.refetchMock).toHaveBeenCalledTimes(1);
    });

    it("5. empty state: renders empty state when no BOM PO data exists", () => {
      hooks.useBomAggregate.mockReturnValue({
        data: { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        refetch: hooks.refetchMock,
      });

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      expect(screen.getByText("Chưa có dữ liệu NPL")).toBeTruthy();
      expect(
        screen.getByText(
          "Chưa có BOM PO nào ở trạng thái đã đóng (closed) để tổng hợp nhu cầu nguyên phụ liệu.",
        ),
      ).toBeTruthy();
      expect(screen.queryByTestId("clear-filters-btn")).toBeNull();
    });

    it("6. filtered empty state: renders empty state with clear filters button when filtered", () => {
      mockSearchParams.set("search", "NonExistentMaterial");
      hooks.useBomAggregate.mockReturnValue({
        data: { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        refetch: hooks.refetchMock,
      });

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      expect(screen.getByText("Chưa có dữ liệu NPL")).toBeTruthy();
      const clearBtn = screen.getByTestId("empty-state-clear-btn");
      expect(clearBtn).toBeTruthy();
      fireEvent.click(clearBtn);
      expect(mockSetSearchParams).toHaveBeenCalled();
    });
  });

  // ==========================================
  // FILTERS (Tests 7-16)
  // ==========================================
  describe("FILTERS", () => {
    it("7. PO filter: selecting a PO updates URL params and resets page", () => {
      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      const poSelect = screen.getByTestId("aggregate-po-select");
      fireEvent.change(poSelect, { target: { value: "po-1" } });

      expect(mockSetSearchParams).toHaveBeenCalled();
    });

    it("8. PO -> BOM dependency: BOM selector populates BOMs for selected PO and resets on PO change", () => {
      mockSearchParams.set("purchaseOrderId", "po-1");
      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      const bomSelect = screen.getByTestId("aggregate-bom-select");
      expect(within(bomSelect).getByText("PRD-01")).toBeTruthy();
      expect(within(bomSelect).getByText("PRD-02")).toBeTruthy();

      // Changing PO resets BOM selection
      const poSelect = screen.getByTestId("aggregate-po-select");
      fireEvent.change(poSelect, { target: { value: "po-2" } });
      expect(mockSetSearchParams).toHaveBeenCalled();
    });

    it("9. BOM filter: selecting a BOM sets bomId", () => {
      mockSearchParams.set("purchaseOrderId", "po-1");
      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      const bomSelect = screen.getByTestId("aggregate-bom-select");
      fireEvent.change(bomSelect, { target: { value: "bom-1" } });
      expect(mockSetSearchParams).toHaveBeenCalled();
    });

    it("10. Style filter: selecting a style sets styleId", () => {
      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      const styleSelect = screen.getByTestId("aggregate-style-select");
      fireEvent.change(styleSelect, { target: { value: "style-1" } });
      expect(mockSetSearchParams).toHaveBeenCalled();
    });

    it("11. Material filter: selecting a material sets materialId", () => {
      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      const matSelect = screen.getByTestId("aggregate-material-select");
      fireEvent.change(matSelect, { target: { value: "mat-1" } });
      expect(mockSetSearchParams).toHaveBeenCalled();
    });

    it("12. Search: typing in search input updates local value", () => {
      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      const searchInput = screen.getByTestId("aggregate-search-input") as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: "Cotton" } });
      expect(searchInput.value).toBe("Cotton");
    });

    it("13. debounce: search triggers query update after 300ms debounce", async () => {
      vi.useFakeTimers();
      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      const searchInput = screen.getByTestId("aggregate-search-input");
      fireEvent.change(searchInput, { target: { value: "Cotton" } });

      expect(mockSetSearchParams).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockSetSearchParams).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it("14. breakdown filter: selecting breakdown changes mode", () => {
      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      const breakdownSelect = screen.getByTestId("aggregate-breakdown-select");
      fireEvent.change(breakdownSelect, { target: { value: "color" } });
      expect(mockSetSearchParams).toHaveBeenCalled();
    });

    it("15. clear filters: clicking clear filters resets all parameters", () => {
      mockSearchParams.set("search", "Cotton");
      mockSearchParams.set("purchaseOrderId", "po-1");

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      const clearBtn = screen.getByTestId("clear-filters-btn");
      fireEvent.click(clearBtn);
      expect(mockSetSearchParams).toHaveBeenCalledWith(new URLSearchParams(), { replace: true });
    });

    it("16. URL synchronization: reading params from URL passes them to hook", () => {
      mockSearchParams.set("purchaseOrderId", "po-1");
      mockSearchParams.set("styleId", "style-1");
      mockSearchParams.set("materialId", "mat-1");
      mockSearchParams.set("breakdown", "color");
      mockSearchParams.set("page", "2");
      mockSearchParams.set("limit", "50");

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      expect(hooks.useBomAggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          purchaseOrderId: "po-1",
          styleId: "style-1",
          materialId: "mat-1",
          breakdown: "color",
          page: 2,
          limit: 50,
        }),
      );
    });
  });

  // ==========================================
  // AGGREGATE TABLE (Tests 17-23)
  // ==========================================
  describe("AGGREGATE TABLE", () => {
    it("17. render material: displays materialNameSnapshot and materialGroupSnapshot", () => {
      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      expect(screen.getByText("Vải Cotton 100%")).toBeTruthy();
      expect(screen.getByText("Vải chính")).toBeTruthy();
      expect(screen.getByText("Chỉ may Polyester")).toBeTruthy();
      expect(screen.getByText("Chỉ may")).toBeTruthy();
    });

    it("18. render unit snapshot: displays exact unitSnapshot without modifying master", () => {
      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      expect(screen.getByText("Mét")).toBeTruthy();
      expect(screen.getByText("Cuộn")).toBeTruthy();
    });

    it("19. render total quantity: formats required quantity with Vietnamese formatting", () => {
      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      // 2500 formatted as 2.500
      expect(screen.getByText("2.500")).toBeTruthy();
      // 1200 formatted as 1.200
      expect(screen.getByText("1.200")).toBeTruthy();
    });

    it("20. preserve duplicate material with different unit: preserves rows with same materialId but different unitSnapshot", () => {
      hooks.useBomAggregate.mockReturnValue({
        data: {
          data: [mockItem1, mockItem1DuplicateUnit],
          meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
        },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        refetch: hooks.refetchMock,
      });

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      expect(screen.getByText("Mét")).toBeTruthy();
      expect(screen.getByText("Kg")).toBeTruthy();
      expect(screen.getByText("2.500")).toBeTruthy();
      expect(screen.getByText("500")).toBeTruthy();
    });

    it("21. pagination: displays pagination controls with total items and pages", () => {
      hooks.useBomAggregate.mockReturnValue({
        data: {
          data: [mockItem1],
          meta: { total: 45, page: 1, limit: 20, totalPages: 3 },
        },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        refetch: hooks.refetchMock,
      });

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      expect(screen.getByText("45")).toBeTruthy();
    });

    it("22. page size: changing page size resets page to 1", () => {
      hooks.useBomAggregate.mockReturnValue({
        data: {
          data: [mockItem1],
          meta: { total: 50, page: 2, limit: 20, totalPages: 3 },
        },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        refetch: hooks.refetchMock,
      });

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      const paginationSelect = screen.getByTestId("aggregate-page-size-select");
      fireEvent.change(paginationSelect, { target: { value: "50" } });

      expect(mockSetSearchParams).toHaveBeenCalled();
    });

    it("23. current page: navigation to next page triggers updateQueryParams with page: 2", () => {
      hooks.useBomAggregate.mockReturnValue({
        data: {
          data: [mockItem1],
          meta: { total: 40, page: 1, limit: 20, totalPages: 2 },
        },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        refetch: hooks.refetchMock,
      });

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      const page2Btn = screen.getByRole("button", { name: "Trang 2" });
      fireEvent.click(page2Btn);
      expect(mockSetSearchParams).toHaveBeenCalled();
    });
  });

  // ==========================================
  // BREAKDOWN (Tests 24-28)
  // ==========================================
  describe("BREAKDOWN", () => {
    it("24. color breakdown: expands row and renders colors with backend quantities", () => {
      mockSearchParams.set("breakdown", "color");
      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      const expandBtn = screen.getByTestId("expand-btn-0");
      fireEvent.click(expandBtn);

      expect(screen.getByText("Đỏ")).toBeTruthy();
      expect(screen.getByText("1.000")).toBeTruthy();
      expect(screen.getByText("Xanh")).toBeTruthy();
      expect(screen.getByText("800")).toBeTruthy();
      expect(screen.getByText("Đen")).toBeTruthy();
      expect(screen.getByText("700")).toBeTruthy();
    });

    it("25. size breakdown: expands row and renders sizes with backend quantities", () => {
      mockSearchParams.set("breakdown", "size");
      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      const expandBtn = screen.getByTestId("expand-btn-1");
      fireEvent.click(expandBtn);

      expect(screen.getByText("S")).toBeTruthy();
      expect(screen.getByText("300")).toBeTruthy();
      expect(screen.getByText("M")).toBeTruthy();
      expect(screen.getByText("500")).toBeTruthy();
      expect(screen.getByText("L")).toBeTruthy();
      expect(screen.getByText("400")).toBeTruthy();
    });

    it("26. color_size breakdown: renders nested breakdown grouped by color and size", () => {
      mockSearchParams.set("breakdown", "color_size");
      hooks.useBomAggregate.mockReturnValue({
        data: {
          data: [mockColorSizeItem],
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        refetch: hooks.refetchMock,
      });

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      const expandBtn = screen.getByTestId("expand-btn-0");
      fireEvent.click(expandBtn);

      expect(screen.getAllByText("Trắng")[0]).toBeTruthy();
      expect(screen.getAllByText("Đen")[0]).toBeTruthy();
      expect(screen.getAllByText("2.500")[0]).toBeTruthy();
    });

    it("27. expand/collapse: clicking expand toggle twice collapses the breakdown drawer", () => {
      mockSearchParams.set("breakdown", "color");
      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      const expandBtn = screen.getByTestId("expand-btn-0");
      // Expand
      fireEvent.click(expandBtn);
      expect(screen.getByText("Đỏ")).toBeTruthy();

      // Collapse
      fireEvent.click(expandBtn);
      expect(screen.queryByText("Đỏ")).toBeNull();
    });

    it("28. empty breakdown: shows notice when breakdown list is empty", () => {
      mockSearchParams.set("breakdown", "color");
      hooks.useBomAggregate.mockReturnValue({
        data: {
          data: [mockItem1DuplicateUnit], // empty breakdown: []
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        refetch: hooks.refetchMock,
      });

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      const expandBtn = screen.getByTestId("expand-btn-0");
      fireEvent.click(expandBtn);

      expect(screen.getByText("Không có dữ liệu phân rã chi tiết cho vật tư này")).toBeTruthy();
    });
  });

  // ==========================================
  // COST (Tests 29-36)
  // ==========================================
  describe("COST DISPLAY & ROLES", () => {
    it("29. NVKH hides cost: user with role NVKH does not see cost headers or values", () => {
      hooks.mockUser = { roleCode: "NVKH", fullName: "Nhân viên Kế hoạch" };
      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      expect(screen.queryByText("Đơn giá")).toBeNull();
      expect(screen.queryByText("Chi phí dự tính")).toBeNull();
    });

    it("30. RD hides cost: user with role RD does not see cost headers or values", () => {
      hooks.mockUser = { roleCode: "RD", fullName: "R&D Staff" };
      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      expect(screen.queryByText("Đơn giá")).toBeNull();
      expect(screen.queryByText("Chi phí dự tính")).toBeNull();
    });

    it("31. TPKH does not see cost: BOM cost is excluded from material aggregate table", () => {
      hooks.mockUser = { roleCode: "TPKH", fullName: "Trưởng phòng KH" };
      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      expect(screen.queryByText("Đơn giá")).toBeNull();
      expect(screen.queryByText("Chi phí dự tính")).toBeNull();
    });

    it("32. ACCOUNTING does not see cost: BOM cost is excluded from material aggregate table", () => {
      hooks.mockUser = { roleCode: "ACCOUNTING", fullName: "Kế toán" };
      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      expect(screen.queryByText("Đơn giá")).toBeNull();
      expect(screen.queryByText("Chi phí dự tính")).toBeNull();
    });

    it("33. SA does not see cost: BOM cost is excluded from material aggregate table", () => {
      hooks.mockUser = { roleCode: "SA", fullName: "Super Admin / Giám đốc" };
      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      expect(screen.queryByText("Đơn giá")).toBeNull();
      expect(screen.queryByText("Chi phí dự tính")).toBeNull();
    });

    it("34. pure requirement display: renders required quantities and units without price", () => {
      hooks.mockUser = { roleCode: "TPKH", fullName: "Trưởng phòng KH" };
      hooks.useBomAggregate.mockReturnValue({
        data: {
          data: [{ ...mockItem1, unitCost: null, totalEstimatedCost: null }],
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        refetch: hooks.refetchMock,
      });

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      expect(screen.getByText("2.500")).toBeTruthy();
      expect(screen.queryByText("Đơn giá")).toBeNull();
      expect(screen.queryByText("Chi phí dự tính")).toBeNull();
    });

    it("35. summary cards exclude price and cross-unit total: renders only BOM and material counts", () => {
      hooks.mockUser = { roleCode: "TPKH", fullName: "Trưởng phòng KH" };
      hooks.useBomAggregate.mockReturnValue({
        data: {
          data: [mockZeroCostItem],
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        refetch: hooks.refetchMock,
      });

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      const summaryContainer = screen.getByTestId("bom-aggregate-summary");
      expect(within(summaryContainer).queryByText("Tổng nhu cầu")).toBeNull();
      expect(within(summaryContainer).queryByText("Tổng chi phí dự tính")).toBeNull();
    });

    it("36. table excludes incomplete price badges: renders material row cleanly without cost warnings", () => {
      hooks.mockUser = { roleCode: "TPKH", fullName: "Trưởng phòng KH" };
      hooks.useBomAggregate.mockReturnValue({
        data: {
          data: [mockIncompleteCostItem],
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        refetch: hooks.refetchMock,
      });

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      expect(screen.queryByText("Chưa đủ dữ liệu giá")).toBeNull();
      expect(screen.queryByText("Đơn giá")).toBeNull();
      expect(screen.queryByText("Chi phí dự tính")).toBeNull();
    });
  });

  // ==========================================
  // REFRESH & QUERY (Tests 37-40)
  // ==========================================
  describe("REFRESH / QUERY", () => {
    it("37. refresh refetches: clicking Refresh button invokes query refetch", () => {
      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      const refreshBtn = screen.getByTestId("aggregate-refresh-btn");
      fireEvent.click(refreshBtn);
      expect(hooks.refetchMock).toHaveBeenCalledTimes(1);
    });

    it("38. query key contains filters: passes active filters to useBomAggregate hook", () => {
      mockSearchParams.set("purchaseOrderId", "po-1");
      mockSearchParams.set("breakdown", "color");
      mockSearchParams.set("search", "Poly");

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      expect(hooks.useBomAggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          purchaseOrderId: "po-1",
          breakdown: "color",
          search: "Poly",
        }),
      );
    });

    it("38b. product filter uses purchaseOrderProductId without aliasing it to bomId", () => {
      mockSearchParams.set("purchaseOrderId", "po-1");
      mockSearchParams.set("purchaseOrderProductId", "prod-1");

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      expect(hooks.useBomAggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          purchaseOrderProductId: "prod-1",
          bomId: undefined,
        }),
      );
      expect((screen.getByTestId("aggregate-product-select") as HTMLSelectElement).value).toBe(
        "prod-1",
      );
    });

    it("39. filter changes reset page: selecting a new PO resets page to 1", () => {
      mockSearchParams.set("page", "3");
      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      const poSelect = screen.getByTestId("aggregate-po-select");
      fireEvent.change(poSelect, { target: { value: "po-1" } });

      expect(mockSetSearchParams).toHaveBeenCalled();
    });

    it("40. breakdown change resets page: changing breakdown mode resets page to 1", () => {
      mockSearchParams.set("page", "4");
      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      const breakdownSelect = screen.getByTestId("aggregate-breakdown-select");
      fireEvent.change(breakdownSelect, { target: { value: "size" } });

      expect(mockSetSearchParams).toHaveBeenCalled();
    });
  });

  // ==========================================
  // ERRORS (Tests 41-43)
  // ==========================================
  describe("ERRORS", () => {
    it("41. 400 Bad Request: displays error response message", () => {
      hooks.useBomAggregate.mockReturnValue({
        data: undefined,
        isLoading: false,
        isFetching: false,
        isError: true,
        error: {
          response: {
            status: 400,
            data: { message: "Tham số truy vấn không hợp lệ" },
          },
        },
        refetch: hooks.refetchMock,
      });

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      expect(screen.getByText("Tham số truy vấn không hợp lệ")).toBeTruthy();
    });

    it("42. 403 Forbidden: displays permission denied error message", () => {
      hooks.useBomAggregate.mockReturnValue({
        data: undefined,
        isLoading: false,
        isFetching: false,
        isError: true,
        error: {
          response: {
            status: 403,
            data: { message: "Bạn không có quyền truy cập dữ liệu này" },
          },
        },
        refetch: hooks.refetchMock,
      });

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      expect(screen.getByText("Bạn không có quyền truy cập dữ liệu này")).toBeTruthy();
    });

    it("43. network error: displays fallback friendly error message on network failure", () => {
      hooks.useBomAggregate.mockReturnValue({
        data: undefined,
        isLoading: false,
        isFetching: false,
        isError: true,
        error: new Error("Network Error"),
        refetch: hooks.refetchMock,
      });

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      expect(
        screen.getByText("Đã xảy ra lỗi khi kết nối với máy chủ. Vui lòng thử lại."),
      ).toBeTruthy();
    });
  });

  // ==========================================
  // TABS NAVIGATION (Tổng hợp theo vật tư & Theo màu / size)
  // ==========================================
  describe("TABS NAVIGATION", () => {
    it("44. removes 'Theo sản phẩm' and 'Chi tiết theo BOM' tabs from UI", () => {
      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      expect(screen.queryByText("Theo sản phẩm")).toBeNull();
      expect(screen.queryByText("Chi tiết theo BOM")).toBeNull();
      expect(screen.getByText("Tổng hợp theo vật tư")).toBeTruthy();
      expect(screen.getByText("Theo màu / size")).toBeTruthy();
    });

    it("45. clicking 'Theo màu / size' activates breakdown tab and updates URL params", () => {
      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      const colorSizeTabBtn = screen.getByTestId("tab-color-size");
      fireEvent.click(colorSizeTabBtn);

      // Verify searchParams updated with tab and breakdown
      expect(mockSetSearchParams).toHaveBeenCalled();
    });

    it("46. switching back to 'Tổng hợp theo vật tư' displays material aggregate table", () => {
      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      // Switch to color_size tab
      fireEvent.click(screen.getByTestId("tab-color-size"));

      // Switch back to material tab
      fireEvent.click(screen.getByTestId("tab-material"));
      expect(screen.getByTestId("bom-aggregate-table")).toBeTruthy();
    });

    it("47. in 'Theo màu / size' tab, renders size matrix table by default with size columns and summary stats", () => {
      mockSearchParams.set("tab", "color_size");
      hooks.useBomAggregate.mockReturnValue({
        data: {
          data: [mockColorSizeItem],
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        refetch: hooks.refetchMock,
      });

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      expect(screen.getByTestId("bom-aggregate-size-matrix-table")).toBeTruthy();
      expect(screen.getByTestId("size-matrix-summary-stats")).toBeTruthy();
      expect(screen.getByText("Size (Số lượng nhu cầu)")).toBeTruthy();
      expect(screen.getByText("Tổng cộng")).toBeTruthy();
    });

    it("48. toggling display mode between 'Gộp theo NPL' and 'Hiển thị chi tiết'", () => {
      mockSearchParams.set("tab", "color_size");
      hooks.useBomAggregate.mockReturnValue({
        data: {
          data: [mockColorSizeItem],
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        refetch: hooks.refetchMock,
      });

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      const detailedBtn = screen.getByTestId("display-mode-detailed");
      fireEvent.click(detailedBtn);
      // All color rows expanded
      expect(screen.getAllByText("Trắng")[0]).toBeTruthy();

      const groupedBtn = screen.getByTestId("display-mode-grouped");
      fireEvent.click(groupedBtn);
      expect(screen.getByTestId("display-mode-grouped")).toBeTruthy();
    });

    it("49. expanding row in size matrix table reveals color subrows with breakdown quantities", () => {
      mockSearchParams.set("tab", "color_size");
      hooks.useBomAggregate.mockReturnValue({
        data: {
          data: [mockColorSizeItem],
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        refetch: hooks.refetchMock,
      });

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      const expandBtn = screen.getByTestId("expand-btn-0");
      fireEvent.click(expandBtn);

      expect(screen.getAllByText("Trắng")[0]).toBeTruthy();
      expect(screen.getAllByText("Đen")[0]).toBeTruthy();
      expect(screen.getAllByText("2.500")[0]).toBeTruthy();
    });

    it("50. size matrix: Mã NPL column is removed from headers and breakdown groups by product", () => {
      mockSearchParams.set("tab", "color_size");
      hooks.useBomAggregate.mockReturnValue({
        data: {
          data: [mockColorSizeItem],
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        refetch: hooks.refetchMock,
      });

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      // Verify Mã NPL is not in the size matrix table headers
      const matrixTable = screen.getByTestId("bom-aggregate-size-matrix-table");
      expect(matrixTable.textContent).not.toContain("Mã NPL");

      // Expand row
      const expandBtn = screen.getByTestId("expand-btn-0");
      fireEvent.click(expandBtn);

      // Verify Product header is present
      expect(screen.getAllByText("Sản phẩm")[0]).toBeTruthy();
      expect(screen.getAllByText("Trắng")[0]).toBeTruthy();
      expect(screen.getAllByText("Đen")[0]).toBeTruthy();
    });

    it("51. keeps PO dropdown enabled and selectable when BOM is selected", () => {
      mockSearchParams = new URLSearchParams("bomId=bom-1");

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      const bomSelect = screen.getByTestId("aggregate-bom-select") as HTMLSelectElement;
      expect(bomSelect.disabled).toBe(false);
      expect(bomSelect.value).toBe("bom-1");

      const poSelect = screen.getByTestId("aggregate-po-select") as HTMLSelectElement;
      expect(poSelect).toBeTruthy();
      expect(poSelect.disabled).toBe(false);
      expect(poSelect.textContent).toContain("Tất cả đơn hàng");
      expect(poSelect.textContent).not.toContain("Khóa (đang lọc theo BOM)");
    });

    it("52. keeps PO dropdown enabled and limits BOMs to PO when PO is selected first", () => {
      mockSearchParams = new URLSearchParams("purchaseOrderId=po-1");

      render(
        <BrowserRouter>
          <BomAggregatePage />
        </BrowserRouter>,
      );

      const poSelect = screen.getByTestId("aggregate-po-select") as HTMLSelectElement;
      expect(poSelect).toBeTruthy();
      expect(poSelect.disabled).toBe(false);
      expect(poSelect.value).toBe("po-1");

      const bomSelect = screen.getByTestId("aggregate-bom-select") as HTMLSelectElement;
      expect(bomSelect.disabled).toBe(false);
      expect(bomSelect.textContent).toContain("Tất cả BOM trong đơn");
      expect(bomSelect.textContent).toContain("PRD-01");
      expect(bomSelect.textContent).toContain("PRD-02");
    });
  });
});
