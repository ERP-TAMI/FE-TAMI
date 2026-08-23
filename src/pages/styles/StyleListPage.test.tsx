import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import StyleListPage from "./StyleListPage";
import { stylesApi } from "@/api/stylesApi";

vi.mock("@/api/stylesApi", () => ({
  stylesApi: {
    getStyles: vi.fn(),
    createStyle: vi.fn(),
    deleteStyle: vi.fn(),
    updateStyle: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <StyleListPage />
      </BrowserRouter>
    </QueryClientProvider>,
  );
}

const mockStyles = [
  {
    id: "123",
    styleCode: "FIT-2026-001",
    styleName: "Áo Polo Nam",
    description: "Mẫu Polo Nam 2026",
    category: "Áo Polo",
    status: "draft" as const,
    baseImageVersionId: null,
    as3bCmBaseDays: 30,
    rowVersion: 1,
    createdBy: null,
    createdAt: new Date().toISOString(),
    updatedBy: null,
    updatedAt: new Date().toISOString(),
  },
];

describe("StyleListPage", () => {
  it("renders loading state initially and then displays styles list", async () => {
    vi.mocked(stylesApi.getStyles).mockResolvedValueOnce({
      data: mockStyles,
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    renderPage();

    expect(screen.getByRole("heading", { name: "Mẫu Fit", level: 1 })).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("FIT-2026-001")).toBeTruthy();
      expect(screen.getByText("Áo Polo Nam")).toBeTruthy();
    });
  });

  it("renders empty state when no styles found", async () => {
    vi.mocked(stylesApi.getStyles).mockResolvedValueOnce({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Không tìm thấy Mẫu Fit nào")).toBeTruthy();
    });
  });

  it("renders error state when API request fails", async () => {
    vi.mocked(stylesApi.getStyles).mockRejectedValueOnce(new Error("Network Error"));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("⚠️ Không thể tải dữ liệu")).toBeTruthy();
    });
  });

  it("shows a success toast after creating a style", async () => {
    vi.mocked(stylesApi.getStyles).mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
    });
    vi.mocked(stylesApi.createStyle).mockResolvedValueOnce({ ...mockStyles[0], id: "999" });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Không tìm thấy Mẫu Fit nào")).toBeTruthy();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "+ Tạo Mẫu Fit Mới" })[0]);
    fireEvent.change(screen.getByLabelText(/Mã mẫu/), { target: { value: "FIT-999" } });
    fireEvent.change(screen.getByLabelText(/Tên mẫu/), { target: { value: "Test Style" } });
    fireEvent.click(screen.getByRole("button", { name: "Tạo Mới" }));

    await waitFor(() => {
      expect(screen.getByText("Đã tạo mẫu Fit.")).toBeTruthy();
    });
  });

  it("shows a success toast after toggling status", async () => {
    vi.mocked(stylesApi.getStyles).mockResolvedValue({
      data: mockStyles,
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    vi.mocked(stylesApi.updateStyle).mockResolvedValueOnce({
      ...mockStyles[0],
      status: "active",
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("FIT-2026-001")).toBeTruthy();
    });

    fireEvent.click(screen.getByTitle("Đang Nháp (Bấm để chuyển thành Hoạt động)"));

    await waitFor(() => {
      expect(screen.getByText("Đã kích hoạt mẫu Fit.")).toBeTruthy();
    });
  });

  it("shows an error toast with a real message when deleting fails", async () => {
    vi.mocked(stylesApi.getStyles).mockResolvedValueOnce({
      data: mockStyles,
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    vi.mocked(stylesApi.deleteStyle).mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 409, data: { code: "CONFLICT" } },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("FIT-2026-001")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Xóa" }));
    fireEvent.click(screen.getByRole("button", { name: "Xóa Mẫu Fit" }));

    await waitFor(() => {
      expect(screen.getByText("Dữ liệu bị trùng hoặc đang được sử dụng.")).toBeTruthy();
    });
  });
});
