import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/apiClient";
import { sizeChartApi } from "./size-chart.api";

vi.mock("@/lib/apiClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const sizeChart = {
  id: "f4ab3c98-2941-42e9-a92a-1e90f6087fd0",
  name: "Áo sơ mi nam",
  sizes: ["XS", "S", "M", "L", "XL"],
  status: "active" as const,
  createdAt: "2026-08-26T00:00:00.000Z",
  updatedAt: "2026-08-26T00:00:00.000Z",
};

describe("sizeChartApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requests only active size charts for new business data selectors", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [sizeChart] });

    await expect(sizeChartApi.list({ status: "active" })).resolves.toEqual([sizeChart]);

    expect(apiClient.get).toHaveBeenCalledWith("/masters/size-charts", {
      params: { status: "active" },
    });
  });

  it("trims search and validates the complete list response", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [sizeChart] });

    await sizeChartApi.list({ search: "  sơ mi  ", status: "inactive" });

    expect(apiClient.get).toHaveBeenCalledWith("/masters/size-charts", {
      params: { search: "sơ mi", status: "inactive" },
    });
  });

  it("rejects a mutation response missing database timestamps", async () => {
    const { createdAt: _createdAt, ...incomplete } = sizeChart;
    vi.mocked(apiClient.patch).mockResolvedValue({ data: incomplete });

    await expect(
      sizeChartApi.update(sizeChart.id, { name: "Áo sơ mi", sizes: ["S", "M"] }),
    ).rejects.toThrow();
  });

  it("replaces the mutable name and ordered sizes in-place", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({
      data: { ...sizeChart, name: "Áo sơ mi", sizes: ["S", "M"] },
    });

    await sizeChartApi.update(sizeChart.id, { name: "Áo sơ mi", sizes: ["S", "M"] });

    expect(apiClient.patch).toHaveBeenCalledWith(`/masters/size-charts/${sizeChart.id}`, {
      name: "Áo sơ mi",
      sizes: ["S", "M"],
    });
  });

  it("exposes no hard-delete API", () => {
    expect(sizeChartApi).not.toHaveProperty("delete");
  });
});
