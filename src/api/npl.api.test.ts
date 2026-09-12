import { describe, it, expect, vi, beforeEach } from "vitest";
import apiClient from "@/lib/apiClient";
import { nplApi } from "./npl.api";
import type { RawBomItem, PaginationMeta } from "@/types/npl";

vi.mock("@/lib/apiClient", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("nplApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts and normalizes paginated response with data and meta envelope", async () => {
    const mockRawItems: RawBomItem[] = [
      {
        id: "bom-1",
        objectType: "po",
        objectCode: "PO-100",
        styleCode: "STY-01",
        productName: "Áo Polo",
        colorName: "Navy",
        status: "Approved",
        version: 1,
        totalCostPerUnit: 145000,
        createdAt: "2026-09-12T00:00:00.000Z",
      },
      {
        id: "bom-2",
        objectType: "fit",
        objectCode: "FIT-01",
        styleCode: "STY-02",
        productName: "Mẫu Fit",
        colorName: null,
        status: "Draft",
        version: 1,
        totalCostPerUnit: null, // Fit BOM has no cost
        createdAt: "2026-09-12T00:00:00.000Z",
      },
    ];

    const mockMeta: PaginationMeta = {
      total: 25,
      page: 2,
      limit: 10,
      totalPages: 3,
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        data: mockRawItems,
        meta: mockMeta,
      },
    });

    const filter = { page: 2, limit: 10, search: "Polo" };
    const result = await nplApi.getNplList(filter);

    expect(apiClient.get).toHaveBeenCalledWith("/boms", { params: filter });
    expect(result.meta).toEqual(mockMeta);
    expect(result.data).toHaveLength(2);

    // Preserves null cost
    expect(result.data[1].totalCostPerUnit).toBeNull();
    // Normalizes PO cost
    expect(result.data[0].totalCostPerUnit).toBe(145000);
  });

  it("handles fallback if BE returns a raw array", async () => {
    const mockRawItems: RawBomItem[] = [
      {
        id: "bom-1",
        objectType: "po",
        objectCode: "PO-100",
        styleCode: "STY-01",
        productName: "Áo Polo",
        colorName: "Navy",
        status: "Approved",
        version: 1,
        totalCostPerUnit: "145000.5",
        createdAt: "2026-09-12T00:00:00.000Z",
      },
    ];

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: mockRawItems,
    });

    const result = await nplApi.getNplList({ page: 1, limit: 10 });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].totalCostPerUnit).toBe(145000.5);
    expect(result.meta.total).toBe(1);
    expect(result.meta.page).toBe(1);
    expect(result.meta.totalPages).toBe(1);
  });

  it("fetches aggregate BOM stats from /boms/stats", async () => {
    const mockStats = {
      total: 50,
      draftCount: 10,
      pendingCount: 15,
      approvedCount: 25,
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: mockStats,
    });

    const result = await nplApi.getStats("2026-09");

    expect(apiClient.get).toHaveBeenCalledWith("/boms/stats", {
      params: { period: "2026-09" },
    });
    expect(result).toEqual(mockStats);
  });
});

