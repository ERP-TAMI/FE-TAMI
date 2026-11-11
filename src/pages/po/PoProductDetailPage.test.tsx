import { cleanup, fireEvent, render as rtlRender, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import PoProductDetailPage from "./PoProductDetailPage";

function render(ui: ReactElement) {
  return rtlRender(
    <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>,
  );
}

const hooks = vi.hoisted(() => ({
  usePurchaseOrder: vi.fn(),
  usePoDocuments: vi.fn(),
  usePoProductDetail: vi.fn(),
  useProductColors: vi.fn(),
  useProductDocuments: vi.fn(),
  useProductOperationSteps: vi.fn(),
  useUpdatePoProduct: vi.fn(),
  useUpdateProductStatus: vi.fn(),
  useSaveProductOperationSteps: vi.fn(),
  useUnlinkProductDocument: vi.fn(),
  useLinkProductDocument: vi.fn(),
  useUploadProductDocument: vi.fn(),
  useUploadProductDocumentVersion: vi.fn(),
}));

vi.mock("@/hooks/usePurchaseOrders", () => hooks);

vi.mock("@/hooks/useSizeCharts", () => ({
  useActiveSizeCharts: () => ({ data: { data: [] }, isLoading: false }),
}));

vi.mock("@/hooks/useUploadImage", () => ({
  useUploadImage: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: null, showToast: vi.fn(), hideToast: vi.fn() }),
}));

const mockPo = {
  id: "po-1",
  poCode: "PO-2026-001",
  customerNameSnapshot: "Khách A",
  receivedDate: "2026-09-01",
  deadline: "2026-10-01",
  status: "in_progress",
};

const mockProduct = {
  id: "prod-1",
  productCode: "SP-001",
  productName: "Áo Polo Nam",
  category: "Áo polo",
  materialNote: "Cotton 100%",
  deadline: "2026-10-01",
  status: "in_progress",
  as3bCmBaseDays: 30,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

const mockColorsData = {
  colors: [
    {
      id: "c-1",
      colorName: "Đen",
      ratio: "1:2:1",
      sizes: [
        { sizeLabel: "M", quantity: 10 },
        { sizeLabel: "L", quantity: 20 },
      ],
    },
    {
      id: "c-2",
      colorName: "Trắng",
      ratio: null,
      sizes: [
        { sizeLabel: "M", quantity: 15 },
        { sizeLabel: "L", quantity: 25 },
      ],
    },
    {
      id: "c-3",
      colorName: "Xanh Navy",
      ratio: "30%",
      sizes: [{ sizeLabel: "M", quantity: 30 }],
    },
  ],
  totalQuantity: 100,
};

function renderProductDetail(initialEntry = "/po/po-1/products/prod-1") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/po/:id/products/:productId/:tab?" element={<PoProductDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PoProductDetailPage - Color Ratio (TAMI-125)", () => {
  const mutateAsyncMock = vi.fn();

  beforeEach(() => {
    mutateAsyncMock.mockResolvedValue({});
    hooks.usePurchaseOrder.mockReturnValue({ data: mockPo, isLoading: false, isError: false });
    hooks.usePoDocuments.mockReturnValue({ data: { items: [], total: 0 }, isLoading: false });
    hooks.usePoProductDetail.mockReturnValue({ data: mockProduct, isLoading: false, isError: false });
    hooks.useProductColors.mockReturnValue({ data: mockColorsData, isLoading: false });
    hooks.useProductDocuments.mockReturnValue({ data: [], isLoading: false });
    hooks.useProductOperationSteps.mockReturnValue({ data: [], isLoading: false });
    hooks.useUpdatePoProduct.mockReturnValue({ isPending: false, mutateAsync: mutateAsyncMock });
    hooks.useUpdateProductStatus.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    hooks.useSaveProductOperationSteps.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    hooks.useUnlinkProductDocument.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    hooks.useLinkProductDocument.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    hooks.useUploadProductDocument.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    hooks.useUploadProductDocumentVersion.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("displays each color's ratio on the Product Info tab and shows '-' when ratio is null", () => {
    renderProductDetail("/po/po-1/products/prod-1");

    expect(screen.getByTestId("product-color-ratio-Đen").textContent).toBe("1:2:1");
    expect(screen.getByTestId("product-color-ratio-Trắng").textContent).toBe("-");
    expect(screen.getByTestId("product-color-ratio-Xanh Navy").textContent).toBe("30%");
  });

  it("displays the 'Tỷ lệ' column on the Size Chart tab and shows '-' when ratio is null", () => {
    renderProductDetail("/po/po-1/products/prod-1/sizes");

    expect(screen.getByRole("columnheader", { name: "Tỷ lệ" })).toBeTruthy();
    expect(screen.getByText("1:2:1")).toBeTruthy();
    expect(screen.getByText("-")).toBeTruthy();
    expect(screen.getByText("30%")).toBeTruthy();
  });

  it("allows editing one color's ratio from the Product Info modal and saving without altering other colors' ratios", async () => {
    renderProductDetail("/po/po-1/products/prod-1");

    fireEvent.click(screen.getByRole("button", { name: /Chỉnh sửa$/i }));

    const blackRatioInput = screen.getByLabelText("Tỷ lệ màu Đen") as HTMLInputElement;
    const whiteRatioInput = screen.getByLabelText("Tỷ lệ màu Trắng") as HTMLInputElement;
    const navyRatioInput = screen.getByLabelText("Tỷ lệ màu Xanh Navy") as HTMLInputElement;

    expect(blackRatioInput.value).toBe("1:2:1");
    expect(whiteRatioInput.value).toBe("");
    expect(navyRatioInput.value).toBe("30%");

    // Update only "Trắng" ratio from null to "2:2:1"
    fireEvent.change(whiteRatioInput, { target: { value: "2:2:1" } });

    expect(blackRatioInput.value).toBe("1:2:1");
    expect(whiteRatioInput.value).toBe("2:2:1");
    expect(navyRatioInput.value).toBe("30%");

    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
    });

    expect(mutateAsyncMock).toHaveBeenCalledWith({
      id: "po-1",
      productId: "prod-1",
      input: expect.objectContaining({
        productCode: "SP-001",
        productName: "Áo Polo Nam",
        colors: [
          {
            id: "c-1",
            colorName: "Đen",
            ratio: "1:2:1",
            sizes: [
              { sizeLabel: "M", quantity: 10 },
              { sizeLabel: "L", quantity: 20 },
            ],
          },
          {
            id: "c-2",
            colorName: "Trắng",
            ratio: "2:2:1",
            sizes: [
              { sizeLabel: "M", quantity: 15 },
              { sizeLabel: "L", quantity: 25 },
            ],
          },
          {
            id: "c-3",
            colorName: "Xanh Navy",
            ratio: "30%",
            sizes: [{ sizeLabel: "M", quantity: 30 }],
          },
        ],
      }),
    });
  });

  it("allows editing color ratios via 'Chỉnh sửa màu & tỷ lệ' on the Product Info tab", async () => {
    renderProductDetail("/po/po-1/products/prod-1");

    fireEvent.click(screen.getByRole("button", { name: /Chỉnh sửa màu & tỷ lệ/i }));

    const blackRatioInput = screen.getByLabelText("Tỷ lệ màu Đen") as HTMLInputElement;
    // Clear "Đen" ratio -> should become null
    fireEvent.change(blackRatioInput, { target: { value: "" } });

    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
    });

    expect(mutateAsyncMock).toHaveBeenCalledWith({
      id: "po-1",
      productId: "prod-1",
      input: {
        colors: [
          expect.objectContaining({ id: "c-1", colorName: "Đen", ratio: null }),
          expect.objectContaining({ id: "c-2", colorName: "Trắng", ratio: null }),
          expect.objectContaining({ id: "c-3", colorName: "Xanh Navy", ratio: "30%" }),
        ],
      },
    });
  });
});
