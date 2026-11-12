import { cleanup, fireEvent, render as rtlRender, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import PoProductDetailPage from "./PoProductDetailPage";

function render(ui: ReactElement) {
  const queryClient = new QueryClient();
  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
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

  it("allows editing one color's ratio from the Product Info modal and sends only changed colorRatios without colors", async () => {
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

    const calledArg = mutateAsyncMock.mock.calls[0][0];
    expect(calledArg).toEqual({
      id: "po-1",
      productId: "prod-1",
      input: expect.objectContaining({
        productCode: "SP-001",
        productName: "Áo Polo Nam",
        colorRatios: [{ id: "c-2", ratio: "2:2:1" }],
      }),
    });
    expect(calledArg.input).not.toHaveProperty("colors");
  });

  it("does not send colors or overwrite concurrent color/size updates when saving Product Info metadata", async () => {
    const view = renderProductDetail("/po/po-1/products/prod-1");

    fireEvent.click(screen.getByRole("button", { name: /Chỉnh sửa$/i }));

    // Another user updates quantities and adds a new color while this modal is open
    hooks.useProductColors.mockReturnValue({
      data: {
        colors: [
          {
            id: "c-1",
            colorName: "Đen",
            ratio: "1:2:1",
            sizes: [
              { sizeLabel: "M", quantity: 99 },
              { sizeLabel: "L", quantity: 120 },
            ],
          },
          ...mockColorsData.colors.slice(1),
          {
            id: "c-4",
            colorName: "Đỏ",
            ratio: "4:1",
            sizes: [{ sizeLabel: "S", quantity: 40 }],
          },
        ],
        totalQuantity: 329,
      },
      isLoading: false,
      isError: false,
    });
    view.rerender(
      <MemoryRouter initialEntries={["/po/po-1/products/prod-1"]}>
        <Routes>
          <Route path="/po/:id/products/:productId/:tab?" element={<PoProductDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const nameInput = screen.getByDisplayValue("Áo Polo Nam");
    fireEvent.change(nameInput, { target: { value: "Áo Polo Nam Mới" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
    });

    const calledArg = mutateAsyncMock.mock.calls[0][0];
    expect(calledArg.input.productName).toBe("Áo Polo Nam Mới");
    expect(calledArg.input).not.toHaveProperty("colors");
    expect(calledArg.input).not.toHaveProperty("colorRatios");
  });

  it("prompts unsaved changes confirmation when closing the Product Info modal after editing only a color ratio", async () => {
    renderProductDetail("/po/po-1/products/prod-1");

    fireEvent.click(screen.getByRole("button", { name: /Chỉnh sửa$/i }));

    const blackRatioInput = screen.getByLabelText("Tỷ lệ màu Đen") as HTMLInputElement;
    fireEvent.change(blackRatioInput, { target: { value: "9:1" } });

    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));

    expect(screen.getByText("Bạn có thay đổi chưa được lưu")).toBeTruthy();

    // Keep editing -> preserves draft
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục chỉnh sửa" }));
    expect((screen.getByLabelText("Tỷ lệ màu Đen") as HTMLInputElement).value).toBe("9:1");

    // Discard changes -> closes modal
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
    fireEvent.click(screen.getByRole("button", { name: "Bỏ thay đổi" }));

    await waitFor(() => {
      expect(screen.queryByLabelText("Tỷ lệ màu Đen")).toBeNull();
    });
  });

  it("initializes color ratio inputs when colors finish loading after modal opens and preserves user edits across refetches", async () => {
    hooks.useProductColors.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    const view = renderProductDetail("/po/po-1/products/prod-1");

    fireEvent.click(screen.getByRole("button", { name: /Chỉnh sửa$/i }));
    expect(screen.getByText("Đang tải danh sách màu...")).toBeTruthy();
    expect(screen.queryByLabelText("Tỷ lệ màu Đen")).toBeNull();

    // Colors finish loading while modal is already open
    hooks.useProductColors.mockReturnValue({
      data: mockColorsData,
      isLoading: false,
      isError: false,
    });
    view.rerender(
      <MemoryRouter initialEntries={["/po/po-1/products/prod-1"]}>
        <Routes>
          <Route path="/po/:id/products/:productId/:tab?" element={<PoProductDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const blackRatioInput = screen.getByLabelText("Tỷ lệ màu Đen") as HTMLInputElement;
    expect(blackRatioInput.value).toBe("1:2:1");
    expect((screen.getByLabelText("Tỷ lệ màu Trắng") as HTMLInputElement).value).toBe("");

    // User edits "Đen" ratio
    fireEvent.change(blackRatioInput, { target: { value: "9:1" } });
    expect((screen.getByLabelText("Tỷ lệ màu Đen") as HTMLInputElement).value).toBe("9:1");

    // Background refetch brings updated sizes + a newly added color, and must NOT overwrite user's "9:1" draft
    hooks.useProductColors.mockReturnValue({
      data: {
        colors: [
          {
            ...mockColorsData.colors[0],
            sizes: [{ sizeLabel: "M", quantity: 88 }],
          },
          mockColorsData.colors[1],
          mockColorsData.colors[2],
          {
            id: "c-4",
            colorName: "Đỏ",
            ratio: "5:1",
            sizes: [{ sizeLabel: "S", quantity: 20 }],
          },
        ],
        totalQuantity: 178,
      },
      isLoading: false,
      isError: false,
    });
    view.rerender(
      <MemoryRouter initialEntries={["/po/po-1/products/prod-1"]}>
        <Routes>
          <Route path="/po/:id/products/:productId/:tab?" element={<PoProductDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect((screen.getByLabelText("Tỷ lệ màu Đen") as HTMLInputElement).value).toBe("9:1");
    expect((screen.getByLabelText("Tỷ lệ màu Đỏ") as HTMLInputElement).value).toBe("5:1");

    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
    });

    const calledArg = mutateAsyncMock.mock.calls[0][0];
    expect(calledArg.input.colorRatios).toEqual([{ id: "c-1", ratio: "9:1" }]);
    expect(calledArg.input).not.toHaveProperty("colors");
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
