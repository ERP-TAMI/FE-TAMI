import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/apiClient";
import { bomsApi } from "./boms.api";

vi.mock("@/lib/apiClient", () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
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

  describe("getRevisionHistory contract normalization", () => {
    it("maps BE canonical contract (oldStatus, newStatus, changedAt, action, reason) to FE fields", async () => {
      const bePayload = [
        {
          id: "hist-01",
          revisionId: "rev-01",
          oldStatus: null,
          newStatus: "wait_nvkh",
          action: "create",
          reason: null,
          changedBy: "User 1",
          changedAt: "2026-09-20T08:00:00.000Z",
        },
        {
          id: "hist-02",
          revisionId: "rev-01",
          oldStatus: "wait_nvkh",
          newStatus: "wait_rd",
          action: "forward",
          reason: null,
          changedBy: "User 2",
          changedAt: "2026-09-20T09:00:00.000Z",
        },
        {
          id: "hist-03",
          revisionId: "rev-01",
          oldStatus: "wait_rd",
          newStatus: "wait_nvkh",
          action: "reject",
          reason: "Chưa đúng định mức chỉ may",
          changedBy: "User 3",
          changedAt: "2026-09-20T10:00:00.000Z",
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({ data: bePayload });

      const result = await bomsApi.getRevisionHistory("bom-01", "rev-01");

      expect(apiClient.get).toHaveBeenCalledWith("/boms/bom-01/revisions/rev-01/history");
      expect(result).toHaveLength(3);

      // Verify canonical BE properties
      expect(result[0].oldStatus).toBeNull();
      expect(result[0].newStatus).toBe("wait_nvkh");
      expect(result[0].changedAt).toBe("2026-09-20T08:00:00.000Z");

      // Verify backwards-compatible FE aliases
      expect(result[0].fromStatus).toBe("wait_nvkh"); // fallback when oldStatus is null
      expect(result[0].toStatus).toBe("wait_nvkh");
      expect(result[0].createdAt).toBe("2026-09-20T08:00:00.000Z");

      // Reject step
      expect(result[2].oldStatus).toBe("wait_rd");
      expect(result[2].newStatus).toBe("wait_nvkh");
      expect(result[2].action).toBe("reject");
      expect(result[2].reason).toBe("Chưa đúng định mức chỉ may");
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
