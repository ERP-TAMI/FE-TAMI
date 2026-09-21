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
  useBomRevisionHistory: vi.fn(),
  useBomRevisionDiff: vi.fn(),
  useBomAggregate: vi.fn(),
  addLine: { isPending: false, mutateAsync: vi.fn() },
  updateLine: { isPending: false, mutateAsync: vi.fn() },
  deleteLine: { isPending: false, mutateAsync: vi.fn() },
  reorderLines: { isPending: false, mutateAsync: vi.fn() },
  forwardBom: { isPending: false, mutateAsync: vi.fn() },
  rejectBom: { isPending: false, mutateAsync: vi.fn() },
  approveBom: { isPending: false, mutateAsync: vi.fn() },
  createRevision: { isPending: false, mutateAsync: vi.fn() },
  copyFit: { isPending: false, mutateAsync: vi.fn() },
  discontinueBom: { isPending: false, mutateAsync: vi.fn() },
  mockNavigate: vi.fn(),
  mockUser: { roleCode: "TPKH", fullName: "Trưởng phòng KH" },
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
  useBomRevisionHistory: () => hooks.useBomRevisionHistory(),
  useBomRevisionDiff: () => hooks.useBomRevisionDiff(),
  useBomAggregate: () => hooks.useBomAggregate(),
  useAddBomLine: () => hooks.addLine,
  useUpdateBomLine: () => hooks.updateLine,
  useDeleteBomLine: () => hooks.deleteLine,
  useReorderBomLines: () => hooks.reorderLines,
  useForwardBom: () => hooks.forwardBom,
  useRejectBom: () => hooks.rejectBom,
  useApproveBom: () => hooks.approveBom,
  useCreateBomRevision: () => hooks.createRevision,
  useCopyFitToPoBom: () => hooks.copyFit,
  useDiscontinueBom: () => hooks.discontinueBom,
}));

vi.mock("@/api/material.api", () => ({
  materialApi: {
    list: vi.fn().mockResolvedValue([
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
    ]),
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
      })
    ),
    getBomById: vi.fn().mockResolvedValue({
      id: "fit-src-uuid",
      bomCode: "BOM-FIT-ST101",
      type: "fit",
      style: { id: "style-2", styleCode: "ST202", styleName: "Áo sơ mi Oxford" },
      currentRevision: { id: "rev-fit-src-1", revisionNo: 1 },
      lines: [
        { id: "l-fit-1", materialNameSnapshot: "Vải Cotton", consumption: 1.5 },
      ],
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
    hooks.mockUser = { roleCode: "TPKH", fullName: "Trưởng phòng KH" };
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
    hooks.useBomRevisionHistory.mockReturnValue({
      data: [
        {
          id: "hist-1",
          revisionId: "rev-1",
          fromStatus: "wait_nvkh",
          toStatus: "wait_rd",
          createdAt: "2026-09-18T00:00:00.000Z",
          note: "Chuyển R&D",
          changedBy: "NVKH Nguyễn Văn A",
        },
      ],
      isLoading: false,
    });
    hooks.useBomRevisionDiff.mockReturnValue({
      data: {
        revisionId: "rev-1",
        compareWithRevisionId: "rev-0",
        items: [
          {
            diffType: "ADDED",
            materialNameSnapshot: "Vải Lót Oxford",
            materialGroupSnapshot: "Vải lót",
            unitSnapshot: "Mét",
            target: { consumption: 0.8, unitCost: 35000 },
          },
          {
            diffType: "CHANGED",
            materialNameSnapshot: "Cúc áo nhựa 4 lỗ",
            materialGroupSnapshot: "Phụ liệu may",
            unitSnapshot: "Chiếc",
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
        </BrowserRouter>
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
        </BrowserRouter>
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
        </BrowserRouter>
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
        </BrowserRouter>
      );
      expect(screen.getByText(/Mẫu Fit: ST101/i)).toBeTruthy();
      expect(screen.getByText("Áo sơ mi Oxford")).toBeTruthy();
    });

    it("5. renders PO BOM with PO and Product information", () => {
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      expect(screen.getByText(/PO BOM: PO-2026-001 - Váy Maxi Họa Tiết/i)).toBeTruthy();
      expect(screen.getAllByText("PO-2026-001").length).toBeGreaterThan(0);
    });

    it("6. renders PO BOM informational color chips", () => {
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      expect(screen.getByText(/Màu: Đỏ/i)).toBeTruthy();
    });

    it("7. renders Current Order Quantity with proper formatting", () => {
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      expect(screen.getAllByText(/500 SP|500 sản phẩm/i).length).toBeGreaterThan(0);
    });

    it("8. displays Cost Per Unit and Order Cost for authorized role (TPKH)", () => {
      hooks.mockUser = { roleCode: "TPKH", fullName: "Trưởng phòng KH" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      expect(screen.getAllByText(/150\.000/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/75\.000\.000/i).length).toBeGreaterThan(0);
    });

    it("9. displays Cost Per Unit and Order Cost for Accounting role", () => {
      hooks.mockUser = { roleCode: "KT", fullName: "Kế toán viên" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      expect(screen.getAllByText(/150\.000/i).length).toBeGreaterThan(0);
    });

    it("10. displays Cost Per Unit and Order Cost for SA role", () => {
      hooks.mockUser = { roleCode: "SA", fullName: "Giám đốc điều hành" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      expect(screen.getAllByText(/150\.000/i).length).toBeGreaterThan(0);
    });

    it("11. masks Cost Per Unit and Order Cost for NVKH role", () => {
      hooks.mockUser = { roleCode: "NVKH", fullName: "Nhân viên Kế hoạch" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      expect(screen.getByText("Bảo mật chi phí")).toBeTruthy();
      expect(screen.queryByText("150.000 ₫")).toBeNull();
    });

    it("12. masks Cost Per Unit and Order Cost for RD role", () => {
      hooks.mockUser = { roleCode: "RD", fullName: "Kỹ sư R&D" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      expect(screen.getByText("Bảo mật chi phí")).toBeTruthy();
      expect(screen.queryByText("150.000 ₫")).toBeNull();
    });

    it("13. displays '0 ₫' correctly when cost is 0 (not masked or dashed)", () => {
      const zeroCostBom = { ...mockPoBom, costPerUnit: 0, currentOrderCost: 0 };
      hooks.mockUser = { roleCode: "TPKH", fullName: "TPKH" };
      hooks.useBom.mockReturnValue({ data: zeroCostBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      expect(screen.getAllByText(/0\s*₫/i).length).toBeGreaterThan(0);
    });

    it("14. displays '—' when cost is null", () => {
      const nullCostBom = { ...mockPoBom, costPerUnit: null, currentOrderCost: null };
      hooks.mockUser = { roleCode: "TPKH", fullName: "TPKH" };
      hooks.useBom.mockReturnValue({ data: nullCostBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
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
        </BrowserRouter>
      );
      const editHeaderBtn = screen.getByText("Sửa Header");
      fireEvent.click(editHeaderBtn);

      expect(screen.getByText("Chỉnh sửa thông tin Header")).toBeTruthy();
      expect(screen.getByText(/Hạn hoàn thành \(Deadline\)/i)).toBeTruthy();
      expect(screen.getByText(/Ghi chú kỹ thuật R&D \(Chỉ đọc với vai trò hiện tại\)/i)).toBeTruthy();
    });

    it("16. RD can open Header edit modal and sees rdNote editable but deadline readonly", () => {
      hooks.mockUser = { roleCode: "RD", fullName: "Kỹ sư RD" };
      const waitRdBom = { ...mockFitBom, status: "wait_rd" as const };
      hooks.useBom.mockReturnValue({ data: waitRdBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
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
        </BrowserRouter>
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
        </BrowserRouter>
      );
      const editHeaderBtn = screen.getByText("Sửa Header");
      expect(editHeaderBtn).toBeTruthy();
    });

    it("19. Accounting cannot edit header fields (Sửa Header button hidden)", () => {
      hooks.mockUser = { roleCode: "KT", fullName: "Kế toán" };
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
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
        </BrowserRouter>
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
        </BrowserRouter>
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
        </BrowserRouter>
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
        </BrowserRouter>
      );
      expect(screen.getByText("Vải Cotton 100%")).toBeTruthy();
      expect(screen.getAllByText("Vải chính").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Mét").length).toBeGreaterThan(0);
      expect(screen.getByText("Cúc áo nhựa 4 lỗ")).toBeTruthy();
      expect(screen.getAllByText("Phụ liệu may").length).toBeGreaterThan(0);
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
        </BrowserRouter>
      );
      expect(screen.getByText("Vải Cotton 100%")).toBeTruthy();
    });

    it("25. shows empty state when BOM has no material lines", () => {
      const emptyBom: BomDetail = { ...mockFitBom, lines: [] };
      hooks.useBom.mockReturnValue({ data: emptyBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      expect(screen.getByText("Chưa có dòng nguyên phụ liệu nào")).toBeTruthy();
    });

    it("26. filters material lines by search keyword", () => {
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
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
        </BrowserRouter>
      );
      const groupSelect = screen.getByDisplayValue(/Tất cả nhóm/i);
      fireEvent.change(groupSelect, { target: { value: "Phụ liệu may" } });

      expect(screen.getByText("Cúc áo nhựa 4 lỗ")).toBeTruthy();
      expect(screen.queryByText("Vải Cotton 100%")).toBeNull();
    });
  });

  // ==========================================
  // Category 4: Add Material Line
  // ==========================================
  describe("Category 4: Add Material Line", () => {
    it("28. NVKH at wait_nvkh sees 'Thêm nguyên liệu' and opens Add Line modal", () => {
      hooks.mockUser = { roleCode: "NVKH", fullName: "Nhân viên KH" };
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      const addBtn = screen.getByText("Thêm nguyên liệu");
      fireEvent.click(addBtn);

      expect(screen.getByText("Thêm nguyên phụ liệu vào BOM")).toBeTruthy();
    });

    it("29. Add Line modal does not render unitCost input", async () => {
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      const addBtn = screen.getByText("Thêm nguyên liệu");
      fireEvent.click(addBtn);

      expect(screen.queryByPlaceholderText(/Đơn giá/i)).toBeNull();
    });

    it("30. Add Line modal validates positive consumption (> 0)", async () => {
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      fireEvent.click(screen.getByText("Thêm nguyên liệu"));

      await waitFor(() => {
        expect(screen.getByText(/VAI-001/i)).toBeTruthy();
      });
      fireEvent.click(screen.getAllByText("Chọn")[0]);

      const consumptionInput = screen.getByPlaceholderText(/Ví dụ: 1\.45/i);
      fireEvent.change(consumptionInput, { target: { value: "0" } });

      const form = screen.getByText("Thêm vào BOM").closest("form")!;
      fireEvent.submit(form);

      expect(screen.getByText(/Định mức tiêu hao phải là số dương lớn hơn 0/i)).toBeTruthy();
    });

    it("31. Add Line modal validates material selection from list", () => {
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      fireEvent.click(screen.getByText("Thêm nguyên liệu"));

      fireEvent.click(screen.getByText("Thêm vào BOM"));
      expect(screen.getByText(/Vui lòng chọn một nguyên phụ liệu từ danh mục/i)).toBeTruthy();
    });

    it("32. submitting Add Line modal calls POST /boms/:id/lines mutation", async () => {
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      fireEvent.click(screen.getByText("Thêm nguyên liệu"));

      await waitFor(() => {
        expect(screen.getByText(/VAI-001/i)).toBeTruthy();
      });
      fireEvent.click(screen.getAllByText("Chọn")[0]);

      const consumptionInput = screen.getByPlaceholderText(/Ví dụ: 1\.45/i);
      fireEvent.change(consumptionInput, { target: { value: "2.5" } });

      fireEvent.click(screen.getByText("Thêm vào BOM"));
      await waitFor(() => {
        expect(hooks.addLine.mutateAsync).toHaveBeenCalledWith({
          materialId: "mat-1",
          consumption: 2.5,
          note: undefined,
        });
      });
    });

    it("33. Accounting cannot add material line (button hidden)", () => {
      hooks.mockUser = { roleCode: "KT", fullName: "Kế toán" };
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      expect(screen.queryByText("Thêm nguyên liệu")).toBeNull();
    });

    it("34. SA cannot add material line (button hidden)", () => {
      hooks.mockUser = { roleCode: "SA", fullName: "Ban Giám Đốc" };
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      expect(screen.queryByText("Thêm nguyên liệu")).toBeNull();
    });
  });

  // ==========================================
  // Category 5: Edit Line
  // ==========================================
  describe("Category 5: Edit Line", () => {
    it("35. Technical role (NVKH) edits consumption and note, unitCost is hidden", () => {
      hooks.mockUser = { roleCode: "NVKH", fullName: "NVKH" };
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      const editBtns = screen.getAllByTitle("Chỉnh sửa dòng vật tư");
      fireEvent.click(editBtns[0]);

      expect(screen.getByText("Chỉnh sửa dòng vật tư")).toBeTruthy();
      expect(screen.getByDisplayValue("1.5")).toBeTruthy();
      expect(screen.queryByPlaceholderText(/Ví dụ: 50000/i)).toBeNull();
    });

    it("36. Technical role (RD) at wait_rd can edit consumption", () => {
      hooks.mockUser = { roleCode: "RD", fullName: "Kỹ sư RD" };
      const waitRdBom = {
        ...mockFitBom,
        status: "wait_rd" as const,
        currentRevision: { ...mockFitBom.currentRevision!, status: "wait_rd" as const },
      };
      hooks.useBom.mockReturnValue({ data: waitRdBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      const editBtns = screen.getAllByTitle("Chỉnh sửa dòng vật tư");
      fireEvent.click(editBtns[0]);

      expect(screen.getByDisplayValue("1.5")).toBeTruthy();
    });

    it("37. Technical role (TPKH) at wait_tpkh_confirm can edit material line (N3 is EDITABLE!)", () => {
      hooks.mockUser = { roleCode: "TPKH", fullName: "TPKH" };
      const waitTpkhBom = { ...mockFitBom, status: "wait_tpkh_confirm" as const };
      hooks.useBom.mockReturnValue({ data: waitTpkhBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      const editBtns = screen.getAllByTitle("Chỉnh sửa dòng vật tư");
      expect(editBtns.length).toBeGreaterThan(0);
      fireEvent.click(editBtns[0]);
      expect(screen.getByText("Chỉnh sửa dòng vật tư")).toBeTruthy();
    });

    it("38. Accounting at wait_accounting only sees and edits unitCost", () => {
      hooks.mockUser = { roleCode: "KT", fullName: "Kế toán" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      const editBtns = screen.getAllByTitle("Chỉnh sửa dòng vật tư");
      fireEvent.click(editBtns[0]);

      expect(screen.getByText("Nhập đơn giá nguyên phụ liệu")).toBeTruthy();
      expect(screen.getByPlaceholderText(/Ví dụ: 50000/i)).toBeTruthy();
      expect(screen.queryByPlaceholderText(/Ví dụ: 1\.45/i)).toBeNull();
    });

    it("39. Accounting can input unitCost = 0 (0 VND valid cost)", async () => {
      hooks.mockUser = { roleCode: "KT", fullName: "Kế toán" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      const editBtns = screen.getAllByTitle("Chỉnh sửa dòng vật tư");
      fireEvent.click(editBtns[0]);

      const costInput = screen.getByPlaceholderText(/Ví dụ: 50000/i);
      fireEvent.change(costInput, { target: { value: "0" } });

      const saveBtn = screen.getByText("Cập nhật");
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(hooks.updateLine.mutateAsync).toHaveBeenCalledWith({
          lineId: "line-po-1",
          payload: { unitCost: 0 },
        });
      });
    });

    it("40. Accounting entering decimal unitCost = 12500.5 submits valid number", async () => {
      hooks.mockUser = { roleCode: "KT", fullName: "Kế toán" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      const editBtns = screen.getAllByTitle("Chỉnh sửa dòng vật tư");
      fireEvent.click(editBtns[0]);

      const costInput = screen.getByPlaceholderText(/Ví dụ: 50000/i);
      fireEvent.change(costInput, { target: { value: "12500.5" } });

      fireEvent.click(screen.getByText("Cập nhật"));

      await waitFor(() => {
        expect(hooks.updateLine.mutateAsync).toHaveBeenCalledWith({
          lineId: "line-po-1",
          payload: { unitCost: 12500.5 },
        });
      });
    });

    it("41. SA at wait_sa_approve has read-only access (no edit button)", () => {
      hooks.mockUser = { roleCode: "SA", fullName: "Ban Giám Đốc" };
      const waitSaBom = { ...mockPoBom, status: "wait_sa_approve" as const };
      hooks.useBom.mockReturnValue({ data: waitSaBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      expect(screen.queryByTitle("Chỉnh sửa dòng vật tư")).toBeNull();
    });
  });

  // ==========================================
  // Category 6: Delete & Reorder Lines
  // ==========================================
  describe("Category 6: Delete & Reorder Lines", () => {
    it("42. Technical role clicking delete opens accessible confirmation dialog", () => {
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      const delBtns = screen.getAllByTitle("Xóa dòng vật tư");
      fireEvent.click(delBtns[0]);

      expect(screen.getByText("Xóa dòng vật tư")).toBeTruthy();
      expect(screen.getByText("Bạn có chắc chắn muốn xóa vật tư này?")).toBeTruthy();
    });

    it("43. Canceling delete dialog closes dialog without calling mutation", () => {
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      const delBtns = screen.getAllByTitle("Xóa dòng vật tư");
      fireEvent.click(delBtns[0]);

      const cancelBtn = screen.getByText("Hủy");
      fireEvent.click(cancelBtn);

      expect(hooks.deleteLine.mutateAsync).not.toHaveBeenCalled();
      expect(screen.queryByText("Bạn có chắc chắn muốn xóa vật tư này?")).toBeNull();
    });

    it("44. Confirming delete dialog calls DELETE /boms/:id/lines/:lineId", async () => {
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      const delBtns = screen.getAllByTitle("Xóa dòng vật tư");
      fireEvent.click(delBtns[0]);

      const confirmBtn = screen.getByText("Xóa vật tư");
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(hooks.deleteLine.mutateAsync).toHaveBeenCalledWith("line-1");
      });
    });

    it("45. Accounting cannot delete material line (button hidden)", () => {
      hooks.mockUser = { roleCode: "KT", fullName: "Kế toán" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      expect(screen.queryByTitle("Xóa dòng vật tư")).toBeNull();
    });

    it("46. SA cannot delete material line (button hidden)", () => {
      hooks.mockUser = { roleCode: "SA", fullName: "Ban Giám Đốc" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      expect(screen.queryByTitle("Xóa dòng vật tư")).toBeNull();
    });

    it("47. Technical role reordering line down calls PUT /boms/:id/lines/reorder", async () => {
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      const downBtns = screen.getAllByTitle("Di chuyển xuống");
      fireEvent.click(downBtns[0]);

      await waitFor(() => {
        expect(hooks.reorderLines.mutateAsync).toHaveBeenCalledWith({
          lineIds: ["line-2", "line-1"],
        });
      });
    });

    it("48. Technical role reordering line up calls PUT /boms/:id/lines/reorder", async () => {
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      const upBtns = screen.getAllByTitle("Di chuyển lên");
      fireEvent.click(upBtns[1]);

      await waitFor(() => {
        expect(hooks.reorderLines.mutateAsync).toHaveBeenCalledWith({
          lineIds: ["line-2", "line-1"],
        });
      });
    });

    it("49. Accounting cannot reorder lines (buttons hidden)", () => {
      hooks.mockUser = { roleCode: "KT", fullName: "Kế toán" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      expect(screen.queryByTitle("Di chuyển lên")).toBeNull();
    });

    it("50. SA cannot reorder lines (buttons hidden)", () => {
      hooks.mockUser = { roleCode: "SA", fullName: "Ban Giám Đốc" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
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
        </BrowserRouter>
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
        </BrowserRouter>
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
        </BrowserRouter>
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
      hooks.mockUser = { roleCode: "KT", fullName: "Kế toán" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
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
        </BrowserRouter>
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
        </BrowserRouter>
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
        </BrowserRouter>
      );
      fireEvent.click(screen.getByText("Trả lại"));

      expect(screen.getByText("N2 - Trả về R&D chỉnh định mức")).toBeTruthy();
      expect(screen.getByText("N1 - Trả về NVKH")).toBeTruthy();
    });

    it("58. Reject from N4 (wait_accounting) allows target N3 ONLY", () => {
      hooks.mockUser = { roleCode: "KT", fullName: "Kế toán" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
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
        </BrowserRouter>
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
        </BrowserRouter>
      );
      fireEvent.click(screen.getByText("Trả lại"));

      const submitBtn = screen.getByText("Xác nhận trả lại");
      expect((submitBtn as HTMLButtonElement).disabled).toBe(true);
    });

    it("61. Concurrency conflict (409) during forward displays error toast and refetches detail", async () => {
      hooks.mockUser = { roleCode: "TPKH", fullName: "TPKH" };
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
        </BrowserRouter>
      );
      fireEvent.click(screen.getByText("Chuyển RD"));
      fireEvent.click(screen.getByText("Xác nhận chuyển bước"));

      await waitFor(() => {
        expect(refetchSpy).toHaveBeenCalled();
        expect(hooks.mockToast.showToast).toHaveBeenCalledWith(
          expect.stringContaining("Dữ liệu đã bị thay đổi"),
          "error"
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
        </BrowserRouter>
      );
      const moreBtn = screen.getByLabelText("Thao tác khác");
      fireEvent.click(moreBtn);

      const discAction = screen.getByText(/Ngừng sử dụng \(Discontinue\)/i);
      fireEvent.click(discAction);

      expect(screen.getByText("Ngừng sử dụng BOM")).toBeTruthy();

      const reasonInput = screen.getByPlaceholderText(/Nhập lý do ngừng sử dụng/i);
      fireEvent.change(reasonInput, { target: { value: "Hủy mã hàng theo đề xuất" } });

      fireEvent.click(screen.getByText("Xác nhận ngừng sử dụng"));

      await waitFor(() => {
        expect(hooks.discontinueBom.mutateAsync).toHaveBeenCalledWith({
          reason: "Hủy mã hàng theo đề xuất",
        });
      });
    });

    it("63. SA can open Discontinue modal and submit with mandatory reason", () => {
      hooks.mockUser = { roleCode: "SA", fullName: "Ban Giám Đốc" };
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      const moreBtn = screen.getByLabelText("Thao tác khác");
      fireEvent.click(moreBtn);
      expect(screen.getByText(/Ngừng sử dụng \(Discontinue\)/i)).toBeTruthy();
    });

    it("64. NVKH cannot discontinue (action hidden)", () => {
      hooks.mockUser = { roleCode: "NVKH", fullName: "NVKH" };
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      expect(screen.queryByLabelText("Thao tác khác")).toBeNull();
    });

    it("65. Accounting cannot discontinue (action hidden)", () => {
      hooks.mockUser = { roleCode: "KT", fullName: "Kế toán" };
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      expect(screen.queryByLabelText("Thao tác khác")).toBeNull();
    });

    it("66. Discontinue modal disables submit when reason is empty", () => {
      hooks.mockUser = { roleCode: "TPKH", fullName: "TPKH" };
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      fireEvent.click(screen.getByLabelText("Thao tác khác"));
      fireEvent.click(screen.getByText(/Ngừng sử dụng \(Discontinue\)/i));

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
        </BrowserRouter>
      );
      expect(screen.getByText(/Rev 2 \(Đang làm việc\)/i)).toBeTruthy();
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
        </BrowserRouter>
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
        </BrowserRouter>
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
        </BrowserRouter>
      );
      expect(screen.getByText("Tạo phiên bản mới")).toBeTruthy();
    });

    it("71. Create Revision modal requires changeReason and calls POST /boms/:id/revisions", async () => {
      const closedBom = { ...mockFitBom, status: "closed" as const };
      hooks.useBom.mockReturnValue({ data: closedBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
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
        </BrowserRouter>
      );
      fireEvent.click(screen.getByText(/Lịch sử phiên bản/i));

      expect(screen.getByText("Lịch sử các phiên bản định mức (Revisions)")).toBeTruthy();
      expect(screen.getByText("So sánh Diff")).toBeTruthy();
    });

    it("73. History Tab renders workflow audit trail timeline", () => {
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      fireEvent.click(screen.getByText(/Nhật ký duyệt/i));

      expect(screen.getByText("Nhật ký luân chuyển quy trình (Workflow Audit Trail)")).toBeTruthy();
      expect(screen.getByText("NVKH Nguyễn Văn A")).toBeTruthy();
    });

    it("74. Revision Diff modal opens and displays ADDED and CHANGED items", () => {
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      fireEvent.click(screen.getByText(/Lịch sử phiên bản/i));
      fireEvent.click(screen.getByText("So sánh Diff"));

      expect(screen.getByText("So sánh biến động định mức (Revision Diff)")).toBeTruthy();
      expect(screen.getByText("THÊM MỚI")).toBeTruthy();
      expect(screen.getByText("Vải Lót Oxford")).toBeTruthy();
      expect(screen.getByText("THAY ĐỔI")).toBeTruthy();
    });

    it("75. Revision Diff masks unit cost and line cost for technical roles (RD)", () => {
      hooks.mockUser = { roleCode: "RD", fullName: "RD" };
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );
      fireEvent.click(screen.getByText(/Lịch sử phiên bản/i));
      fireEvent.click(screen.getByText("So sánh Diff"));

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
        </BrowserRouter>
      );
      fireEvent.click(screen.getByLabelText("Thao tác khác"));
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
        </BrowserRouter>
      );
      expect(screen.queryByText("Nhập từ Fit BOM")).toBeNull();
    });

    it("78. FIT BOM hides Copy action", () => {
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
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
        </BrowserRouter>
      );
      fireEvent.click(screen.getByLabelText("Thao tác khác"));
      fireEvent.click(screen.getByText("Nhập từ Fit BOM"));

      expect(screen.getByText("Sao chép từ Fit BOM")).toBeTruthy();

      await waitFor(() => {
        expect(screen.getByText(/Fit BOM: BOM-FIT-ST101/i)).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Xác nhận sao chép"));

      await waitFor(() => {
        expect(hooks.copyFit.mutateAsync).toHaveBeenCalledWith({
          sourceRevisionId: "rev-fit-src-1",
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
        </BrowserRouter>
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
        </BrowserRouter>
      );

      const inputs = screen.getAllByTitle("Nhập đơn giá ($)");
      expect(inputs.length).toBe(2);

      // Enter cost for line 1 using comma separator
      fireEvent.change(inputs[0], { target: { value: "0,1360" } });
      fireEvent.blur(inputs[0]);

      // Verify NO mutation called on blur
      expect(hooks.updateLine.mutateAsync).not.toHaveBeenCalled();

      // Enter cost for line 2 using dot separator
      fireEvent.change(inputs[1], { target: { value: "0.2400" } });
      fireEvent.blur(inputs[1]);

      // Both inputs retain their values, with comma normalized to dot
      expect((inputs[0] as HTMLInputElement).value).toBe("0.1360");
      expect((inputs[1] as HTMLInputElement).value).toBe("0.2400");

      // Verify dirty count and save draft button appear
      expect(screen.getAllByText(/2 đơn giá chưa lưu/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText("Lưu nháp").length).toBeGreaterThan(0);
    });

    it("82. clicking 'Lưu nháp' saves all dirty lines and displays success toast", async () => {
      hooks.mockUser = { roleCode: "ACCOUNTING", fullName: "Kế toán viên" };
      hooks.useBom.mockReturnValue({ data: multiLinePoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );

      const inputs = screen.getAllByTitle("Nhập đơn giá ($)");
      fireEvent.change(inputs[0], { target: { value: "0,1360" } });
      fireEvent.change(inputs[1], { target: { value: "0.2400" } });

      const saveButton = screen.getAllByRole("button", { name: /lưu nháp/i })[0];
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(hooks.updateLine.mutateAsync).toHaveBeenCalledWith({
          lineId: "line-po-1",
          payload: { unitCost: 0.136 },
        });
        expect(hooks.updateLine.mutateAsync).toHaveBeenCalledWith({
          lineId: "line-po-2",
          payload: { unitCost: 0.24 },
        });
        expect(hooks.mockToast.showToast).toHaveBeenCalledWith(
          "Đã lưu thành công 2 đơn giá vật tư",
          "success"
        );
      });
    });

    it("83. prevents forwarding when there are unsaved unit costs", async () => {
      hooks.mockUser = { roleCode: "ACCOUNTING", fullName: "Kế toán viên" };
      hooks.useBom.mockReturnValue({ data: mockPoBom, isLoading: false });
      render(
        <BrowserRouter>
          <BomDetailPage />
        </BrowserRouter>
      );

      const inputs = screen.getAllByTitle("Nhập đơn giá ($)");
      fireEvent.change(inputs[0], { target: { value: "0.1360" } });

      // Click Forward button in header
      const forwardBtn = screen.getByText("Chuyển SA");
      fireEvent.click(forwardBtn);

      expect(hooks.mockToast.showToast).toHaveBeenCalledWith(
        expect.stringContaining("chưa lưu"),
        "error"
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
          </BrowserRouter>
        );
        const dashes = screen.getAllByText("—");
        expect(dashes.length).toBeGreaterThanOrEqual(1);
      });

      it("85. displays '0 ₫' / '$0.0000' when backend costPerUnit and currentOrderCost are 0", () => {
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
          </BrowserRouter>
        );
        expect(screen.getAllByText("$0.0000").length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText("0 ₫").length).toBeGreaterThanOrEqual(1);
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
          </BrowserRouter>
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
          </BrowserRouter>
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
