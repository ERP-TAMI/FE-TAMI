import { BrowserRouter } from "react-router-dom";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BomDetailPage from "./BomDetailPage";
import type { BomDetail, RevisionDetail } from "@/types/bom";

// SearchParams mock variable
let mockSearchParams = new URLSearchParams();
const mockSetSearchParams = vi.fn((params: unknown) => {
  mockSearchParams = new URLSearchParams(params as Record<string, string>);
});

// Hoisted mocks
const hooks = vi.hoisted(() => ({
  useBom: vi.fn(),
  useUpdateBom: { isPending: false, mutateAsync: vi.fn() },
  useBomRevisions: vi.fn(),
  useBomRevisionDetail: vi.fn(),
  useBomRevisionDiff: vi.fn(),
  useBomAggregate: vi.fn(),
  saveLines: { isPending: false, mutateAsync: vi.fn() },
  saveCosts: { isPending: false, mutateAsync: vi.fn() },
  promote: { isPending: false, mutateAsync: vi.fn() },
  useMaterials: vi.fn(),
  useMaterialGroups: vi.fn(),
  forwardBom: { isPending: false, mutateAsync: vi.fn() },
  rejectBom: { isPending: false, mutateAsync: vi.fn() },
  approveBom: { isPending: false, mutateAsync: vi.fn() },
  createRevision: { isPending: false, mutateAsync: vi.fn() },
  copyFit: { isPending: false, mutateAsync: vi.fn() },
  discontinueBom: { isPending: false, mutateAsync: vi.fn() },
  mockNavigate: vi.fn(),
  mockUser: { roleCode: "TPKH", fullName: "Trưởng phòng KH" } as {
    roleCode: string;
    fullName: string;
    purchaseOrderMode?: "READ_ONLY" | "FULL_ACCESS";
  },
  mockToast: {
    toast: null as { message: string; variant: "success" | "error" } | null,
    showToast: vi.fn(),
    hideToast: vi.fn(),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => hooks.mockNavigate,
    useParams: () => ({ id: "bom-test-uuid" }),
    useSearchParams: () => [mockSearchParams, mockSetSearchParams],
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
  useBom: () => hooks.useBom(),
  useUpdateBom: () => hooks.useUpdateBom,
  useBomRevisions: () => hooks.useBomRevisions(),
  useBomRevisionDetail: (bomId?: string, revisionId?: string) =>
    hooks.useBomRevisionDetail(bomId, revisionId),
  useBomRevisionDiff: () => hooks.useBomRevisionDiff(),
  useBomAggregate: () => hooks.useBomAggregate(),
  useSaveBomLines: () => hooks.saveLines,
  useSaveBomCosts: () => hooks.saveCosts,
  usePromoteBomRevision: () => hooks.promote,
  useForwardBom: () => hooks.forwardBom,
  useRejectBom: () => hooks.rejectBom,
  useApproveBom: () => hooks.approveBom,
  useCreateBomRevision: () => hooks.createRevision,
  useCopyFitToPoBom: () => hooks.copyFit,
  useDiscontinueBom: () => hooks.discontinueBom,
}));

vi.mock("@/components/features/audit/EntityHistoryButton", () => ({
  EntityHistoryButton: ({ title }: { title?: string }) => (
    <button type="button" data-testid="entity-history-button">
      {title}
    </button>
  ),
}));

vi.mock("@/hooks/useMaterials", () => ({
  useMaterials: () => hooks.useMaterials(),
}));

vi.mock("@/hooks/useMaterialGroups", () => ({
  useMaterialGroups: () => hooks.useMaterialGroups(),
}));

vi.mock("@/api/material.api", () => ({
  materialApi: {
    // materialApi.list() thật trả về { data, meta } (paginated), không phải
    // mảng trần — mock đúng hình dạng response.data thật để bắt được lỗi
    // "quên bóc .data" thay vì che nó đi.
    list: vi.fn().mockResolvedValue({
      data: [
        {
          id: "mat-1",
          materialCode: "VAI-001",
          materialName: "Vải Cotton 100%",
          materialGroupName: "Vải chính",
          defaultUnitName: "Mét",
        },
        {
          id: "mat-2",
          materialCode: "CUC-001",
          materialName: "Cúc áo nhựa 4 lỗ",
          materialGroupName: "Phụ liệu may",
          defaultUnitName: "Chiếc",
        },
      ],
      meta: { total: 2, page: 1, limit: 100, totalPages: 1 },
    }),
  },
}));

vi.mock("@/api/boms.api", () => ({
  bomsApi: {
    getBoms: vi.fn().mockImplementation((params?: Record<string, unknown>) =>
      Promise.resolve({
        data: [
          {
            id: "fit-src-uuid",
            bomCode: "BOM-FIT-ST101",
            type: "fit",
            style: {
              id: params?.style ? "style-2" : "style-1",
              styleCode: params?.style || "ST101",
              styleName: "Áo sơ mi Oxford",
            },
          },
        ],
      }),
    ),
    getBomById: vi.fn().mockResolvedValue({
      id: "fit-src-uuid",
      bomCode: "BOM-FIT-ST101",
      type: "fit",
      style: { id: "style-2", styleCode: "ST202", styleName: "Áo sơ mi Oxford" },
      currentRevision: { id: "rev-fit-src-1", revisionNo: 1, status: "closed" },
      lines: [{ id: "l-fit-1", materialNameSnapshot: "Vải Cotton", consumption: 1.5 }],
    }),
  },
}));

const mockFitBom: BomDetail = {
  id: "bom-test-uuid",
  bomCode: "BOM-FIT-ST101",
  type: "fit",
  status: "wait_nvkh",
  discontinuedAt: null,
  discontinuedReason: null,
  style: {
    id: "style-1",
    styleCode: "ST101",
    styleName: "Áo sơ mi Oxford",
  },
  purchaseOrder: null,
  product: null,
  currentRevision: {
    id: "rev-1",
    bomId: "bom-test-uuid",
    revisionNo: 1,
    status: "wait_nvkh",
    createdAt: "2026-09-18T00:00:00.000Z",
  },
  revisionNo: 1,
  costPerUnit: null,
  currentOrderQuantity: null,
  currentOrderCost: null,
  colorNameSnapshot: null,
  deadline: "2026-10-15T00:00:00.000Z",
  rdNote: "Yêu cầu may mẫu kỹ",
  createdAt: "2026-09-18T00:00:00.000Z",
  updatedAt: "2026-09-18T00:00:00.000Z",
  rowVersion: 1,
  lines: [
    {
      id: "line-1",
      revisionId: "rev-1",
      materialId: "mat-1",
      materialNameSnapshot: "Vải Cotton 100%",
      materialGroupId: "grp-1",
      materialGroupSnapshot: "Vải chính",
      unitId: "unit-1",
      unitSnapshot: "Mét",
      consumption: 1.5,
      unitCost: null,
      lineCost: null,
      note: "Thân trước và sau",
      orderIndex: 0,
      createdAt: "2026-09-18T00:00:00.000Z",
      updatedAt: "2026-09-18T00:00:00.000Z",
    },
    {
      id: "line-2",
      revisionId: "rev-1",
      materialId: "mat-2",
      materialNameSnapshot: "Cúc áo nhựa 4 lỗ",
      materialGroupId: "grp-2",
      materialGroupSnapshot: "Phụ liệu may",
      unitId: "unit-2",
      unitSnapshot: "Chiếc",
      consumption: 8,
      unitCost: null,
      lineCost: null,
      note: "Cúc nẹp và măng sét",
      orderIndex: 1,
      createdAt: "2026-09-18T00:00:00.000Z",
      updatedAt: "2026-09-18T00:00:00.000Z",
    },
  ],
};

const mockPoBom: BomDetail = {
  id: "bom-po-uuid",
  bomCode: "BOM-PO-2026-001",
  type: "po",
  status: "wait_accounting",
  discontinuedAt: null,
  discontinuedReason: null,
  style: {
    id: "style-2",
    styleCode: "ST202",
    styleName: "Váy Maxi Nữ",
  },
  purchaseOrder: {
    id: "po-1",
    poCode: "PO-2026-001",
  },
  product: {
    id: "prod-1",
    purchaseOrderId: "po-1",
    productCode: "PRD-202",
    productName: "Váy Maxi Họa Tiết",
    colors: ["Đỏ", "Xanh"],
  },
  currentRevision: {
    id: "rev-po-1",
    bomId: "bom-po-uuid",
    revisionNo: 1,
    status: "wait_accounting",
    createdAt: "2026-09-18T00:00:00.000Z",
  },
  revisionNo: 1,
  costPerUnit: 150000,
  currentOrderQuantity: 500,
  currentOrderCost: 75000000,
  colorNameSnapshot: "Đỏ",
  deadline: "2026-11-01T00:00:00.000Z",
  rdNote: "Kiểm tra kỹ nẹp váy",
  createdAt: "2026-09-18T00:00:00.000Z",
  updatedAt: "2026-09-18T00:00:00.000Z",
  rowVersion: 1,
  lines: [
    {
      id: "line-po-1",
      revisionId: "rev-po-1",
      materialId: "mat-1",
      materialNameSnapshot: "Vải Lụa Tơ Tằm",
      materialGroupId: "grp-1",
      materialGroupSnapshot: "Vải chính",
      unitId: "unit-1",
      unitSnapshot: "Mét",
      consumption: 2.5,
      unitCost: 60000,
      lineCost: 150000,
      note: "Thân váy",
      orderIndex: 0,
      createdAt: "2026-09-18T00:00:00.000Z",
      updatedAt: "2026-09-18T00:00:00.000Z",
    },
  ],
};

const mockHistoricalRevDetail: RevisionDetail = {
  id: "rev-hist-1",
  bomId: "bom-test-uuid",
  revisionNo: 1,
  status: "closed",
  changeReason: "Phiên bản khởi tạo đầu tiên",
  costPerUnit: 120000,
  isCurrent: false,
  createdAt: "2026-08-01T00:00:00.000Z",
  lines: [
    {
      id: "line-hist-1",
      revisionId: "rev-hist-1",
      materialId: "mat-1",
      materialNameSnapshot: "Vải Thô Cũ",
      materialGroupId: "grp-1",
      materialGroupSnapshot: "Vải chính",
      unitId: "unit-1",
      unitSnapshot: "Mét",
      consumption: 2.0,
      unitCost: 60000,
      lineCost: 120000,
      note: "Phiên bản cũ",
      orderIndex: 0,
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
    },
  ],
};

describe("BomDetailPage Component Tests (PR-09)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    hooks.mockUser = { roleCode: "NVKH", fullName: "Nhân viên Kế hoạch" };
    hooks.useBom.mockReturnValue({
      data: mockFitBom,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    hooks.useBomRevisions.mockReturnValue({
      data: [
        {
          id: "rev-1",
          bomId: "bom-test-uuid",
          revisionNo: 1,
          status: "wait_nvkh",
          isCurrent: true,
          createdAt: "2026-09-18T00:00:00.000Z",
        },
      ],
      isLoading: false,
    });
    hooks.useBomRevisionDetail.mockReturnValue({
      data: null,
      isLoading: false,
    });
    hooks.useBomRevisionDiff.mockReturnValue({
      data: {
        bomId: "fit-bom-1",
        targetRevisionId: "rev-1",
        targetRevisionNo: 1,
        baseRevisionId: "rev-0",
        baseRevisionNo: 0,
        totalAdded: 1,
        totalRemoved: 0,
        totalChanged: 1,
        totalUnchanged: 0,
        items: [
          {
            materialId: "mat-1",
            diffType: "ADDED",
            materialNameSnapshot: "Vải Lót Oxford",
            materialGroupSnapshot: "Vải lót",
            unitSnapshot: "Mét",
            oldLine: null,
            newLine: {
              consumption: 0.8,
              unitCost: 35000,
              lineCost: 28000,
              note: null,
              orderIndex: 0,
            },
            source: null,
            target: { consumption: 0.8, unitCost: 35000 },
          },
          {
            materialId: "mat-2",
            diffType: "CHANGED",
            materialNameSnapshot: "Cúc áo nhựa 4 lỗ",
            materialGroupSnapshot: "Phụ liệu may",
            unitSnapshot: "Chiếc",
            oldLine: { consumption: 6, unitCost: 500, lineCost: 3000, note: null, orderIndex: 1 },
            newLine: { consumption: 8, unitCost: 500, lineCost: 4000, note: null, orderIndex: 1 },
            source: { consumption: 6, unitCost: 500 },
            target: { consumption: 8, unitCost: 500 },
          },
        ],
      },
      isLoading: false,
    });
    hooks.useBomAggregate.mockReturnValue({
      data: [
        {
          materialId: "mat-1",
          materialNameSnapshot: "Vải Lụa Tơ Tằm",
          materialGroupSnapshot: "Vải chính",
          unitSnapshot: "Mét",
          totalRequiredQuantity: 1250,
          bomCount: 1,
          totalEstimatedCost: 75000000,
        },
      ],
      isLoading: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  // ==========================================
  // Category 1: Detail & Owner Information
  // ==========================================
  describe("Category 1: Detail & Owner Information", () => {
    it("1. renders loading skeleton when query is pending", () => {
      hooks.useBom.mockReturnValue({ data: null, isLoading: true });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.getByTestId("bom-detail-skeleton")).toBeTruthy();
    });

    it("2. renders error message and retry button when query fails", () => {
      hooks.useBom.mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error: { response: { data: { message: "Không thể kết nối máy chủ" } } },
        refetch: vi.fn(),
      });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.getByText("Không thể tải chi tiết BOM")).toBeTruthy();
      expect(screen.getByText("Không thể kết nối máy chủ")).toBeTruthy();
      expect(screen.getByText("Thử lại")).toBeTruthy();
    });

    it("3. renders not found state with back button on 404", () => {
      hooks.useBom.mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error: { response: { status: 404, data: { message: "BOM không tồn tại" } } },
        refetch: vi.fn(),
      });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.getByText("BOM không tồn tại")).toBeTruthy();
      const backBtn = screen.getByText("Về danh sách");
      fireEvent.click(backBtn);
      expect(hooks.mockNavigate).toHaveBeenCalledWith("/bom");
    });

    it("4. renders FIT BOM with Style information (Style Code, Style Name)", () => {
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.getByText(/NPL Fit: ST101/i)).toBeTruthy();
      expect(screen.getByText("Áo sơ mi Oxford")).toBeTruthy();
    });

    it("renders the breadcrumb and back link on the shared PageHeader (Dashboard > Quản lý Nguyên phụ liệu > code)", () => {
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.getByRole("link", { name: "Dashboard" })).toBeTruthy();
      expect(
        screen.getByRole("link", { name: "Quản lý Nguyên phụ liệu" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("link", { name: /Danh sách NPL/ }),
      ).toHaveProperty("href", expect.stringContaining("/bom"));
    });

    it("5. renders PO BOM with PO and Product information", () => {
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.getByText(/NPL PO:/i)).toBeTruthy();
      expect(screen.getByText("Váy Maxi Họa Tiết")).toBeTruthy();
      expect(screen.getAllByText("PO-2026-001").length).toBeGreaterThan(0);
    });

    it("6. renders PO BOM informational color chips", () => {
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.getByText(/Màu: Đỏ/i)).toBeTruthy();
    });

    it("falls back to the live PO product's colors and deadline when the BOM's own snapshot fields are null", () => {
      hooks.useBom.mockReturnValue({
        data: {
          ...mockPoBom,
          colorNameSnapshot: null,
          deadline: null,
          product: {
            ...mockPoBom.product!,
            colors: ["Ivory", "Black"],
            deadline: "2026-04-25",
          },
        },
        isLoading: false,
      });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.getByText(/Màu: Ivory, Black/i)).toBeTruthy();
      expect(screen.getByText(/25\/0?4\/2026/)).toBeTruthy();
    });

    it("7. renders Current Order Quantity with proper formatting", () => {
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.getAllByText(/500 SP|500 sản phẩm/i).length).toBeGreaterThan(0);
    });

    it("8. TPKH does not see cost figures (only Accounting and SA do)", () => {
      hooks.mockUser = { roleCode: "TPKH", fullName: "Trưởng phòng KH" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.queryByText("$150,000.0000")).toBeNull();
      expect(screen.queryByText("$75,000,000.0000")).toBeNull();
    });

    it("9. displays Cost Per Unit and Order Cost for Accounting role", () => {
      hooks.mockUser = { roleCode: "ACCOUNTING", fullName: "Kế toán viên" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.getAllByText("$150,000.0000").length).toBeGreaterThan(0);
    });

    it("10. displays Cost Per Unit and Order Cost for SA role", () => {
      hooks.mockUser = { roleCode: "SA", fullName: "Giám đốc điều hành" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.getAllByText("$150,000.0000").length).toBeGreaterThan(0);
    });

    it("hides PO BOM write actions for SA in READ_ONLY mode on direct detail", () => {
      hooks.mockUser = {
        roleCode: "SA",
        fullName: "Giám đốc điều hành",
        purchaseOrderMode: "READ_ONLY",
      };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });

      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );

      expect(screen.queryByText("Sửa Header")).toBeNull();
      expect(screen.queryByRole("button", { name: "Thao tác khác" })).toBeNull();
    });

    it("hides PO BOM approval for SA in READ_ONLY mode", () => {
      hooks.mockUser = {
        roleCode: "SA",
        fullName: "Giám đốc điều hành",
        purchaseOrderMode: "READ_ONLY",
      };
      hooks.useBom.mockReturnValue({
        data: { ...mockPoBom, status: "wait_sa_approve" },
        isLoading: false,
      });

      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );

      expect(screen.queryByText("Phê duyệt BOM")).toBeNull();
    });

    it.each([
      ["PO đã hủy", { purchaseOrder: { id: "po-1", poCode: "PO-2026-001", status: "cancelled" } }, "Đơn hàng PO đã Hủy"],
      ["PO đã khoá", { purchaseOrder: { id: "po-1", poCode: "PO-2026-001", status: "closed" } }, "Đơn hàng PO đã Khoá"],
      ["sản phẩm đã khoá", { product: { ...mockPoBom.product!, status: "closed" } }, "Sản phẩm đã Khoá"],
    ])("hides PO BOM write actions when %s, even for full-access users", (_label, patch, banner) => {
      hooks.mockUser = { roleCode: "SA", fullName: "Ban Giám Đốc", purchaseOrderMode: "FULL_ACCESS" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      const { unmount } = render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.getByText("Sửa Header")).toBeTruthy();
      unmount();

      hooks.useBom.mockReturnValue({ data: { ...mockPoBom, ...patch }, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.queryByText("Sửa Header")).toBeNull();
      expect(screen.getByText(new RegExp(banner))).toBeTruthy();
    });

    it("preserves SA Fit BOM permissions while PO mode is READ_ONLY", () => {
      hooks.mockUser = {
        roleCode: "SA",
        fullName: "Giám đốc điều hành",
        purchaseOrderMode: "READ_ONLY",
      };

      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );

      expect(screen.getByText("Sửa Header")).toBeTruthy();
    });

    it("11. masks Cost Per Unit and Order Cost for NVKH role", () => {
      hooks.mockUser = { roleCode: "NVKH", fullName: "Nhân viên Kế hoạch" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.getByText("Bảo mật chi phí")).toBeTruthy();
      expect(screen.queryByText("$150,000.0000")).toBeNull();
    });

    it("12. masks Cost Per Unit and Order Cost for RD role", () => {
      hooks.mockUser = { roleCode: "RD", fullName: "Kỹ sư R&D" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.getByText("Bảo mật chi phí")).toBeTruthy();
      expect(screen.queryByText("$150,000.0000")).toBeNull();
    });

    it("13. displays '$0.0000' correctly when cost is 0 (not masked or dashed)", () => {
      const zeroCostBom = { ...mockPoBom, costPerUnit: 0, currentOrderCost: 0 };
      hooks.mockUser = { roleCode: "SA", fullName: "SA" };
      hooks.useBom.mockReturnValue({ data: zeroCostBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.getAllByText("$0.0000").length).toBeGreaterThan(0);
    });

    it("14. displays '—' when cost is null", () => {
      const nullCostBom = { ...mockPoBom, costPerUnit: null, currentOrderCost: null };
      hooks.mockUser = { roleCode: "SA", fullName: "SA" };
      hooks.useBom.mockReturnValue({ data: nullCostBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.getAllByText(/Chờ kế toán tính giá|—/i).length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // Category 2: Header Editing & Discontinued State
  // ==========================================
  describe("Category 2: Header Editing & Discontinued State", () => {
    it("15. NVKH can open Header edit modal and sees deadline editable but rdNote readonly", () => {
      hooks.mockUser = { roleCode: "NVKH", fullName: "Nhân viên KH" };
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      const editHeaderBtn = screen.getByText("Sửa Header");
      fireEvent.click(editHeaderBtn);

      expect(screen.getByText("Chỉnh sửa thông tin Header")).toBeTruthy();
      expect(screen.getByText(/Hạn hoàn thành \(Deadline\)/i)).toBeTruthy();
      expect(
        screen.getByText(/Ghi chú kỹ thuật R&D \(Chỉ đọc với vai trò hiện tại\)/i),
      ).toBeTruthy();
    });

    it("16. RD can open Header edit modal and sees rdNote editable but deadline readonly", () => {
      hooks.mockUser = { roleCode: "RD", fullName: "Kỹ sư RD" };
      const waitRdBom = { ...mockFitBom, status: "wait_rd" as const };
      hooks.useBom.mockReturnValue({ data: waitRdBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      const editHeaderBtn = screen.getByText("Sửa Header");
      fireEvent.click(editHeaderBtn);

      expect(screen.getByText(/Hạn hoàn thành \(Chỉ đọc với vai trò hiện tại\)/i)).toBeTruthy();
      expect(screen.getByText(/Ghi chú kỹ thuật R&D$/i)).toBeTruthy();
    });

    it("17. TPKH can edit both deadline and rdNote and submit PATCH /boms/:id", async () => {
      hooks.mockUser = { roleCode: "TPKH", fullName: "Trưởng phòng KH" };
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      const editHeaderBtn = screen.getByText("Sửa Header");
      fireEvent.click(editHeaderBtn);

      expect(screen.getByText(/Hạn hoàn thành \(Deadline\)/i)).toBeTruthy();
      expect(screen.getByText(/Ghi chú kỹ thuật R&D$/i)).toBeTruthy();

      const saveBtn = screen.getByText("Lưu thay đổi");
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(hooks.useUpdateBom.mutateAsync).toHaveBeenCalled();
      });
    });

    it("18. SA can edit both deadline and rdNote", () => {
      hooks.mockUser = { roleCode: "SA", fullName: "Ban Giám Đốc" };
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      const editHeaderBtn = screen.getByText("Sửa Header");
      expect(editHeaderBtn).toBeTruthy();
    });

    it("19. Accounting cannot edit header fields (Sửa Header button hidden)", () => {
      hooks.mockUser = { roleCode: "ACCOUNTING", fullName: "Kế toán" };
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.queryByText("Sửa Header")).toBeNull();
    });

    it("20. Discontinued BOM displays discontinued banner with reason and timestamp", () => {
      const discBom: BomDetail = {
        ...mockFitBom,
        status: "discontinued",
        discontinuedAt: "2026-09-18T12:00:00.000Z",
        discontinuedReason: "Khách hàng hủy mã hàng",
      };
      hooks.useBom.mockReturnValue({ data: discBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.getByText(/Định mức này đã bị Ngừng sử dụng/i)).toBeTruthy();
      expect(screen.getByText(/Khách hàng hủy mã hàng/i)).toBeTruthy();
      expect(screen.getAllByText(/ĐÃ KHÓA/i).length).toBeGreaterThan(0);
    });

    it("21. Discontinued BOM suppresses header edit button and all mutations", () => {
      const discBom: BomDetail = {
        ...mockFitBom,
        status: "discontinued",
        discontinuedAt: "2026-09-18T12:00:00.000Z",
        discontinuedReason: "Hủy mã hàng",
      };
      hooks.useBom.mockReturnValue({ data: discBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.queryByText("Sửa Header")).toBeNull();
      expect(screen.queryByText("Thêm nguyên liệu")).toBeNull();
      expect(screen.queryByText("Chuyển bước")).toBeNull();
    });

    it("22. Closed BOM suppresses header edit button", () => {
      const closedBom: BomDetail = {
        ...mockFitBom,
        status: "closed",
      };
      hooks.useBom.mockReturnValue({ data: closedBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.queryByText("Sửa Header")).toBeNull();
    });
  });

  // ==========================================
  // Category 3: Material Lines Table & Snapshot Rendering
  // ==========================================
  describe("Category 3: Material Lines Table & Snapshot Rendering", () => {
    it("23. renders material lines with snapshot fields", () => {
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.getByText("Vải Cotton 100%")).toBeTruthy();
      expect(screen.getAllByText("Vải chính").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Mét").length).toBeGreaterThan(0);
      expect(screen.getByText("Cúc áo nhựa 4 lỗ")).toBeTruthy();
      expect(screen.getAllByText("Phụ liệu may").length).toBeGreaterThan(0);
    });

    it("exports the materials list to CSV when 'Xuất Excel' is clicked", () => {
      const createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
      const revokeObjectURL = vi.fn();
      vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });

      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );

      fireEvent.click(screen.getByRole("button", { name: /Xuất Excel/ }));

      expect(createObjectURL).toHaveBeenCalledTimes(1);
      const blob = createObjectURL.mock.calls[0][0] as Blob;
      expect(blob.type).toContain("text/csv");
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");

      vi.unstubAllGlobals();
    });

    it("does not show 'Xuất Excel' when there are no materials", () => {
      hooks.useBom.mockReturnValue({
        data: { ...mockFitBom, lines: [] },
        isLoading: false,
      });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.queryByRole("button", { name: /Xuất Excel/ })).toBeNull();
    });

    it("24. does not crash when optional snapshots are missing", () => {
      const lineWithoutGroup: BomDetail = {
        ...mockFitBom,
        lines: [
          {
            ...mockFitBom.lines![0],
            materialGroupSnapshot: null,
          },
        ],
      };
      hooks.useBom.mockReturnValue({ data: lineWithoutGroup, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.getByText("Vải Cotton 100%")).toBeTruthy();
    });

    it("25. shows empty state when BOM has no material lines", () => {
      const emptyBom: BomDetail = { ...mockFitBom, lines: [] };
      hooks.useBom.mockReturnValue({ data: emptyBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.getByText("Chưa có dòng nguyên phụ liệu nào")).toBeTruthy();
    });

    it("26. filters material lines by search keyword", () => {
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      const searchInput = screen.getByPlaceholderText(/Tìm kiếm theo tên vật tư/i);
      fireEvent.change(searchInput, { target: { value: "Cúc" } });

      expect(screen.getByText("Cúc áo nhựa 4 lỗ")).toBeTruthy();
      expect(screen.queryByText("Vải Cotton 100%")).toBeNull();
    });

    it("27. filters material lines by material group dropdown", () => {
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      const groupSelect = screen.getByDisplayValue(/Tất cả nhóm/i);
      fireEvent.change(groupSelect, { target: { value: "Phụ liệu may" } });

      expect(screen.getByText("Cúc áo nhựa 4 lỗ")).toBeTruthy();
      expect(screen.queryByText("Vải Cotton 100%")).toBeNull();
    });
  });

  // ==========================================
  // Category 4: Add Material Line (edit mode, saved in one request)
  // ==========================================
  describe("Category 4: Add Material Line", () => {
    const extraMaterial = {
      id: "mat-3",
      materialCode: "CHI-001",
      materialName: "Chỉ may polyester",
      materialGroupName: "Phụ liệu may",
      defaultUnitName: "Cuộn",
    };

    const renderPage = () =>
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );

    beforeEach(() => {
      hooks.saveLines.mutateAsync.mockResolvedValue({ rowVersion: 2, lines: [] });
      hooks.useMaterials.mockReturnValue({
        data: {
          data: [
            {
              id: "mat-1",
              materialCode: "VAI-001",
              materialName: "Vải Cotton 100%",
              materialGroupName: "Vải chính",
              defaultUnitName: "Mét",
            },
            extraMaterial,
          ],
          meta: { total: 2, page: 1, limit: 50, totalPages: 1 },
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });
      hooks.useMaterialGroups.mockReturnValue({ data: { data: [] } });
    });

    it("28. NVKH at wait_nvkh clicks 'Chỉnh sửa' to unlock 'Thêm vật tư'", () => {
      hooks.mockUser = { roleCode: "NVKH", fullName: "Nhân viên KH" };
      renderPage();
      expect(screen.queryByRole("button", { name: /Thêm vật tư/ })).toBeNull();

      fireEvent.click(screen.getByRole("button", { name: /Chỉnh sửa/ }));
      fireEvent.click(screen.getByRole("button", { name: /Thêm vật tư/ }));

      expect(screen.getByRole("dialog")).toBeTruthy();
    });

    it("29. TPKH can also edit and add materials at wait_nvkh", () => {
      hooks.mockUser = { roleCode: "TPKH", fullName: "Trưởng phòng KH" };
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /Chỉnh sửa/ }));
      expect(screen.getByRole("button", { name: /Thêm vật tư/ })).toBeTruthy();
    });

    it("30. the picker hides materials that are already in the BOM", () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /Chỉnh sửa/ }));
      fireEvent.click(screen.getByRole("button", { name: /Thêm vật tư/ }));

      const dialog = screen.getByRole("dialog");
      expect(dialog.textContent).toContain("CHI-001");
      expect(dialog.textContent).not.toContain("VAI-001");
    });

    it("31. adding a material only touches the draft table, nothing is sent until Lưu", async () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /Chỉnh sửa/ }));
      fireEvent.click(screen.getByRole("button", { name: /Thêm vật tư/ }));
      fireEvent.click(screen.getByLabelText("Chọn Chỉ may polyester"));
      fireEvent.click(screen.getByRole("button", { name: "Thêm 1 vật tư" }));

      expect(screen.getByText("Chỉ may polyester")).toBeTruthy();
      expect(screen.getByText("Mới")).toBeTruthy();
      expect(hooks.saveLines.mutateAsync).not.toHaveBeenCalled();
    });

    it("32. Lưu sends the whole table, new rows included, in a single request", async () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /Chỉnh sửa/ }));
      fireEvent.click(screen.getByRole("button", { name: /Thêm vật tư/ }));
      fireEvent.click(screen.getByLabelText("Chọn Chỉ may polyester"));
      fireEvent.click(screen.getByRole("button", { name: "Thêm 1 vật tư" }));

      fireEvent.change(screen.getByTestId(/^consumption-input-new-/), {
        target: { value: "2.5" },
      });
      fireEvent.click(screen.getByTestId("save-all-costs-floating-btn"));

      await waitFor(() => {
        expect(hooks.saveLines.mutateAsync).toHaveBeenCalledTimes(1);
      });
      const payload = hooks.saveLines.mutateAsync.mock.calls[0][0];
      expect(payload.expectedRowVersion).toBe(1);
      expect(payload.lines).toHaveLength(3);
      expect(payload.lines[0]).toMatchObject({ lineId: "line-1", consumption: 1.5 });
      expect(payload.lines[2]).toMatchObject({ materialId: "mat-3", consumption: 2.5 });
      expect(payload.lines[2].lineId).toBeUndefined();
    });

    it("33. Accounting and SA never see the edit button at wait_nvkh", () => {
      for (const roleCode of ["ACCOUNTING", "SA"]) {
        hooks.mockUser = { roleCode, fullName: roleCode };
        const { unmount } = renderPage();
        expect(screen.queryByRole("button", { name: /Chỉnh sửa/ })).toBeNull();
        unmount();
      }
    });

    it("34. Hủy throws the draft away without calling the API", () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /Chỉnh sửa/ }));
      fireEvent.click(screen.getByRole("button", { name: /Thêm vật tư/ }));
      fireEvent.click(screen.getByLabelText("Chọn Chỉ may polyester"));
      fireEvent.click(screen.getByRole("button", { name: "Thêm 1 vật tư" }));
      expect(screen.getByText("Chỉ may polyester")).toBeTruthy();

      fireEvent.click(screen.getAllByRole("button", { name: "Hủy" })[0]);

      expect(screen.queryByText("Chỉ may polyester")).toBeNull();
      expect(hooks.saveLines.mutateAsync).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // Category 5: Edit Line (whole-table edit mode)
  // ==========================================
  describe("Category 5: Edit Line", () => {
    const renderPage = () =>
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );

    beforeEach(() => {
      hooks.saveLines.mutateAsync.mockResolvedValue({ rowVersion: 2, lines: [] });
      hooks.saveCosts.mutateAsync.mockResolvedValue({ rowVersion: 2, lines: [] });
      hooks.useMaterials.mockReturnValue({ data: { data: [], meta: { total: 0 } } });
      hooks.useMaterialGroups.mockReturnValue({ data: { data: [] } });
    });

    it("35. NVKH edits consumption and note of several rows and saves them together", async () => {
      hooks.mockUser = { roleCode: "NVKH", fullName: "NVKH" };
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /Chỉnh sửa/ }));

      fireEvent.change(screen.getByTestId("consumption-input-line-1"), {
        target: { value: "2" },
      });
      fireEvent.change(screen.getByTestId("note-input-line-2"), {
        target: { value: "Cúc mới" },
      });
      fireEvent.click(screen.getByTestId("save-all-costs-floating-btn"));

      await waitFor(() => {
        expect(hooks.saveLines.mutateAsync).toHaveBeenCalledTimes(1);
      });
      expect(hooks.saveLines.mutateAsync).toHaveBeenCalledWith({
        lines: [
          { lineId: "line-1", consumption: 2, note: "Thân trước và sau" },
          { lineId: "line-2", consumption: 8, note: "Cúc mới" },
        ],
        expectedRowVersion: 1,
      });
    });

    it("36. the unit cost column is never rendered for technical roles", () => {
      hooks.mockUser = { roleCode: "NVKH", fullName: "NVKH" };
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /Chỉnh sửa/ }));
      expect(screen.queryByText(/Đơn giá \(\$\)/)).toBeNull();
      expect(screen.queryByTestId(/^unit-cost-input-/)).toBeNull();
    });

    it("37. TPKH at wait_tpkh_confirm can edit the table (N3 is editable)", () => {
      hooks.mockUser = { roleCode: "TPKH", fullName: "TPKH" };
      const waitTpkhBom = {
        ...mockFitBom,
        status: "wait_tpkh_confirm" as const,
        currentRevision: { ...mockFitBom.currentRevision!, status: "wait_tpkh_confirm" as const },
      };
      hooks.useBom.mockReturnValue({ data: waitTpkhBom, isLoading: false });
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /Chỉnh sửa/ }));
      expect(screen.getByTestId("consumption-input-line-1")).toBeTruthy();
    });

    it("38. Accounting at wait_accounting gets price inputs straight away, nothing else is editable", () => {
      hooks.mockUser = { roleCode: "ACCOUNTING", fullName: "Kế toán" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      renderPage();

      expect(screen.getByTestId("unit-cost-input-line-po-1")).toBeTruthy();
      expect(screen.queryByTestId(/^consumption-input-/)).toBeNull();
      expect(screen.queryByRole("button", { name: /Thêm vật tư/ })).toBeNull();
    });

    it("39. Accounting can save unitCost = 0 through the cost endpoint", async () => {
      hooks.mockUser = { roleCode: "ACCOUNTING", fullName: "Kế toán" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      renderPage();

      fireEvent.change(screen.getByTestId("unit-cost-input-line-po-1"), {
        target: { value: "0" },
      });
      fireEvent.click(screen.getByTestId("save-all-costs-floating-btn"));

      await waitFor(() => {
        expect(hooks.saveCosts.mutateAsync).toHaveBeenCalledWith({
          items: [{ lineId: "line-po-1", unitCost: 0 }],
          expectedRowVersion: 1,
        });
      });
      expect(hooks.saveLines.mutateAsync).not.toHaveBeenCalled();
    });

    it("40. Accounting entering a decimal unitCost submits a valid number", async () => {
      hooks.mockUser = { roleCode: "ACCOUNTING", fullName: "Kế toán" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      renderPage();

      fireEvent.change(screen.getByTestId("unit-cost-input-line-po-1"), {
        target: { value: "12500,5" },
      });
      fireEvent.click(screen.getByTestId("save-all-costs-floating-btn"));

      await waitFor(() => {
        expect(hooks.saveCosts.mutateAsync).toHaveBeenCalledWith({
          items: [{ lineId: "line-po-1", unitCost: 12500.5 }],
          expectedRowVersion: 1,
        });
      });
    });

    it("41. SA at wait_sa_approve has read-only access (no edit button)", () => {
      hooks.mockUser = { roleCode: "SA", fullName: "Ban Giám Đốc" };
      const waitSaBom = { ...mockPoBom, status: "wait_sa_approve" as const };
      hooks.useBom.mockReturnValue({ data: waitSaBom, isLoading: false });
      renderPage();
      expect(screen.queryByRole("button", { name: /Chỉnh sửa/ })).toBeNull();
      expect(screen.queryByTestId(/^unit-cost-input-/)).toBeNull();
    });

    it("41b. a failed save keeps the draft and shows the server message", async () => {
      hooks.mockUser = { roleCode: "NVKH", fullName: "NVKH" };
      hooks.saveLines.mutateAsync.mockRejectedValueOnce({
        response: { data: { message: "Vật tư này đã có ở dòng khác trong bảng." } },
      });
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /Chỉnh sửa/ }));
      fireEvent.change(screen.getByTestId("consumption-input-line-1"), {
        target: { value: "3" },
      });
      fireEvent.click(screen.getByTestId("save-all-costs-floating-btn"));

      await waitFor(() => {
        expect(hooks.mockToast.showToast).toHaveBeenCalledWith(
          "Vật tư này đã có ở dòng khác trong bảng.",
          "error",
        );
      });
      expect((screen.getByTestId("consumption-input-line-1") as HTMLInputElement).value).toBe("3");
    });
  });

  // ==========================================
  // Category 6: Delete & Reorder Lines (applied on Lưu)
  // ==========================================
  describe("Category 6: Delete & Reorder Lines", () => {
    const renderPage = () =>
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );

    beforeEach(() => {
      hooks.saveLines.mutateAsync.mockResolvedValue({ rowVersion: 2, lines: [] });
    });

    it("42. delete is only offered in edit mode and removes the row from the draft", () => {
      renderPage();
      expect(screen.queryByTitle("Xóa dòng vật tư")).toBeNull();

      fireEvent.click(screen.getByRole("button", { name: /Chỉnh sửa/ }));
      fireEvent.click(screen.getAllByTitle("Xóa dòng vật tư")[0]);

      expect(screen.queryByText("Vải Cotton 100%")).toBeNull();
      expect(hooks.saveLines.mutateAsync).not.toHaveBeenCalled();
    });

    it("43. Hủy brings a deleted row back without calling the API", () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /Chỉnh sửa/ }));
      fireEvent.click(screen.getAllByTitle("Xóa dòng vật tư")[0]);
      fireEvent.click(screen.getAllByRole("button", { name: "Hủy" })[0]);

      expect(screen.getByText("Vải Cotton 100%")).toBeTruthy();
      expect(hooks.saveLines.mutateAsync).not.toHaveBeenCalled();
    });

    it("44. Lưu omits the deleted line", async () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /Chỉnh sửa/ }));
      fireEvent.click(screen.getAllByTitle("Xóa dòng vật tư")[0]);
      fireEvent.click(screen.getByTestId("save-all-costs-floating-btn"));

      await waitFor(() => {
        expect(hooks.saveLines.mutateAsync).toHaveBeenCalledWith({
          lines: [{ lineId: "line-2", consumption: 8, note: "Cúc nẹp và măng sét" }],
          expectedRowVersion: 1,
        });
      });
    });

    it("45. Accounting cannot delete material lines (no edit mode for technical fields)", () => {
      hooks.mockUser = { roleCode: "ACCOUNTING", fullName: "Kế toán" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      renderPage();
      expect(screen.queryByTitle("Xóa dòng vật tư")).toBeNull();
    });

    it("46. SA cannot delete material lines", () => {
      hooks.mockUser = { roleCode: "SA", fullName: "Ban Giám Đốc" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      renderPage();
      expect(screen.queryByTitle("Xóa dòng vật tư")).toBeNull();
    });

    it("47. moving a line down is applied together with the next Lưu", async () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /Chỉnh sửa/ }));
      fireEvent.click(screen.getAllByTitle("Di chuyển xuống")[0]);
      expect(hooks.saveLines.mutateAsync).not.toHaveBeenCalled();

      fireEvent.click(screen.getByTestId("save-all-costs-floating-btn"));
      await waitFor(() => {
        expect(hooks.saveLines.mutateAsync).toHaveBeenCalledTimes(1);
      });
      const lines = hooks.saveLines.mutateAsync.mock.calls[0][0].lines;
      expect(lines.map((l: { lineId: string }) => l.lineId)).toEqual(["line-2", "line-1"]);
    });

    it("48. moving a line up works the same way", async () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /Chỉnh sửa/ }));
      fireEvent.click(screen.getAllByTitle("Di chuyển lên")[1]);
      fireEvent.click(screen.getByTestId("save-all-costs-floating-btn"));

      await waitFor(() => {
        expect(hooks.saveLines.mutateAsync).toHaveBeenCalledTimes(1);
      });
      const lines = hooks.saveLines.mutateAsync.mock.calls[0][0].lines;
      expect(lines.map((l: { lineId: string }) => l.lineId)).toEqual(["line-2", "line-1"]);
    });

    it("49. Accounting cannot reorder lines (buttons hidden)", () => {
      hooks.mockUser = { roleCode: "ACCOUNTING", fullName: "Kế toán" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      renderPage();
      expect(screen.queryByTitle("Di chuyển lên")).toBeNull();
    });

    it("50. SA cannot reorder lines (buttons hidden)", () => {
      hooks.mockUser = { roleCode: "SA", fullName: "Ban Giám Đốc" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      renderPage();
      expect(screen.queryByTitle("Di chuyển lên")).toBeNull();
    });
  });

  // ==========================================
  // Category 7: Workflow Transitions
  // ==========================================
  describe("Category 7: Workflow Transitions", () => {
    it("51. N1 (wait_nvkh): NVKH sees 'Chuyển RD' and submits forward", async () => {
      hooks.mockUser = { roleCode: "NVKH", fullName: "NVKH" };
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      const fwdBtn = screen.getByText("Chuyển RD");
      fireEvent.click(fwdBtn);

      expect(screen.getByText("Nộp BOM cho RD?")).toBeTruthy();
      fireEvent.click(screen.getByText("Xác nhận chuyển bước"));

      await waitFor(() => {
        expect(hooks.forwardBom.mutateAsync).toHaveBeenCalled();
      });
    });

    it("52. N2 (wait_rd): RD sees 'Chuyển TPKH' and submits forward", async () => {
      hooks.mockUser = { roleCode: "RD", fullName: "RD" };
      const waitRdBom = { ...mockFitBom, status: "wait_rd" as const };
      hooks.useBom.mockReturnValue({ data: waitRdBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      const fwdBtn = screen.getByText("Chuyển TPKH");
      fireEvent.click(fwdBtn);

      expect(screen.getByText("Nộp BOM cho TPKH?")).toBeTruthy();
      fireEvent.click(screen.getByText("Xác nhận chuyển bước"));

      await waitFor(() => {
        expect(hooks.forwardBom.mutateAsync).toHaveBeenCalled();
      });
    });

    it("53. N3 (wait_tpkh_confirm): TPKH sees 'Chuyển Kế toán' and submits forward", async () => {
      hooks.mockUser = { roleCode: "TPKH", fullName: "TPKH" };
      const waitTpkhBom = { ...mockFitBom, status: "wait_tpkh_confirm" as const };
      hooks.useBom.mockReturnValue({ data: waitTpkhBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      const fwdBtn = screen.getByText("Chuyển Kế toán");
      fireEvent.click(fwdBtn);

      expect(screen.getByText("Chuyển BOM sang Kế toán?")).toBeTruthy();
      fireEvent.click(screen.getByText("Xác nhận chuyển bước"));

      await waitFor(() => {
        expect(hooks.forwardBom.mutateAsync).toHaveBeenCalled();
      });
    });

    it("54. N4 (wait_accounting): Accounting sees 'Chuyển SA' and submits forward", async () => {
      hooks.mockUser = { roleCode: "ACCOUNTING", fullName: "Kế toán" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      const fwdBtn = screen.getByText("Chuyển SA");
      fireEvent.click(fwdBtn);

      expect(screen.getByText("Nộp BOM cho SA?")).toBeTruthy();
      fireEvent.click(screen.getByText("Xác nhận chuyển bước"));

      await waitFor(() => {
        expect(hooks.forwardBom.mutateAsync).toHaveBeenCalled();
      });
    });

    it("55. N5 (wait_sa_approve): SA sees 'Phê duyệt BOM' and submits approve", async () => {
      hooks.mockUser = { roleCode: "SA", fullName: "Ban Giám Đốc" };
      const waitSaBom = { ...mockPoBom, status: "wait_sa_approve" as const };
      hooks.useBom.mockReturnValue({ data: waitSaBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      const approveBtn = screen.getByText("Phê duyệt BOM");
      fireEvent.click(approveBtn);

      expect(screen.getByText("Phê duyệt & Đóng BOM")).toBeTruthy();
      fireEvent.click(screen.getByText("Phê duyệt đóng BOM"));

      await waitFor(() => {
        expect(hooks.approveBom.mutateAsync).toHaveBeenCalled();
      });
    });

    it("56. Reject from N2 (wait_rd) only allows target N1 (wait_nvkh)", () => {
      hooks.mockUser = { roleCode: "RD", fullName: "RD" };
      const waitRdBom = { ...mockFitBom, status: "wait_rd" as const };
      hooks.useBom.mockReturnValue({ data: waitRdBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      fireEvent.click(screen.getByText("Trả lại"));

      expect(screen.getByText("Từ chối / Trả lại BOM")).toBeTruthy();
      expect(screen.getByText("N1 - Trả về NVKH")).toBeTruthy();
      expect(screen.queryByText("N3 - Trả về TPKH")).toBeNull();
    });

    it("57. Reject from N3 (wait_tpkh_confirm) allows target N2 or N1", () => {
      hooks.mockUser = { roleCode: "TPKH", fullName: "TPKH" };
      const waitTpkhBom = { ...mockFitBom, status: "wait_tpkh_confirm" as const };
      hooks.useBom.mockReturnValue({ data: waitTpkhBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      fireEvent.click(screen.getByText("Trả lại"));

      expect(screen.getByText("N2 - Trả về R&D chỉnh định mức")).toBeTruthy();
      expect(screen.getByText("N1 - Trả về NVKH")).toBeTruthy();
    });

    it("58. Reject from N4 (wait_accounting) allows target N3 ONLY", () => {
      hooks.mockUser = { roleCode: "ACCOUNTING", fullName: "Kế toán" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      fireEvent.click(screen.getByText("Trả lại"));

      expect(screen.getByText("N3 - Trả về TPKH")).toBeTruthy();
      expect(screen.queryByText("N2 - Trả về R&D")).toBeNull();
      expect(screen.queryByText("N1 - Trả về NVKH")).toBeNull();
    });

    it("59. Reject from N5 (wait_sa_approve) allows targets N4, N3, N2, N1", () => {
      hooks.mockUser = { roleCode: "SA", fullName: "Ban Giám Đốc" };
      const waitSaBom = { ...mockPoBom, status: "wait_sa_approve" as const };
      hooks.useBom.mockReturnValue({ data: waitSaBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      fireEvent.click(screen.getByText("Trả lại"));

      expect(screen.getByText("N4 - Trả về Kế toán")).toBeTruthy();
      expect(screen.getByText("N3 - Trả về TPKH")).toBeTruthy();
      expect(screen.getByText("N2 - Trả về R&D")).toBeTruthy();
      expect(screen.getByText("N1 - Trả về NVKH")).toBeTruthy();
    });

    it("60. Reject modal disables submit when reason is empty or whitespace", () => {
      hooks.mockUser = { roleCode: "TPKH", fullName: "TPKH" };
      const waitTpkhBom = { ...mockFitBom, status: "wait_tpkh_confirm" as const };
      hooks.useBom.mockReturnValue({ data: waitTpkhBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      fireEvent.click(screen.getByText("Trả lại"));

      const submitBtn = screen.getByText("Xác nhận trả lại");
      expect((submitBtn as HTMLButtonElement).disabled).toBe(true);
    });

    it("61. Concurrency conflict (409) during forward displays error toast and refetches detail", async () => {
      hooks.mockUser = { roleCode: "NVKH", fullName: "NVKH" };
      const refetchSpy = vi.fn();
      hooks.useBom.mockReturnValue({
        data: mockFitBom,
        isLoading: false,
        refetch: refetchSpy,
      });
      hooks.forwardBom.mutateAsync.mockRejectedValueOnce({
        response: { status: 409, data: { message: "BOM đã được cập nhật bởi người khác" } },
      });

      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      fireEvent.click(screen.getByText("Chuyển RD"));
      fireEvent.click(screen.getByText("Xác nhận chuyển bước"));

      await waitFor(() => {
        expect(refetchSpy).toHaveBeenCalled();
        expect(hooks.mockToast.showToast).toHaveBeenCalledWith(
          expect.stringContaining("Dữ liệu đã bị thay đổi"),
          "error",
        );
      });
    });
  });

  // ==========================================
  // Category 8: Discontinue Action
  // ==========================================
  describe("Category 8: Discontinue Action", () => {
    it("62. TPKH can open Discontinue modal and submit with mandatory reason", async () => {
      hooks.mockUser = { roleCode: "TPKH", fullName: "TPKH" };
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      const discAction = screen.getByText("Ngừng sử dụng");
      fireEvent.click(discAction);

      expect(screen.getByText("Ngừng sử dụng NPL")).toBeTruthy();

      const reasonInput = screen.getByPlaceholderText(/Nhập lý do ngừng sử dụng/i);
      fireEvent.change(reasonInput, { target: { value: "Hủy mã hàng theo đề xuất" } });

      fireEvent.click(screen.getByText("Xác nhận ngừng sử dụng"));

      await waitFor(() => {
        expect(hooks.discontinueBom.mutateAsync).toHaveBeenCalledWith({
          reason: "Hủy mã hàng theo đề xuất",
          expectedRowVersion: 1,
        });
      });
    });

    it("63. SA can open Discontinue modal and submit with mandatory reason", () => {
      hooks.mockUser = { roleCode: "SA", fullName: "Ban Giám Đốc" };
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.getByText("Ngừng sử dụng")).toBeTruthy();
    });

    it("64. NVKH cannot discontinue (action hidden)", () => {
      hooks.mockUser = { roleCode: "NVKH", fullName: "NVKH" };
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.queryByLabelText("Thao tác khác")).toBeNull();
    });

    it("65. Accounting cannot discontinue (action hidden)", () => {
      hooks.mockUser = { roleCode: "ACCOUNTING", fullName: "Kế toán" };
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.queryByLabelText("Thao tác khác")).toBeNull();
    });

    it("66. Discontinue modal disables submit when reason is empty", () => {
      hooks.mockUser = { roleCode: "TPKH", fullName: "TPKH" };
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      fireEvent.click(screen.getByText("Ngừng sử dụng"));

      const submitBtn = screen.getByText("Xác nhận ngừng sử dụng");
      expect((submitBtn as HTMLButtonElement).disabled).toBe(true);
    });
  });

  // ==========================================
  // Category 9: Revision Management & Diff
  // ==========================================
  describe("Category 9: Revision Management & Diff", () => {
    it("67. shows revision selector in header with current revision", () => {
      hooks.useBomRevisions.mockReturnValue({
        data: [
          { id: "rev-2", revisionNo: 2, status: "wait_nvkh", isCurrent: true },
          { id: "rev-1", revisionNo: 1, status: "closed", isCurrent: false },
        ],
        isLoading: false,
      });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.getByText(/Phiên bản 2 \(Hiện hành\)/i)).toBeTruthy();
    });

    it("68. selecting a historical revision displays historical lines and 'Revision lịch sử' banner", () => {
      mockSearchParams = new URLSearchParams({ revision: "rev-hist-1" });
      hooks.useBomRevisionDetail.mockReturnValue({
        data: mockHistoricalRevDetail,
        isLoading: false,
      });

      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );

      expect(screen.getByText(/Revision lịch sử \(Chế độ chỉ đọc\)/i)).toBeTruthy();
      expect(screen.getByText("Vải Thô Cũ")).toBeTruthy();
    });

    it("69. in historical revision view, Add, Edit, Delete, Reorder, Forward, Reject buttons are hidden", () => {
      mockSearchParams = new URLSearchParams({ revision: "rev-hist-1" });
      hooks.useBomRevisionDetail.mockReturnValue({
        data: mockHistoricalRevDetail,
        isLoading: false,
      });

      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );

      expect(screen.queryByText("Thêm nguyên liệu")).toBeNull();
      expect(screen.queryByText("Chuyển bước")).toBeNull();
      expect(screen.queryByText("Trả lại")).toBeNull();
      expect(screen.queryByTitle("Chỉnh sửa dòng vật tư")).toBeNull();
      expect(screen.queryByTitle("Xóa dòng vật tư")).toBeNull();
    });

    it("70. Closed BOM shows 'Tạo phiên bản mới' button for authorized role", () => {
      const closedBom = { ...mockFitBom, status: "closed" as const };
      hooks.useBom.mockReturnValue({ data: closedBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.getByText("Tạo phiên bản mới")).toBeTruthy();
    });

    it("shows a compact completed summary instead of the full 5-step stepper once closed", () => {
      const closedBom = { ...mockFitBom, status: "closed" as const };
      hooks.useBom.mockReturnValue({ data: closedBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(
        screen.getByText("Đã hoàn tất toàn bộ quy trình (Khởi tạo → Phê duyệt)"),
      ).toBeTruthy();
      expect(screen.queryByText("Khởi tạo")).toBeNull();
      expect(screen.queryByText("Phê duyệt")).toBeNull();
    });

    it("71. Create Revision modal requires changeReason and calls POST /boms/:id/revisions", async () => {
      const closedBom = { ...mockFitBom, status: "closed" as const };
      hooks.useBom.mockReturnValue({ data: closedBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      fireEvent.click(screen.getByText("Tạo phiên bản mới"));

      expect(screen.getByText(/Tạo Phiên Bản Mới \(Rev 2\)/i)).toBeTruthy();

      const reasonInput = screen.getByPlaceholderText(/Thay thế phụ liệu cúc/i);
      fireEvent.change(reasonInput, { target: { value: "Thay đổi chất liệu ren" } });

      fireEvent.click(screen.getByText("Tạo Rev 2"));

      await waitFor(() => {
        expect(hooks.createRevision.mutateAsync).toHaveBeenCalledWith({
          changeReason: "Thay đổi chất liệu ren",
        });
      });
    });

    it("72. Revisions Tab lists all revisions with Diff button", () => {
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      fireEvent.click(screen.getByText(/Lịch sử phiên bản/i));

      expect(screen.getByText("Lịch sử các phiên bản định mức")).toBeTruthy();
      expect(screen.getByText("So sánh")).toBeTruthy();
    });

    it("73. history is the shared audit drawer: one button for the BOM, one for its lines", () => {
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      const titles = screen.getAllByTestId("entity-history-button").map((el) => el.textContent);
      expect(titles).toContain("Lịch sử: Thông tin BOM");
      expect(titles).toContain("Lịch sử: Định mức nguyên phụ liệu");
      expect(screen.queryByText(/Nhật ký duyệt/i)).toBeNull();
    });

    it("73b. SA can promote an older revision after giving a reason", async () => {
      hooks.mockUser = { roleCode: "SA", fullName: "Quản trị" };
      hooks.promote.mutateAsync.mockResolvedValue({});
      hooks.useBomRevisions.mockReturnValue({
        data: [
          { id: "rev-1", bomId: "bom-test-uuid", revisionNo: 2, status: "wait_nvkh", isCurrent: true },
          { id: "rev-0", bomId: "bom-test-uuid", revisionNo: 1, status: "closed", isCurrent: false },
        ],
        isLoading: false,
      });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      fireEvent.click(screen.getByText(/Lịch sử phiên bản/i));
      fireEvent.click(screen.getByRole("button", { name: /Đặt làm hiện hành/ }));

      const submit = screen.getByRole("button", { name: /Đặt Phiên bản 1 làm hiện hành/ });
      expect((submit as HTMLButtonElement).disabled).toBe(true);
      fireEvent.change(screen.getByPlaceholderText(/Phiên bản mới nhất sai định mức/), {
        target: { value: "Bản 2 sai" },
      });
      fireEvent.click(submit);

      await waitFor(() => {
        expect(hooks.promote.mutateAsync).toHaveBeenCalledWith({
          revisionId: "rev-0",
          payload: { reason: "Bản 2 sai" },
        });
      });
    });

    it("73c. only SA sees the promote button", () => {
      hooks.mockUser = { roleCode: "TPKH", fullName: "TPKH" };
      hooks.useBomRevisions.mockReturnValue({
        data: [
          { id: "rev-1", bomId: "bom-test-uuid", revisionNo: 2, status: "wait_nvkh", isCurrent: true },
          { id: "rev-0", bomId: "bom-test-uuid", revisionNo: 1, status: "closed", isCurrent: false },
        ],
        isLoading: false,
      });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      fireEvent.click(screen.getByText(/Lịch sử phiên bản/i));
      expect(screen.queryByRole("button", { name: /Đặt làm hiện hành/ })).toBeNull();
    });

    it("74. Revision Diff modal opens and displays ADDED and CHANGED items", () => {
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      fireEvent.click(screen.getByText(/Lịch sử phiên bản/i));
      fireEvent.click(screen.getByText("So sánh"));

      expect(screen.getByText("So sánh biến động định mức")).toBeTruthy();
      expect(screen.getByText("THÊM MỚI")).toBeTruthy();
      expect(screen.getByText("Vải Lót Oxford")).toBeTruthy();
      expect(screen.getByText("THAY ĐỔI")).toBeTruthy();
    });

    it("75. Revision Diff masks unit cost and line cost for technical roles (RD)", () => {
      hooks.mockUser = { roleCode: "RD", fullName: "RD" };
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      fireEvent.click(screen.getByText(/Lịch sử phiên bản/i));
      fireEvent.click(screen.getByText("So sánh"));

      expect(screen.queryByText(/35\.000/i)).toBeNull();
    });
  });

  // ==========================================
  // Category 10: Copy Fit -> PO BOM
  // ==========================================
  describe("Category 10: Copy Fit -> PO BOM", () => {
    it("76. PO BOM with 0 lines at N1 shows 'Nhập từ Fit BOM' in menu", () => {
      const emptyPoBom: BomDetail = {
        ...mockPoBom,
        status: "wait_nvkh",
        currentRevision: {
          id: "rev-po-1",
          bomId: "bom-po-uuid",
          revisionNo: 1,
          status: "wait_nvkh",
          createdAt: "2026-09-18T00:00:00.000Z",
        },
        lines: [],
      };
      hooks.useBom.mockReturnValue({ data: emptyPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.getByText("Nhập từ Fit BOM")).toBeTruthy();
    });

    it("77. PO BOM with existing lines hides Copy action", () => {
      const nonEmptyPoBom: BomDetail = {
        ...mockPoBom,
        status: "wait_nvkh",
        currentRevision: {
          id: "rev-po-1",
          bomId: "bom-po-uuid",
          revisionNo: 1,
          status: "wait_nvkh",
          createdAt: "2026-09-18T00:00:00.000Z",
        },
        lines: mockPoBom.lines,
      };
      hooks.useBom.mockReturnValue({ data: nonEmptyPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.queryByText("Nhập từ Fit BOM")).toBeNull();
    });

    it("shows a clear message instead of blank/loading state when the PO product isn't linked to any Fit style", () => {
      const unlinkedPoBom: BomDetail = {
        ...mockPoBom,
        status: "wait_nvkh",
        style: null,
        product: { ...mockPoBom.product!, sourceStyleId: null },
        currentRevision: {
          id: "rev-po-1",
          bomId: "bom-po-uuid",
          revisionNo: 1,
          status: "wait_nvkh",
          createdAt: "2026-09-18T00:00:00.000Z",
        },
        lines: [],
      };
      hooks.useBom.mockReturnValue({ data: unlinkedPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );

      fireEvent.click(screen.getByText("Nhập từ Fit BOM"));

      expect(
        screen.getByText(
          "Sản phẩm PO này chưa được liên kết với Mẫu Fit nào nên không thể sao chép định mức.",
        ),
      ).toBeTruthy();
    });

    it("78. FIT BOM hides Copy action", () => {
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.queryByText("Nhập từ Fit BOM")).toBeNull();
    });

    it("79. Copy Fit modal allows selecting source revision and calls copy mutation", async () => {
      const emptyPoBom: BomDetail = {
        ...mockPoBom,
        status: "wait_nvkh",
        currentRevision: {
          id: "rev-po-1",
          bomId: "bom-po-uuid",
          revisionNo: 1,
          status: "wait_nvkh",
          createdAt: "2026-09-18T00:00:00.000Z",
        },
        lines: [],
      };
      hooks.useBom.mockReturnValue({ data: emptyPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      fireEvent.click(screen.getByText("Nhập từ Fit BOM"));

      expect(screen.getByText("Sao chép từ Fit BOM")).toBeTruthy();

      await waitFor(() => {
        expect(screen.getByText(/Fit BOM: BOM-FIT-ST101/i)).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Xác nhận sao chép"));

      await waitFor(() => {
        expect(hooks.copyFit.mutateAsync).toHaveBeenCalledWith({
          sourceRevisionId: "rev-fit-src-1",
          expectedRowVersion: 1,
        });
      });
    });

    it("80. Copy Fit action is hidden when BOM is discontinued", () => {
      const discPoBom: BomDetail = {
        ...mockPoBom,
        status: "discontinued",
        discontinuedAt: "2026-09-18T00:00:00.000Z",
        lines: [],
      };
      hooks.useBom.mockReturnValue({ data: discPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );
      expect(screen.queryByText("Nhập từ Fit BOM")).toBeNull();
    });

    const multiLinePoBom: BomDetail = {
      ...mockPoBom,
      lines: [
        {
          id: "line-po-1",
          revisionId: "rev-po-1",
          materialId: "mat-1",
          materialNameSnapshot: "Vải Lụa Tơ Tằm",
          materialGroupId: "grp-1",
          materialGroupSnapshot: "Vải chính",
          unitId: "unit-1",
          unitSnapshot: "Mét",
          consumption: 2.5,
          unitCost: 0.1,
          lineCost: 0.25,
          orderIndex: 0,
          note: null,
          createdAt: "2026-09-18T00:00:00.000Z",
          updatedAt: "2026-09-18T00:00:00.000Z",
        },
        {
          id: "line-po-2",
          revisionId: "rev-po-1",
          materialId: "mat-2",
          materialNameSnapshot: "Cúc áo nhựa 4 lỗ",
          materialGroupId: "grp-2",
          materialGroupSnapshot: "Phụ liệu may",
          unitId: "unit-2",
          unitSnapshot: "Chiếc",
          consumption: 8,
          unitCost: 0.05,
          lineCost: 0.4,
          orderIndex: 1,
          note: null,
          createdAt: "2026-09-18T00:00:00.000Z",
          updatedAt: "2026-09-18T00:00:00.000Z",
        },
      ],
    };

    it("81. allows ACCOUNTING role to enter costs across multiple lines without auto-saving on blur, showing dirty count", async () => {
      hooks.mockUser = { roleCode: "ACCOUNTING", fullName: "Kế toán viên" };
      hooks.useBom.mockReturnValue({ data: multiLinePoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );

      const inputs = screen.getAllByTitle("Nhập đơn giá ($)");
      expect(inputs.length).toBe(2);

      // Enter cost for line 1 using comma separator
      fireEvent.change(inputs[0], { target: { value: "0,1360" } });
      fireEvent.blur(inputs[0]);

      // Verify NO mutation called on blur
      expect(hooks.saveCosts.mutateAsync).not.toHaveBeenCalled();

      // Enter cost for line 2 using dot separator
      fireEvent.change(inputs[1], { target: { value: "0.2400" } });
      fireEvent.blur(inputs[1]);

      // Both inputs retain their values, with comma normalized to dot
      expect((inputs[0] as HTMLInputElement).value).toBe("0.1360");
      expect((inputs[1] as HTMLInputElement).value).toBe("0.2400");

      // Verify dirty count and save draft button appear
      expect(screen.getAllByText(/2 thay đổi chưa lưu/i).length).toBeGreaterThan(0);
      expect(screen.getAllByRole("button", { name: /^Lưu$/ }).length).toBeGreaterThan(0);
    });

    it("82. clicking 'Lưu' saves all dirty prices in one request and shows a success toast", async () => {
      hooks.saveCosts.mutateAsync.mockResolvedValue({ rowVersion: 2, lines: [] });
      hooks.mockUser = { roleCode: "ACCOUNTING", fullName: "Kế toán viên" };
      hooks.useBom.mockReturnValue({ data: multiLinePoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );

      const inputs = screen.getAllByTitle("Nhập đơn giá ($)");
      fireEvent.change(inputs[0], { target: { value: "0,1360" } });
      fireEvent.change(inputs[1], { target: { value: "0.2400" } });

      fireEvent.click(screen.getByTestId("save-all-costs-floating-btn"));

      await waitFor(() => {
        expect(hooks.saveCosts.mutateAsync).toHaveBeenCalledTimes(1);
        expect(hooks.saveCosts.mutateAsync).toHaveBeenCalledWith({
          items: [
            { lineId: "line-po-1", unitCost: 0.136 },
            { lineId: "line-po-2", unitCost: 0.24 },
          ],
          expectedRowVersion: 1,
        });
        expect(hooks.mockToast.showToast).toHaveBeenCalledWith("Đã lưu định mức", "success");
      });
    });

    it("83. prevents forwarding when there are unsaved unit costs", async () => {
      hooks.mockUser = { roleCode: "ACCOUNTING", fullName: "Kế toán viên" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>,
      );

      const inputs = screen.getAllByTitle("Nhập đơn giá ($)");
      fireEvent.change(inputs[0], { target: { value: "0.1360" } });

      // Click Forward button in header
      const forwardBtn = screen.getByText("Chuyển SA");
      fireEvent.click(forwardBtn);

      expect(hooks.mockToast.showToast).toHaveBeenCalledWith(
        expect.stringContaining("chưa lưu"),
        "error",
      );
    });

    describe("Phase 11 — Verify Business Cost (Source of Truth)", () => {
      it("84. displays '—' when backend costPerUnit and currentOrderCost are null", () => {
        hooks.mockUser = { roleCode: "ACCOUNTING", fullName: "Kế toán viên" };
        hooks.useBom.mockReturnValue({
          data: {
            ...mockPoBom,
            costPerUnit: null,
            currentOrderCost: null,
            lines: [
              {
                ...mockPoBom.lines[0],
                lineCost: null,
              },
            ],
          },
          isLoading: false,
        });
        render(
          <BrowserRouter>
            <BomDetailPage />
          </BrowserRouter>,
        );
        const dashes = screen.getAllByText("—");
        expect(dashes.length).toBeGreaterThanOrEqual(1);
      });

      it("85. displays '$0.0000' when backend costPerUnit and currentOrderCost are 0", () => {
        hooks.mockUser = { roleCode: "ACCOUNTING", fullName: "Kế toán viên" };
        hooks.useBom.mockReturnValue({
          data: {
            ...mockPoBom,
            costPerUnit: 0,
            currentOrderCost: 0,
            lines: [
              {
                ...mockPoBom.lines[0],
                lineCost: 0,
              },
            ],
          },
          isLoading: false,
        });
        render(
          <BrowserRouter>
            <BomDetailPage />
          </BrowserRouter>,
        );
        expect(screen.getAllByText("$0.0000").length).toBeGreaterThanOrEqual(1);
      });

      it("86. displays backend lineCost in clean state even if it differs from FE arithmetic", () => {
        hooks.mockUser = { roleCode: "ACCOUNTING", fullName: "Kế toán viên" };
        const customCostBom = {
          ...mockPoBom,
          costPerUnit: 15.75,
          currentOrderCost: 7875,
          lines: [
            {
              ...mockPoBom.lines[0],
              consumption: 2,
              unitCost: 10,
              lineCost: 15.75,
            },
          ],
        };
        hooks.useBom.mockReturnValue({ data: customCostBom, isLoading: false });
        render(
          <BrowserRouter>
            <BomDetailPage />
          </BrowserRouter>,
        );
        // Clean state (dirtyCount === 0): MUST display backend lineCost $15.7500, NOT $20.0000
        expect(screen.getAllByText("$15.7500").length).toBeGreaterThanOrEqual(1);
        expect(screen.queryByText("$20.0000")).toBeNull();
      });

      it("87. switches to preview with 'Dự kiến' when dirtyCount > 0 without persisting to backend", () => {
        hooks.mockUser = { roleCode: "ACCOUNTING", fullName: "Kế toán viên" };
        hooks.useBom.mockReturnValue({
          data: {
            ...mockPoBom,
            costPerUnit: 100,
            lines: [
              {
                ...mockPoBom.lines[0],
                consumption: 2,
                unitCost: 50,
                lineCost: 100,
              },
            ],
          },
          isLoading: false,
        });
        render(
          <BrowserRouter>
            <BomDetailPage />
          </BrowserRouter>,
        );
        // Initially clean state: no "Dự kiến" badges
        expect(screen.queryByText("Dự kiến")).toBeNull();

        // Change unit cost
        const inputs = screen.getAllByTitle("Nhập đơn giá ($)");
        fireEvent.change(inputs[0], { target: { value: "80" } });

        // Now dirty: preview shows and contains "Dự kiến"
        expect(screen.getAllByText("Dự kiến").length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
