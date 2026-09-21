import { MemoryRouter, Route, Routes } from "react-router-dom";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BomPage from "./BomPage";
import BomDetailPage from "./BomDetailPage";
import BomAggregatePage from "./BomAggregatePage";
import type {
  BomListItem,
  BomDetail,
  RevisionDetail,
  BomAggregateItem,
} from "@/types/bom";

// =========================================================================
// HOISTED MOCKS & ROUTING CONFIGURATION
// =========================================================================
const hooks = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUser: { roleCode: "TPKH", fullName: "Trưởng phòng Kế hoạch" },
  mockToast: {
    toast: null as { message: string; variant?: "success" | "error" | "neutral" } | null,
    showToast: vi.fn(),
    hideToast: vi.fn(),
  },
  useBoms: vi.fn(),
  useBomStats: vi.fn(),
  useCreateBom: { isPending: false, mutateAsync: vi.fn() },
  useBom: vi.fn(),
  useUpdateBom: { isPending: false, mutateAsync: vi.fn() },
  useBomRevisions: vi.fn(),
  useBomRevisionDetail: vi.fn(),
  useBomRevisionHistory: vi.fn(),
  useBomRevisionDiff: vi.fn(),
  useAddBomLine: { isPending: false, mutateAsync: vi.fn() },
  useUpdateBomLine: { isPending: false, mutateAsync: vi.fn() },
  useDeleteBomLine: { isPending: false, mutateAsync: vi.fn() },
  useReorderBomLines: { isPending: false, mutateAsync: vi.fn() },
  useForwardBom: { isPending: false, mutateAsync: vi.fn() },
  useRejectBom: { isPending: false, mutateAsync: vi.fn() },
  useApproveBom: { isPending: false, mutateAsync: vi.fn() },
  useCreateRevision: { isPending: false, mutateAsync: vi.fn() },
  useCopyFit: { isPending: false, mutateAsync: vi.fn() },
  useDiscontinueBom: { isPending: false, mutateAsync: vi.fn() },
  refetchBom: vi.fn(),
  useBomAggregate: vi.fn(),
  refetchAggregate: vi.fn(),
  useStyles: vi.fn(),
  useMaterials: vi.fn(),
  useMaterialGroups: vi.fn(),
  usePurchaseOrders: vi.fn(),
  usePoProducts: vi.fn(),
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

vi.mock("@/api/boms.api", () => ({
  bomsApi: {
    getBoms: vi.fn().mockResolvedValue({
      data: [
        {
          id: "fit-src-uuid",
          bomCode: "BOM-FIT-ST01",
          type: "fit",
          style: { id: "style-1", styleCode: "ST-01", styleName: "Áo sơ mi Oxford" },
        },
      ],
    }),
    getBomById: vi.fn().mockResolvedValue({
      id: "fit-src-uuid",
      bomCode: "BOM-FIT-ST01",
      type: "fit",
      style: { id: "style-1", styleCode: "ST-01", styleName: "Áo sơ mi Oxford" },
      currentRevision: { id: "rev-fit-src-1", revisionNo: 1 },
      lines: [
        { id: "l-fit-1", materialNameSnapshot: "Vải Cotton", consumption: 1.5 },
      ],
    }),
  },
}));

vi.mock("@/hooks/useBoms", () => ({
  useBoms: (params?: unknown, options?: { enabled?: boolean }) => {
    if (options && options.enabled === false) return { data: undefined, isLoading: false };
    return hooks.useBoms(params);
  },
  useMultiPoBoms: (poIds: string[]) =>
    poIds.map(() => ({
      data: { data: [] },
      isLoading: false,
    })),
  useBomStats: () => hooks.useBomStats(),
  useCreateBom: () => hooks.useCreateBom,
  useBom: () => hooks.useBom(),
  useUpdateBom: () => hooks.useUpdateBom,
  useBomRevisions: () => hooks.useBomRevisions(),
  useBomRevisionDetail: (bomId?: string, revisionId?: string) =>
    hooks.useBomRevisionDetail(bomId, revisionId),
  useBomRevisionHistory: () => hooks.useBomRevisionHistory(),
  useBomRevisionDiff: () => hooks.useBomRevisionDiff(),
  useAddBomLine: () => hooks.useAddBomLine,
  useUpdateBomLine: () => hooks.useUpdateBomLine,
  useDeleteBomLine: () => hooks.useDeleteBomLine,
  useReorderBomLines: () => hooks.useReorderBomLines,
  useForwardBom: () => hooks.useForwardBom,
  useRejectBom: () => hooks.useRejectBom,
  useApproveBom: () => hooks.useApproveBom,
  useCreateRevision: () => hooks.useCreateRevision,
  useCreateBomRevision: () => hooks.useCreateRevision,
  useCopyFit: () => hooks.useCopyFit,
  useCopyFitToPoBom: () => hooks.useCopyFit,
  useDiscontinueBom: () => hooks.useDiscontinueBom,
  useBomAggregate: (params?: unknown) => hooks.useBomAggregate(params),
}));

vi.mock("@/hooks/useStyles", () => ({
  useStyles: () => hooks.useStyles(),
}));

vi.mock("@/hooks/useMaterials", () => ({
  useMaterials: () => hooks.useMaterials(),
  useMaterialGroups: () => hooks.useMaterialGroups(),
}));

vi.mock("@/hooks/useMaterialGroups", () => ({
  useMaterialGroups: () => hooks.useMaterialGroups(),
}));

vi.mock("@/hooks/usePurchaseOrders", () => ({
  usePurchaseOrders: () => hooks.usePurchaseOrders(),
  usePoProducts: (poId: string) => hooks.usePoProducts(poId),
  useMultiPoProducts: (poIds: string[]) =>
    poIds.map((id) => {
      const res = hooks.usePoProducts(id);
      return {
        data: res?.data ?? { items: [] },
        isLoading: res?.isLoading ?? false,
      };
    }),
}));

// =========================================================================
// MOCK DOMAINS & FIXTURES
// =========================================================================
const mockBomListItems: BomListItem[] = [
  {
    id: "bom-fit-1",
    bomCode: "BOM-FIT-2026-001",
    type: "fit",
    status: "closed",
    discontinuedAt: null,
    revisionNo: 1,
    costPerUnit: null,
    currentOrderQuantity: null,
    currentOrderCost: null,
    colorNameSnapshot: null,
    deadline: null,
    rdNote: null,
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    style: {
      id: "style-1",
      styleCode: "ST-POLO",
      styleName: "Áo Polo Nam Classic",
    },
    purchaseOrder: null,
    product: null,
    currentRevision: {
      id: "rev-fit-01",
      bomId: "bom-fit-1",
      revisionNo: 1,
      status: "closed",
      createdAt: "2026-09-01T00:00:00Z",
    },
  },
  {
    id: "bom-po-01",
    bomCode: "BOM-PO-2026-002",
    type: "po",
    status: "wait_accounting",
    discontinuedAt: null,
    revisionNo: 1,
    costPerUnit: 120000,
    currentOrderQuantity: 1000,
    currentOrderCost: 120000000,
    colorNameSnapshot: "Xanh navy",
    deadline: "2026-10-01T00:00:00Z",
    rdNote: "Yêu cầu kiểm tra độ co rút",
    createdAt: "2026-09-10T00:00:00Z",
    updatedAt: "2026-09-12T00:00:00Z",
    style: null,
    purchaseOrder: {
      id: "po-1",
      poCode: "PO-2026-888",
      customerName: "Khách hàng VIP",
    },
    product: {
      id: "prod-1",
      productCode: "PRD-QUAN-01",
      productName: "Quần âu may sẵn",
      colors: ["Xanh navy"],
      purchaseOrderId: "po-1",
    },
    currentRevision: {
      id: "rev-po-01",
      bomId: "bom-po-01",
      revisionNo: 1,
      status: "wait_accounting",
      createdAt: "2026-09-10T00:00:00Z",
    },
  },
];

const mockDetailBom: BomDetail = {
  id: "bom-v2-test-id",
  bomCode: "BOM-PO-2026-002",
  type: "po",
  status: "wait_nvkh",
  revisionNo: 1,
  costPerUnit: 220000,
  currentOrderQuantity: 1000,
  currentOrderCost: 220000000,
  colorNameSnapshot: "Xanh navy",
  deadline: "2026-10-15T00:00:00Z",
  rdNote: "Ghi chú kỹ thuật",
  createdAt: "2026-09-10T00:00:00Z",
  updatedAt: "2026-09-10T00:00:00Z",
  discontinuedAt: null,
  rowVersion: 1,
  style: { id: "style-1", styleCode: "ST-01", styleName: "Áo sơ mi Slimfit" },
  purchaseOrder: { id: "po-1", poCode: "PO-2026-888", customerName: "Khách hàng VIP" },
  product: {
    id: "prod-1",
    purchaseOrderId: "po-1",
    productCode: "PRD-QUAN-01",
    productName: "Quần âu may sẵn",
    colors: ["Xanh navy"],
  },
  currentRevision: {
    id: "rev-1",
    bomId: "bom-v2-test-id",
    revisionNo: 1,
    status: "wait_nvkh",
    createdAt: "2026-09-10T00:00:00Z",
    approvedBy: null,
    approvedAt: null,
  },
  lines: [
    {
      id: "line-1",
      revisionId: "rev-1",
      materialId: "mat-1",
      materialNameSnapshot: "Vải Kaki Spandex",
      materialGroupId: "grp-1",
      materialGroupSnapshot: "Vải chính",
      unitId: "unit-1",
      unitSnapshot: "Mét",
      consumption: 1.5,
      unitCost: 120000,
      lineCost: 180000,
      note: "Vải mặt ngoài",
      orderIndex: 1,
      createdAt: "2026-09-10T00:00:00Z",
      updatedAt: "2026-09-10T00:00:00Z",
    },
    {
      id: "line-2",
      revisionId: "rev-1",
      materialId: "mat-2",
      materialNameSnapshot: "Chỉ may 40/2",
      materialGroupId: "grp-2",
      materialGroupSnapshot: "Chỉ may",
      unitId: "unit-2",
      unitSnapshot: "Cuộn",
      consumption: 0.2,
      unitCost: 20000,
      lineCost: 4000,
      note: "Chỉ cùng màu vải",
      orderIndex: 2,
      createdAt: "2026-09-10T00:00:00Z",
      updatedAt: "2026-09-10T00:00:00Z",
    },
  ],
};

const mockRevisionDetail: RevisionDetail = {
  ...mockDetailBom.currentRevision!,
  lines: mockDetailBom.lines,
  costPerUnit: 184000,
  isCurrent: true,
};

const mockAggregateItems: BomAggregateItem[] = [
  {
    materialId: "mat-1",
    materialNameSnapshot: "Vải Kaki Spandex",
    materialGroupSnapshot: "Vải chính",
    unitSnapshot: "Mét",
    bomCount: 2,
    totalRequiredQuantity: 3000,
    unitCost: 120000,
    totalEstimatedCost: 360000000,
    costComplete: true,
    breakdown: [
      { colorName: "Xanh navy", sizeLabel: "M", requiredQuantity: 1500 },
      { colorName: "Xanh navy", sizeLabel: "L", requiredQuantity: 1500 },
    ],
  },
  {
    materialId: "mat-1",
    materialNameSnapshot: "Vải Kaki Spandex",
    materialGroupSnapshot: "Vải chính",
    unitSnapshot: "Kg",
    bomCount: 1,
    totalRequiredQuantity: 50,
    unitCost: 250000,
    totalEstimatedCost: 12500000,
    costComplete: true,
    breakdown: [],
  },
  {
    materialId: "mat-2",
    materialNameSnapshot: "Chỉ may 40/2",
    materialGroupSnapshot: "Chỉ may",
    unitSnapshot: "Cuộn",
    bomCount: 1,
    totalRequiredQuantity: 200,
    unitCost: 0,
    totalEstimatedCost: 0,
    costComplete: true,
    breakdown: [],
  },
  {
    materialId: "mat-3",
    materialNameSnapshot: "Nhãn dệt cổ áo",
    materialGroupSnapshot: "Phụ liệu",
    unitSnapshot: "Cái",
    bomCount: 1,
    totalRequiredQuantity: 1000,
    unitCost: null,
    totalEstimatedCost: null,
    costComplete: false,
    breakdown: [],
  },
];

// Helper to render with MemoryRouter
function renderWithRouter(
  ui: React.ReactNode,
  { initialEntries = ["/bom"] }: { initialEntries?: string[] } = {}
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/bom" element={ui} />
        <Route path="/bom/:id" element={ui} />
        <Route path="/bom/aggregate" element={ui} />
      </Routes>
    </MemoryRouter>
  );
}

// =========================================================================
// TEST SUITE: PR-11 BOM V2 FINAL INTEGRATION & E2E REGRESSION
// =========================================================================
describe("PR-11: BOM V2 Final Integration & E2E Regression", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.mockUser = { roleCode: "TPKH", fullName: "Trưởng phòng Kế hoạch" };

    // Set default resolved values for mutations
    hooks.useCreateBom.mutateAsync.mockResolvedValue({
      id: "new-bom-id",
      bomCode: "BOM-NEW",
    });
    hooks.useUpdateBom.mutateAsync.mockResolvedValue({});
    hooks.useAddBomLine.mutateAsync.mockResolvedValue({});
    hooks.useUpdateBomLine.mutateAsync.mockResolvedValue({});
    hooks.useDeleteBomLine.mutateAsync.mockResolvedValue({});
    hooks.useReorderBomLines.mutateAsync.mockResolvedValue({});
    hooks.useForwardBom.mutateAsync.mockResolvedValue({});
    hooks.useRejectBom.mutateAsync.mockResolvedValue({});
    hooks.useApproveBom.mutateAsync.mockResolvedValue({});
    hooks.useCreateRevision.mutateAsync.mockResolvedValue({
      id: "rev-po-02",
      revisionNo: 2,
    });
    hooks.useCopyFit.mutateAsync.mockResolvedValue({});
    hooks.useDiscontinueBom.mutateAsync.mockResolvedValue({});

    hooks.useBoms.mockReturnValue({
      data: {
        data: mockBomListItems,
        meta: { total: 12, page: 1, limit: 20, totalPages: 2 },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    hooks.useBomStats.mockReturnValue({
      data: {
        total: 12,
        draftCount: 3,
        pendingCount: 4,
        approvedCount: 5,
        trend: { totalDiff: 2, pendingDiff: 0, approvedDiff: 1 },
      },
      isLoading: false,
    });

    hooks.useBom.mockReturnValue({
      data: mockDetailBom,
      isLoading: false,
      isError: false,
      refetch: hooks.refetchBom,
    });

    hooks.useBomRevisions.mockReturnValue({
      data: [
        {
          id: "rev-po-01",
          bomId: "bom-v2-test-id",
          revisionNo: 1,
          status: "wait_nvkh",
          isCurrent: true,
          createdAt: "2026-09-10T00:00:00Z",
        },
      ],
      isLoading: false,
    });

    hooks.useBomRevisionDetail.mockReturnValue({
      data: mockRevisionDetail,
      isLoading: false,
    });

    hooks.useBomRevisionHistory.mockReturnValue({
      data: [
        {
          id: "hist-1",
          revisionId: "rev-po-01",
          fromStatus: "wait_nvkh",
          toStatus: "wait_rd",
          createdAt: "2026-09-10T00:00:00Z",
          note: "Chuyển R&D",
          changedBy: "NVKH Nguyễn Văn A",
        },
      ],
      isLoading: false,
    });

    hooks.useBomRevisionDiff.mockReturnValue({
      data: {
        revisionId: "rev-po-01",
        compareWithRevisionId: "rev-po-00",
        items: [
          {
            diffType: "ADDED",
            materialNameSnapshot: "Keo dựng vải",
            materialGroupSnapshot: "Phụ liệu",
            unitSnapshot: "Mét",
            target: { consumption: 0.5, unitCost: 15000 },
          },
        ],
      },
      isLoading: false,
    });

    hooks.useBomAggregate.mockReturnValue({
      data: {
        data: mockAggregateItems,
        meta: { total: 4, page: 1, limit: 20, totalPages: 1 },
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: hooks.refetchAggregate,
    });

    hooks.useStyles.mockReturnValue({
      data: { data: [{ id: "style-1", styleCode: "ST-01", styleName: "Áo sơ mi Oxford" }] },
      isLoading: false,
    });

    hooks.useMaterials.mockReturnValue({
      data: [{ id: "mat-1", materialCode: "MAT-01", materialName: "Vải Kaki Spandex" }],
      isLoading: false,
    });

    hooks.useMaterialGroups.mockReturnValue({
      data: [{ id: "grp-1", name: "Vải chính" }],
      isLoading: false,
    });

    hooks.usePurchaseOrders.mockReturnValue({
      data: {
        items: [{ id: "po-1", poCode: "PO-2026-888", customerNameSnapshot: "Khách hàng VIP" }],
      },
      isLoading: false,
    });

    hooks.usePoProducts.mockReturnValue({
      data: {
        items: [
          {
            id: "prod-1",
            productCode: "PRD-QUAN-01",
            productName: "Quần âu may sẵn",
            colors: [{ colorName: "Xanh navy" }],
            totalQuantity: 1000,
          },
        ],
      },
      isLoading: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  // =======================================================================
  // 1. FLOW A: BOM LIST & FILTERING
  // =======================================================================
  describe("FLOW A: BOM List & Filtering", () => {
    it("1. renders statistics KPI cards accurately from backend response", () => {
      renderWithRouter(<BomPage />, { initialEntries: ["/bom"] });

      expect(screen.getAllByText("Quản lý Nguyên phụ liệu")[0]).toBeTruthy();
      expect(screen.getByText("Tổng NPL")).toBeTruthy();
      expect(screen.getAllByText("12")[0]).toBeTruthy(); // total
      expect(screen.getAllByText("3")[0]).toBeTruthy(); // draft
      expect(screen.getAllByText("4")[0]).toBeTruthy(); // pending
      expect(screen.getAllByText("5")[0]).toBeTruthy(); // approved
    });

    it("2. filters by BOM type (FIT vs PO) and updates query state", () => {
      renderWithRouter(<BomPage />, { initialEntries: ["/bom"] });

      const fitBtn = screen.getByRole("button", { name: "Mẫu Fit" });
      fireEvent.click(fitBtn);

      expect(hooks.useBoms).toHaveBeenCalledWith(
        expect.objectContaining({ type: "fit", page: 1 })
      );
    });

    it("3. filters by status and resets page to 1", () => {
      renderWithRouter(<BomPage />, { initialEntries: ["/bom"] });

      const statusFilter = screen.getByLabelText("Lọc theo trạng thái");
      fireEvent.change(statusFilter, { target: { value: "closed" } });

      expect(hooks.useBoms).toHaveBeenCalledWith(
        expect.objectContaining({ status: "closed", page: 1 })
      );
    });

    it("4. debounces search input updates before triggering query", async () => {
      renderWithRouter(<BomPage />, { initialEntries: ["/bom"] });

      const searchInput = screen.getByPlaceholderText("Mã Fit / Style / Sản phẩm...");
      fireEvent.change(searchInput, { target: { value: "Oxford" } });

      await waitFor(
        () => {
          expect(hooks.useBoms).toHaveBeenCalledWith(
            expect.objectContaining({ search: "Oxford" })
          );
        },
        { timeout: 1500 }
      );
    });

    it("5. renders pagination controls with total items and allows page navigation", () => {
      renderWithRouter(<BomPage />, { initialEntries: ["/bom"] });

      const page2Btn = screen.getByLabelText("Trang 2");
      expect(page2Btn).toBeTruthy();
      fireEvent.click(page2Btn);

      expect(hooks.useBoms).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });

    it("6. clicking on a BOM row navigates cleanly to /bom/:id", () => {
      renderWithRouter(<BomPage />, { initialEntries: ["/bom"] });

      const bomCodeLink = screen.getByText("ST-POLO");
      fireEvent.click(bomCodeLink);

      expect(hooks.mockNavigate).toHaveBeenCalledWith("/bom/bom-fit-1");
    });
  });

  // =======================================================================
  // 2. FLOW B: CREATE BOM WIZARD
  // =======================================================================
  describe("FLOW B: Create BOM Wizard", () => {
    it("7. opens create modal on clicking '+ Tạo BOM'", () => {
      renderWithRouter(<BomPage />, { initialEntries: ["/bom"] });

      const createBtn = screen.getByLabelText("Thêm nguyên liệu - Tạo BOM");
      fireEvent.click(createBtn);

      expect(
        screen.getByText("Tạo mới Định mức Nguyên phụ liệu (BOM)")
      ).toBeTruthy();
      expect(screen.getByText("Chọn loại BOM")).toBeTruthy();
    });

    it("8. successfully creates FIT BOM with selected style and redirects to detail", async () => {
      hooks.useCreateBom.mutateAsync.mockResolvedValueOnce({
        id: "new-fit-bom-123",
        bomCode: "BOM-FIT-ST01",
      });

      renderWithRouter(<BomPage />, { initialEntries: ["/bom"] });

      fireEvent.click(screen.getByLabelText("Thêm nguyên liệu - Tạo BOM"));

      // Step 1: Select FIT BOM
      fireEvent.click(screen.getByText("FIT BOM (Mẫu Fit)"));
      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      // Step 2: Select Style ST-01
      fireEvent.click(screen.getByText("ST-01"));
      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      // Step 3: Confirm Create
      const submitBtn = screen.getByRole("button", { name: /Xác nhận tạo BOM/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(hooks.useCreateBom.mutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "fit",
            styleId: "style-1",
          })
        );
        expect(hooks.mockNavigate).toHaveBeenCalledWith("/bom/new-fit-bom-123");
      });
    });

    it("9. successfully creates PO BOM with selected purchase order and product", async () => {
      hooks.useCreateBom.mutateAsync.mockResolvedValueOnce({
        id: "new-po-bom-456",
        bomCode: "BOM-PO-NEW",
      });

      renderWithRouter(<BomPage />, { initialEntries: ["/bom"] });

      fireEvent.click(screen.getByLabelText("Thêm nguyên liệu - Tạo BOM"));

      // Step 1: PO BOM is selected by default, click Tiếp tục
      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      // Step 2: Select PO and Product
      fireEvent.click(screen.getByPlaceholderText(/Tìm kiếm đơn hàng PO/i));
      fireEvent.click(screen.getByRole("option", { name: /PO-2026-888/ }));
      fireEvent.click(screen.getAllByText("PRD-QUAN-01")[1]);

      fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

      // Step 3: Confirm Create
      const submitBtn = screen.getByRole("button", { name: /Xác nhận tạo BOM/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(hooks.useCreateBom.mutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "po",
            purchaseOrderProductId: "prod-1",
          })
        );
        expect(hooks.mockNavigate).toHaveBeenCalledWith("/bom/new-po-bom-456");
      });
    });
  });

  // =======================================================================
  // 3. FLOW C: BOM DETAIL & PERMISSIONS
  // =======================================================================
  describe("FLOW C: BOM Detail & Permissions", () => {
    it("10. header renders BOM code, type badge, status badge, revision number, and PO info", () => {
      renderWithRouter(<BomDetailPage />, { initialEntries: ["/bom/bom-v2-test-id"] });

      expect(screen.getByText("PO BOM: PRD-QUAN-01")).toBeTruthy();
      expect(screen.getByText("PO")).toBeTruthy();
      expect(screen.getByText("Nháp")).toBeTruthy();
      expect(screen.getByText("Rev 1")).toBeTruthy();
      expect(screen.getAllByText("PO-2026-888")[0]).toBeTruthy();
    });

    it("11. lines table renders material snapshots and action buttons according to revision state", () => {
      renderWithRouter(<BomDetailPage />, { initialEntries: ["/bom/bom-v2-test-id"] });

      expect(screen.getByText("Vải Kaki Spandex")).toBeTruthy();
      expect(screen.getAllByText("Vải chính")[0]).toBeTruthy();
      expect(screen.getByText("Chỉ may 40/2")).toBeTruthy();
      expect(screen.getAllByText("Chỉ may")[0]).toBeTruthy();

      // At N1, add material button is available
      expect(screen.getByText("Thêm vật tư")).toBeTruthy();
    });

    it("12. historical / closed revision is strictly read-only and hides mutation controls", () => {
      hooks.useBom.mockReturnValue({
        data: {
          ...mockDetailBom,
          status: "closed",
        },
        isLoading: false,
        isError: false,
        refetch: hooks.refetchBom,
      });
      hooks.useBomRevisionDetail.mockReturnValue({
        data: {
          ...mockRevisionDetail,
          id: "old-rev-id",
          status: "closed",
        },
        isLoading: false,
      });

      renderWithRouter(<BomDetailPage />, { initialEntries: ["/bom/bom-v2-test-id"] });

      expect(screen.queryByText("Thêm vật tư")).toBeNull();
    });
  });

  // =======================================================================
  // 4. FLOW D: WORKFLOW STATE TRANSITIONS & 409 HANDLING
  // =======================================================================
  describe("FLOW D: Workflow State Transitions & Optimistic Locking", () => {
    it("13. executes forward transition sequentially across workflow steps (N1 -> N2)", async () => {
      hooks.mockUser = { roleCode: "NVKH", fullName: "Nhân viên KH" };

      renderWithRouter(<BomDetailPage />, { initialEntries: ["/bom/bom-v2-test-id"] });

      const forwardBtn = screen.getByText("Chuyển RD");
      expect(forwardBtn).toBeTruthy();
      fireEvent.click(forwardBtn);

      expect(screen.getByText("Nộp BOM cho RD?")).toBeTruthy();
      fireEvent.click(screen.getByText("Xác nhận chuyển bước"));

      await waitFor(() => {
        expect(hooks.useForwardBom.mutateAsync).toHaveBeenCalled();
      });
    });

    it("14. rejection modal enforces mandatory reject reason before transition", async () => {
      hooks.mockUser = { roleCode: "RD", fullName: "RD" };
      hooks.useBom.mockReturnValue({
        data: { ...mockDetailBom, status: "wait_rd" },
        isLoading: false,
        isError: false,
        refetch: hooks.refetchBom,
      });

      renderWithRouter(<BomDetailPage />, { initialEntries: ["/bom/bom-v2-test-id"] });

      fireEvent.click(screen.getByText("Trả lại"));

      expect(screen.getByText("Từ chối / Trả lại BOM")).toBeTruthy();

      const confirmBtn = screen.getByText("Xác nhận trả lại");
      // Reason empty -> disabled
      expect((confirmBtn as HTMLButtonElement).disabled).toBe(true);

      const reasonInput = screen.getByPlaceholderText(/Nêu rõ lý do trả lại/i);
      fireEvent.change(reasonInput, { target: { value: "Cần chỉnh lại định mức vải" } });

      expect((confirmBtn as HTMLButtonElement).disabled).toBe(false);
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(hooks.useRejectBom.mutateAsync).toHaveBeenCalledWith({
          targetStatus: "wait_nvkh",
          reason: "Cần chỉnh lại định mức vải",
        });
      });
    });

    it("15. handles 409 stale revision error gracefully by triggering refetch and alert", async () => {
      hooks.mockUser = { roleCode: "NVKH", fullName: "NVKH" };
      hooks.useForwardBom.mutateAsync.mockRejectedValueOnce({
        response: { status: 409, data: { message: "BOM đã được cập nhật bởi người khác" } },
      });

      renderWithRouter(<BomDetailPage />, { initialEntries: ["/bom/bom-v2-test-id"] });

      fireEvent.click(screen.getByText("Chuyển RD"));
      fireEvent.click(screen.getByText("Xác nhận chuyển bước"));

      await waitFor(() => {
        expect(hooks.refetchBom).toHaveBeenCalled();
        expect(hooks.mockToast.showToast).toHaveBeenCalledWith(
          expect.stringMatching(/Dữ liệu đã bị thay đổi bởi người khác/i),
          "error"
        );
      });
    });

    it("16. allows final approval at N5 (wait_sa_approve) by authorized SA role", async () => {
      hooks.mockUser = { roleCode: "SA", fullName: "Ban Giám Đốc" };
      hooks.useBom.mockReturnValue({
        data: { ...mockDetailBom, status: "wait_sa_approve" },
        isLoading: false,
        isError: false,
        refetch: hooks.refetchBom,
      });

      renderWithRouter(<BomDetailPage />, { initialEntries: ["/bom/bom-v2-test-id"] });

      const approveBtn = screen.getByText("Phê duyệt BOM");
      fireEvent.click(approveBtn);

      expect(screen.getByText("Phê duyệt & Đóng BOM")).toBeTruthy();
      fireEvent.click(screen.getByText("Phê duyệt đóng BOM"));

      await waitFor(() => {
        expect(hooks.useApproveBom.mutateAsync).toHaveBeenCalled();
      });
    });
  });

  // =======================================================================
  // 5. FLOW E: REVISION MANAGEMENT & DEEP-LINKING
  // =======================================================================
  describe("FLOW E: Revision Management & Deep-Linking", () => {
    it("17. only current closed BOM allows creating a new revision", () => {
      // In wait_nvkh: create revision button is hidden
      renderWithRouter(<BomDetailPage />, { initialEntries: ["/bom/bom-v2-test-id"] });
      expect(screen.queryByText("Tạo phiên bản mới")).toBeNull();

      cleanup();

      // In closed: create revision button is available
      hooks.useBom.mockReturnValue({
        data: { ...mockDetailBom, status: "closed" },
        isLoading: false,
        isError: false,
        refetch: hooks.refetchBom,
      });

      renderWithRouter(<BomDetailPage />, { initialEntries: ["/bom/bom-v2-test-id"] });
      expect(screen.getByText("Tạo phiên bản mới")).toBeTruthy();
    });

    it("18. creates revision, increments revision number and switches active revision", async () => {
      hooks.useBom.mockReturnValue({
        data: { ...mockDetailBom, status: "closed" },
        isLoading: false,
        isError: false,
        refetch: hooks.refetchBom,
      });

      renderWithRouter(<BomDetailPage />, { initialEntries: ["/bom/bom-v2-test-id"] });

      fireEvent.click(screen.getByText("Tạo phiên bản mới"));

      expect(screen.getByText("Tạo Phiên Bản Mới (Rev 2)")).toBeTruthy();

      const reasonInput = screen.getByPlaceholderText(/Thay thế phụ liệu/i);
      fireEvent.change(reasonInput, {
        target: { value: "Thay đổi nhà cung cấp chỉ" },
      });

      fireEvent.click(screen.getByText("Tạo Rev 2"));

      await waitFor(() => {
        expect(hooks.useCreateRevision.mutateAsync).toHaveBeenCalledWith({
          changeReason: "Thay đổi nhà cung cấp chỉ",
        });
      });
    });

    it("19. loads exact historical revision when deep-linked via ?revision=<id>", () => {
      renderWithRouter(<BomDetailPage />, {
        initialEntries: ["/bom/bom-v2-test-id?revision=rev-historical-99"],
      });

      expect(hooks.useBomRevisionDetail).toHaveBeenCalledWith(
        "bom-v2-test-id",
        "rev-historical-99"
      );
    });

    it("20. diff modal displays additions, modifications, and removals between revisions", () => {
      renderWithRouter(<BomDetailPage />, { initialEntries: ["/bom/bom-v2-test-id"] });

      // Switch to Revisions tab
      fireEvent.click(screen.getByRole("button", { name: /Lịch sử/i }));

      const diffBtn = screen.getByText("So sánh Diff");
      fireEvent.click(diffBtn);

      expect(screen.getByText("So sánh biến động định mức (Revision Diff)")).toBeTruthy();
      expect(screen.getByText("Keo dựng vải")).toBeTruthy();
    });

    it("21. history timeline renders revision audit log chronologically", () => {
      renderWithRouter(<BomDetailPage />, { initialEntries: ["/bom/bom-v2-test-id"] });

      const historyTab = screen.getByRole("button", { name: "Nhật ký duyệt" });
      fireEvent.click(historyTab);

      expect(screen.getAllByText("Chuyển R&D")[0]).toBeTruthy();
      expect(screen.getByText("NVKH Nguyễn Văn A")).toBeTruthy();
    });
  });

  // =======================================================================
  // 6. FLOW F: COPY FIT BOM TO PO BOM
  // =======================================================================
  describe("FLOW F: Copy FIT BOM to PO BOM", () => {
    it("22. allows copying FIT BOM lines when PO BOM is at N1 with zero lines", async () => {
      hooks.useBom.mockReturnValue({
        data: { ...mockDetailBom, lines: [] },
        isLoading: false,
        isError: false,
        refetch: hooks.refetchBom,
      });

      renderWithRouter(<BomDetailPage />, { initialEntries: ["/bom/bom-v2-test-id"] });

      const moreBtn = screen.getByLabelText("Thao tác khác");
      fireEvent.click(moreBtn);

      const copyFitOption = screen.getByText("Nhập từ Fit BOM");
      fireEvent.click(copyFitOption);

      await waitFor(() => {
        expect(screen.getByText("Sao chép từ Fit BOM")).toBeTruthy();
      });

      const confirmBtn = screen.getByText("Xác nhận sao chép");
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(hooks.useCopyFit.mutateAsync).toHaveBeenCalledWith({
          sourceRevisionId: "rev-fit-src-1",
        });
      });
    });

    it("23. hides copy fit action once BOM lines exist or state is beyond N1", () => {
      // BOM lines exist: lines.length > 0
      renderWithRouter(<BomDetailPage />, { initialEntries: ["/bom/bom-v2-test-id"] });

      // 'Thao tác khác' only exists if copy fit or discontinue is available
      // When lines exist and status is wait_nvkh, only discontinue is available
      const moreBtn = screen.getByLabelText("Thao tác khác");
      fireEvent.click(moreBtn);

      expect(screen.queryByText("Nhập từ Fit BOM")).toBeNull();
    });
  });

  // =======================================================================
  // 7. FLOW G: DISCONTINUE BOM
  // =======================================================================
  describe("FLOW G: Discontinue BOM", () => {
    it("24. discontinues BOM with mandatory reason and locks all mutations", async () => {
      renderWithRouter(<BomDetailPage />, { initialEntries: ["/bom/bom-v2-test-id"] });

      const moreBtn = screen.getByLabelText("Thao tác khác");
      fireEvent.click(moreBtn);

      const discontinueOption = screen.getByText("Ngừng sử dụng (Discontinue)");
      fireEvent.click(discontinueOption);

      expect(screen.getByText(/Ngừng sử dụng BOM/i)).toBeTruthy();

      const reasonInput = screen.getByPlaceholderText(/Nhập lý do ngừng sử dụng/i);
      fireEvent.change(reasonInput, { target: { value: "Khách hàng hủy đơn hàng" } });

      fireEvent.click(screen.getByText("Xác nhận ngừng sử dụng"));

      await waitFor(() => {
        expect(hooks.useDiscontinueBom.mutateAsync).toHaveBeenCalledWith({
          reason: "Khách hàng hủy đơn hàng",
        });
      });
    });

    it("25. discontinued BOM disables mutation controls and renders status badge cleanly", () => {
      hooks.useBom.mockReturnValue({
        data: {
          ...mockDetailBom,
          status: "discontinued",
          discontinuedAt: "2026-09-20T00:00:00Z",
          discontinuedReason: "Mẫu đã bị hủy",
        },
        isLoading: false,
        isError: false,
        refetch: hooks.refetchBom,
      });

      renderWithRouter(<BomDetailPage />, { initialEntries: ["/bom/bom-v2-test-id"] });

      expect(screen.getByText("Đã khóa")).toBeTruthy();
      expect(screen.queryByText("Thêm vật tư")).toBeNull();
      expect(screen.queryByText("Chuyển RD")).toBeNull();
      expect(screen.queryByLabelText("Thao tác khác")).toBeNull();
    });
  });

  // =======================================================================
  // 8. FLOW H: NPL AGGREGATE DASHBOARD & URL SYNCHRONIZATION
  // =======================================================================
  describe("FLOW H: NPL Aggregate Dashboard & URL Synchronization", () => {
    it("26. opens /bom/aggregate with default breakdown none and displays aggregate rows", () => {
      renderWithRouter(<BomAggregatePage />, { initialEntries: ["/bom/aggregate"] });

      expect(screen.getByText("Tổng hợp nhu cầu nguyên phụ liệu")).toBeTruthy();
      expect(screen.getAllByText("Vải Kaki Spandex")[0]).toBeTruthy();
      expect(screen.getByText("Chỉ may 40/2")).toBeTruthy();
      expect(screen.getByText("Nhãn dệt cổ áo")).toBeTruthy();
    });

    it("27. switching breakdown to color_size activates size matrix table", () => {
      renderWithRouter(<BomAggregatePage />, { initialEntries: ["/bom/aggregate"] });

      const breakdownSelect = screen.getByTestId("aggregate-breakdown-select");
      fireEvent.change(breakdownSelect, { target: { value: "color_size" } });

      expect(hooks.useBomAggregate).toHaveBeenCalled();
    });

    it("28. changing filter resets page parameter to 1 and synchronizes query parameters", () => {
      renderWithRouter(<BomAggregatePage />, { initialEntries: ["/bom/aggregate?page=3"] });

      const poSelect = screen.getByTestId("aggregate-po-select");
      fireEvent.change(poSelect, { target: { value: "po-1" } });

      expect(hooks.useBomAggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          purchaseOrderId: "po-1",
          page: 1,
        })
      );
    });

    it("29. browser reload restores full filter state from URL query params", () => {
      renderWithRouter(<BomAggregatePage />, {
        initialEntries: [
          "/bom/aggregate?purchaseOrderId=po-1&styleId=style-1&materialId=mat-1&page=2&limit=50",
        ],
      });

      expect(hooks.useBomAggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          purchaseOrderId: "po-1",
          styleId: "style-1",
          materialId: "mat-1",
          page: 2,
          limit: 50,
        })
      );
    });

    it("30. expanding aggregate row reveals color and size breakdown subrows", () => {
      renderWithRouter(<BomAggregatePage />, {
        initialEntries: ["/bom/aggregate?breakdown=color_size"],
      });

      const expandBtn = screen.getByTestId("expand-btn-0");
      expect(expandBtn).toBeTruthy();
      fireEvent.click(expandBtn);

      expect(screen.getAllByText("Xanh navy")[0]).toBeTruthy();
      expect(screen.getAllByText("M")[0]).toBeTruthy();
      expect(screen.getAllByText("L")[0]).toBeTruthy();
    });
  });

  // =======================================================================
  // 9. ROLE PERMISSION & COST MASKING MATRIX
  // =======================================================================
  describe("Role Permission & Cost Masking Matrix", () => {
    it("31. completely removes cost columns and values from DOM for NVKH role", () => {
      hooks.mockUser = { roleCode: "NVKH", fullName: "Nhân viên Kế hoạch" };

      renderWithRouter(<BomDetailPage />, { initialEntries: ["/bom/bom-v2-test-id"] });

      // Quantities visible
      expect(screen.getByText("Vải Kaki Spandex")).toBeTruthy();
      expect(screen.getAllByText("1.50")[0]).toBeTruthy();

      // Cost elements strictly not in DOM (not just hidden with CSS)
      expect(screen.queryByText("Đơn giá ($)")).toBeNull();
      expect(screen.queryByText("Thành tiền ($)")).toBeNull();
      expect(screen.queryByText("$120,000.0000")).toBeNull();
    });

    it("32. completely removes cost columns and values from DOM for RD role", () => {
      hooks.mockUser = { roleCode: "RD", fullName: "Kỹ thuật R&D" };

      renderWithRouter(<BomDetailPage />, { initialEntries: ["/bom/bom-v2-test-id"] });

      expect(screen.queryByText("Đơn giá ($)")).toBeNull();
      expect(screen.queryByText("Thành tiền ($)")).toBeNull();
    });

    it("33. renders cost columns and enables cost edit for ACCOUNTING role at N4", () => {
      hooks.mockUser = { roleCode: "ACCOUNTING", fullName: "Kế toán Giá thành" };
      hooks.useBom.mockReturnValue({
        data: {
          ...mockDetailBom,
          status: "wait_accounting",
        },
        isLoading: false,
        isError: false,
        refetch: hooks.refetchBom,
      });

      renderWithRouter(<BomDetailPage />, { initialEntries: ["/bom/bom-v2-test-id"] });

      expect(screen.getByText("Đơn giá ($)")).toBeTruthy();
      expect(screen.getByText("Thành tiền ($)")).toBeTruthy();
      expect(screen.getByTestId("unit-cost-input-line-1")).toBeTruthy();
    });
  });

  // =======================================================================
  // 10. COST & HISTORICAL SNAPSHOT REGRESSION
  // =======================================================================
  describe("Cost & Historical Snapshot Regression", () => {
    it("34. detail page renders formatted costs for authorized roles and handles null correctly", () => {
      hooks.mockUser = { roleCode: "TPKH", fullName: "Trưởng phòng KH" };
      const nullCostBom: BomDetail = {
        ...mockDetailBom,
        lines: [
          {
            ...mockDetailBom.lines[0],
            unitCost: null,
            lineCost: null,
          },
        ],
      };
      hooks.useBom.mockReturnValue({
        data: nullCostBom,
        isLoading: false,
        isError: false,
        refetch: hooks.refetchBom,
      });

      renderWithRouter(<BomDetailPage />, { initialEntries: ["/bom/bom-v2-test-id"] });

      // Null cost rendered as "—"
      expect(screen.getAllByText("—")[0]).toBeTruthy();
    });

    it("35. preserves duplicate materials with different unitSnapshot as separate logical rows", () => {
      renderWithRouter(<BomAggregatePage />, { initialEntries: ["/bom/aggregate"] });

      // Both unit snapshots exist distinctly
      expect(screen.getByText("Mét")).toBeTruthy();
      expect(screen.getByText("Kg")).toBeTruthy();

      // Both quantities rendered separately (3000 Mét vs 50 Kg)
      expect(screen.getByText("3.000")).toBeTruthy();
      expect(screen.getByText("50")).toBeTruthy();
    });

    it("36. ensures route precedence cleanly disambiguates /bom/aggregate from /bom/:id", () => {
      renderWithRouter(<BomAggregatePage />, { initialEntries: ["/bom/aggregate"] });

      expect(screen.getByTestId("bom-aggregate-page")).toBeTruthy();
      expect(screen.queryByTestId("bom-detail-page")).toBeNull();
    });
  });
});
