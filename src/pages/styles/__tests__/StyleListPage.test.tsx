import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import StyleListPage from "../StyleListPage";
import { stylesApi } from "@/features/styles/api/stylesApi";

vi.mock("@/features/styles/api/stylesApi", () => ({
  stylesApi: {
    getStyles: vi.fn(),
    deleteStyle: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

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

    render(
      <BrowserRouter>
        <StyleListPage />
      </BrowserRouter>,
    );

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

    render(
      <BrowserRouter>
        <StyleListPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Không tìm thấy Mẫu Fit nào")).toBeTruthy();
    });
  });

  it("renders error state when API request fails", async () => {
    vi.mocked(stylesApi.getStyles).mockRejectedValueOnce(new Error("Network Error"));

    render(
      <BrowserRouter>
        <StyleListPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("⚠️ Không thể tải dữ liệu")).toBeTruthy();
    });
  });
});
