import { cleanup, render as rtlRender, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import PoDetailPage from "./PoDetailPage";

// EntityHistoryButton (rendered in several tab toolbars) reaches a real
// useQuery internally, which this page previously never needed.
function render(ui: ReactElement) {
  return rtlRender(
    <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>,
  );
}

const hooks = vi.hoisted(() => ({
  usePurchaseOrder: vi.fn(),
  useUpdatePurchaseOrder: vi.fn(),
  useUpdatePoStatus: vi.fn(),
  useUnlinkPoDocument: vi.fn(),
  useUploadPoDocument: vi.fn(),
  useUploadPoDocuments: vi.fn(),
  useUploadPoDocumentVersion: vi.fn(),
  useUpdatePoDocumentPurpose: vi.fn(),
  usePoProducts: vi.fn(),
  usePoDocuments: vi.fn(),
  useAddPoProduct: vi.fn(),
  useRemovePoProduct: vi.fn(),
  useDeletePurchaseOrder: vi.fn(),
}));

vi.mock("@/hooks/usePurchaseOrders", () => hooks);

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: null, showToast: vi.fn(), hideToast: vi.fn() }),
}));

const activePo = {
  id: "po-42",
  poCode: "PO-2026-042",
  customerPoCode: null,
  customerNameSnapshot: "Khách hàng thử nghiệm",
  receivedDate: "2026-09-01",
  deadline: "2026-10-01",
  note: "Ghi chú",
  status: "in_progress",
  productsCount: 0,
  documentsCount: 0,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

const poDocumentsPage = {
  items: [
    {
      documentId: "document-1",
      documentCode: "DOC-1",
      title: "Tech pack",
      purpose: "tech_pack",
      linkedAt: "2026-09-01T00:00:00.000Z",
      fileUrl: "https://files.example.test/tech-pack.pdf",
      fileName: "tech-pack.pdf",
      fileSize: 1024,
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
};

function renderDetail(
  readOnlyManagement: boolean,
  initialEntry = "/management/purchase-orders/po-42?fromMonth=2026-09&fromPage=2",
) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/management/purchase-orders/:id/*"
          element={
            <PoDetailPage
              readOnlyManagement={readOnlyManagement}
              managementContext
            />
          }
        />
        <Route path="/po/:id/*" element={<PoDetailPage readOnlyManagement={readOnlyManagement} />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PoDetailPage Management read-only mode", () => {
  beforeEach(() => {
    hooks.usePurchaseOrder.mockReturnValue({ data: activePo, isLoading: false, isError: false });
    hooks.useUpdatePurchaseOrder.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    hooks.useUpdatePoStatus.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    hooks.useUnlinkPoDocument.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    hooks.useUploadPoDocument.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    hooks.useUploadPoDocuments.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    hooks.useUploadPoDocumentVersion.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    hooks.useUpdatePoDocumentPurpose.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    hooks.usePoProducts.mockReturnValue({ data: undefined, isLoading: false });
    hooks.usePoDocuments.mockReturnValue({ data: poDocumentsPage, isFetching: false });
    hooks.useAddPoProduct.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    hooks.useRemovePoProduct.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    hooks.useDeletePurchaseOrder.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows the shared PO details without write or status actions for Management", () => {
    renderDetail(true);

    expect(screen.getAllByText("PO-2026-042").length).toBeGreaterThan(0);
    expect(screen.getByText("Đang xem ở khu Quản lý · chỉ đọc")).toBeTruthy();
    const breadcrumb = screen.getByRole("navigation", { name: "Điều hướng phân cấp" });
    expect(within(breadcrumb).getByRole("link", { name: "Tổng quan PO" }).getAttribute("href")).toBe(
      "/management/purchase-orders?month=2026-09&page=2",
    );
    for (const action of ["Khóa PO", "Hủy PO", "Xóa PO", "Chỉnh sửa"]) {
      expect(screen.queryByRole("button", { name: action })).toBeNull();
    }
  });

  it("keeps existing PO actions available in the normal PO module", () => {
    renderDetail(false);

    expect(screen.getByRole("button", { name: "Khóa PO" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Hủy PO" })).toBeTruthy();
  });

  it("keeps full-access PO details inside the Management navigation context", () => {
    renderDetail(
      false,
      "/management/purchase-orders/po-42?fromMonth=2026-09&fromPage=2",
    );

    expect(screen.getByRole("button", { name: "Hủy PO" })).toBeTruthy();
    expect(screen.queryByText("Đang xem ở khu Quản lý · chỉ đọc")).toBeNull();
    const breadcrumb = screen.getByRole("navigation", {
      name: "Điều hướng phân cấp",
    });
    expect(
      within(breadcrumb)
        .getByRole("link", { name: "Tổng quan PO" })
        .getAttribute("href"),
    ).toBe("/management/purchase-orders?month=2026-09&page=2");
  });

  it("opens a product detail in Management while preserving overview return context", () => {
    hooks.usePoProducts.mockReturnValue({
      data: {
        items: [
          {
            id: "product-88",
            productCode: "SP-88",
            productName: "Áo mẫu",
            totalQuantity: 120,
            colors: [],
          },
        ],
      },
      isLoading: false,
    });
    renderDetail(true, "/management/purchase-orders/po-42/products?fromMonth=2026-09&fromPage=2");

    expect(screen.getByRole("link", { name: "SP-88" }).getAttribute("href")).toBe(
      "/management/purchase-orders/po-42/products/product-88?fromMonth=2026-09&fromPage=2",
    );
  });

  it("allows viewing attached files but hides file download in Management mode", () => {
    renderDetail(true, "/management/purchase-orders/po-42/documents?fromMonth=2026-09&fromPage=2");

    expect(screen.getByRole("link", { name: /Xem/ })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Tải về/ })).toBeNull();
  });

  it("keeps attached-file download available in the normal PO module", () => {
    renderDetail(false, "/po/po-42/documents");

    expect(screen.getByRole("link", { name: /Tải về/ })).toBeTruthy();
  });
});
