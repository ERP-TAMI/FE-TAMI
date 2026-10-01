import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/apiClient";
import { bomsApi } from "./boms.api";

vi.mock("@/lib/apiClient", () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

describe("bomsApi contract & request mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBomStats", () => {
    it("forwards all filter parameters including year, startDate, endDate, month, and type", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { totalBoms: 10, fitBoms: 4, poBoms: 6, closedBoms: 5, activeBoms: 5 },
      });

      await bomsApi.getBomStats({
        month: "2026-09",
        year: 2026,
        startDate: "2026-09-01",
        endDate: "2026-09-30",
        type: "po",
      });

      expect(apiClient.get).toHaveBeenCalledWith("/boms/stats", {
        params: {
          month: "2026-09",
          year: "2026",
          startDate: "2026-09-01",
          endDate: "2026-09-30",
          type: "po",
        },
      });
    });
  });

  describe("getBomAggregate filters", () => {
    it("serializes month and multiple PO product IDs into the aggregate query", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } },
      });

      await bomsApi.getBomAggregate({
        month: "2026-09",
        purchaseOrderProductIds: ["product-1", "product-2"],
      });

      expect(apiClient.get).toHaveBeenCalledWith("/boms/aggregate", {
        params: {
          month: "2026-09",
          purchaseOrderProductIds: "product-1,product-2",
        },
      });
    });

    it("omits an empty product selection from the aggregate query", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } },
      });

      await bomsApi.getBomAggregate({
        month: "2026-09",
        purchaseOrderProductIds: [],
      });

      expect(apiClient.get).toHaveBeenCalledWith("/boms/aggregate", {
        params: { month: "2026-09" },
      });
    });

    it("forwards the selected year or date-range period to the aggregate API", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } },
      });

      await bomsApi.getBomAggregate({
        year: "2025",
        startDate: "2025-03-01",
        endDate: "2025-03-31",
      });

      expect(apiClient.get).toHaveBeenCalledWith("/boms/aggregate", {
        params: {
          year: "2025",
          startDate: "2025-03-01",
          endDate: "2025-03-31",
        },
      });
    });
  });

  describe("saveLines", () => {
    it("PUTs the whole table to /boms/:id/lines and drops empty fields", async () => {
      vi.mocked(apiClient.put).mockResolvedValue({ data: { rowVersion: 3, lines: [] } });

      const result = await bomsApi.saveLines("bom-01", {
        expectedRowVersion: 2,
        lines: [
          { lineId: "line-1", consumption: 2, note: null },
          { materialId: "mat-9", consumption: 0.5, note: "mới" },
        ],
      });

      expect(apiClient.put).toHaveBeenCalledWith("/boms/bom-01/lines", {
        expectedRowVersion: 2,
        lines: [
          { lineId: "line-1", consumption: 2, note: null },
          { materialId: "mat-9", consumption: 0.5, note: "mới" },
        ],
      });
      expect(result.rowVersion).toBe(3);
    });

    it("omits expectedRowVersion when the caller has none", async () => {
      vi.mocked(apiClient.put).mockResolvedValue({ data: { rowVersion: 1, lines: [] } });
      await bomsApi.saveLines("bom-01", { lines: [] });
      expect(apiClient.put).toHaveBeenCalledWith("/boms/bom-01/lines", { lines: [] });
    });
  });

  describe("saveCosts", () => {
    it("PATCHes only the changed prices to /boms/:id/lines/costs", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: { rowVersion: 4, lines: [] } });

      await bomsApi.saveCosts("bom-01", {
        items: [
          { lineId: "line-1", unitCost: 1200.5 },
          { lineId: "line-2", unitCost: null },
        ],
        expectedRowVersion: 3,
      });

      expect(apiClient.patch).toHaveBeenCalledWith("/boms/bom-01/lines/costs", {
        items: [
          { lineId: "line-1", unitCost: 1200.5 },
          { lineId: "line-2", unitCost: null },
        ],
        expectedRowVersion: 3,
      });
    });
  });

  describe("promoteRevision", () => {
    it("POSTs the trimmed reason to /boms/:id/revisions/:revisionId/promote", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: { id: "bom-01" } });

      await bomsApi.promoteRevision("bom-01", "rev-1", { reason: "  quay về bản 1  " });

      expect(apiClient.post).toHaveBeenCalledWith("/boms/bom-01/revisions/rev-1/promote", {
        reason: "quay về bản 1",
      });
    });
  });

  describe("getRevisionDiff contract normalization", () => {
    it("maps BE canonical diff payload (oldLine, newLine, totalAdded, costDifference) to FE normalized items", async () => {
      const bePayload = {
        bomId: "bom-01",
        targetRevisionId: "rev-02",
        targetRevisionNo: 2,
        baseRevisionId: "rev-01",
        baseRevisionNo: 1,
        oldCostPerUnit: 100000,
        newCostPerUnit: 115000,
        costDifference: 15000,
        totalAdded: 1,
        totalRemoved: 0,
        totalChanged: 1,
        totalUnchanged: 5,
        items: [
          {
            materialId: "mat-01",
            materialNameSnapshot: "Vải chính",
            unitSnapshot: "Mét",
            diffType: "CHANGED",
            oldLine: {
              consumption: 1.2,
              unitCost: 80000,
              lineCost: 96000,
              note: "Màu xanh",
              orderIndex: 0,
            },
            newLine: {
              consumption: 1.4,
              unitCost: 80000,
              lineCost: 112000,
              note: "Màu xanh đậm",
              orderIndex: 0,
            },
          },
          {
            materialId: "mat-02",
            materialNameSnapshot: "Keo dựng",
            unitSnapshot: "Cuộn",
            diffType: "ADDED",
            oldLine: null,
            newLine: {
              consumption: 0.5,
              unitCost: 15000,
              lineCost: 7500,
              note: null,
              orderIndex: 1,
            },
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValue({ data: bePayload });

      const result = await bomsApi.getRevisionDiff("bom-01", "rev-02", "rev-01");

      expect(apiClient.get).toHaveBeenCalledWith("/boms/bom-01/revisions/rev-02/diff", {
        params: { compareWithRevisionId: "rev-01" },
      });

      expect(result.targetRevisionNo).toBe(2);
      expect(result.baseRevisionNo).toBe(1);
      expect(result.totalAdded).toBe(1);
      expect(result.costDifference).toBe(15000);

      // Verify items have both BE canonical (oldLine, newLine) and FE legacy aliases (source, target)
      expect(result.items[0].newLine?.consumption).toBe(1.4);
      expect(result.items[0].target?.consumption).toBe(1.4);
      expect(result.items[0].oldLine?.consumption).toBe(1.2);
      expect(result.items[0].source?.consumption).toBe(1.2);

      // Added item
      expect(result.items[1].oldLine).toBeNull();
      expect(result.items[1].source).toBeNull();
      expect(result.items[1].newLine?.consumption).toBe(0.5);
      expect(result.items[1].target?.consumption).toBe(0.5);
    });
  });
});
