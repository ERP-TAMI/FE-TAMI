import { cleanup, fireEvent, render as rtlRender, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { PoProductSampleRoundsTab } from "./PoProductSampleRoundsTab";

// EntityHistoryButton (rendered in the tab's toolbar) reaches a real
// useQuery internally, which this component previously never needed.
function render(ui: ReactElement) {
  return rtlRender(
    <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>,
  );
}

const hooks = vi.hoisted(() => ({
  useCreateProductSampleRound: vi.fn(),
  useProductSampleRounds: vi.fn(),
  useRemoveProductSampleImage: vi.fn(),
  useUpdateProductSampleRound: vi.fn(),
  useUploadProductSampleImage: vi.fn(),
}));

vi.mock("@/hooks/usePurchaseOrders", () => hooks);
vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: null, showToast: vi.fn(), hideToast: vi.fn() }),
}));
vi.mock("@/hooks/useUploadStore", () => ({
  useUploadStore: () => ({ startUpload: vi.fn(), tickUpload: vi.fn(), finishUpload: vi.fn() }),
}));
vi.mock("@/api/po.api", () => ({ poApi: { getProductSampleImageDownloadUrl: vi.fn() } }));

describe("PoProductSampleRoundsTab read-only mode", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows round status and image previews without write or download actions", () => {
    hooks.useProductSampleRounds.mockReturnValue({
      data: [
        {
          id: "round-1",
          roundNo: 1,
          sampleDate: "2026-09-12",
          feedback: "Cần chỉnh đường may cổ áo.",
          status: "working",
          images: [
            {
              id: "image-1",
              url: "https://files.example.test/sample.jpg",
              fileName: "sample.jpg",
              mimeType: "image/jpeg",
              orderIndex: 0,
              colorName: null,
              uploadedAt: "2026-09-12T00:00:00.000Z",
            },
          ],
        },
      ],
      isLoading: false,
    });
    for (const hook of [
      hooks.useCreateProductSampleRound,
      hooks.useRemoveProductSampleImage,
      hooks.useUpdateProductSampleRound,
      hooks.useUploadProductSampleImage,
    ]) {
      hook.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    }

    render(
      <PoProductSampleRoundsTab
        poId="po-1"
        productId="product-1"
        readOnly
      />,
    );

    expect(screen.getByText("Đợt may mẫu 1")).toBeTruthy();
    expect(screen.getByText("Đang làm")).toBeTruthy();
    expect(screen.getByText("Cần chỉnh đường may cổ áo.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "sample.jpg" })).toBeTruthy();
    for (const action of ["Thêm đợt may mẫu", "Sửa", "Tải ảnh về", "Gỡ ảnh", "Thêm ảnh"]) {
      expect(screen.queryByRole("button", { name: action })).toBeNull();
    }

    fireEvent.click(screen.getByRole("button", { name: "sample.jpg" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Tải xuống" })).toBeNull();
  });

  it("keeps image download for a locked product while hiding every write action", () => {
    hooks.useProductSampleRounds.mockReturnValue({
      data: [
        {
          id: "round-1",
          roundNo: 1,
          sampleDate: "2026-09-12",
          feedback: null,
          status: "approved",
          images: [
            {
              id: "image-1",
              url: "https://files.example.test/sample.jpg",
              fileName: "sample.jpg",
              mimeType: "image/jpeg",
              orderIndex: 0,
              colorName: null,
              uploadedAt: "2026-09-12T00:00:00.000Z",
            },
          ],
        },
      ],
      isLoading: false,
    });
    for (const hook of [
      hooks.useCreateProductSampleRound,
      hooks.useRemoveProductSampleImage,
      hooks.useUpdateProductSampleRound,
      hooks.useUploadProductSampleImage,
    ]) {
      hook.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    }

    render(
      <PoProductSampleRoundsTab
        poId="po-1"
        productId="product-1"
        readOnly
        canDownload
      />,
    );

    expect(screen.getByRole("button", { name: "Tải ảnh về" })).toBeTruthy();
    for (const action of ["Thêm đợt may mẫu", "Sửa", "Gỡ ảnh", "Thêm ảnh"]) {
      expect(screen.queryByRole("button", { name: action })).toBeNull();
    }

    fireEvent.click(screen.getByRole("button", { name: "sample.jpg" }));
    expect(screen.getByRole("button", { name: "Tải xuống" })).toBeTruthy();
  });
});
