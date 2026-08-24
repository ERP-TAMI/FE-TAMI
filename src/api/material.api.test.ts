import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/apiClient";
import { materialApi } from "./material.api";

vi.mock("@/lib/apiClient", () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const material = {
  id: "42ee8a8f-23ff-4a65-9a7f-2ee535cab17f",
  materialCode: "FAB-001",
  materialName: "Vải chính",
  materialGroupId: null,
  materialGroupName: null,
  defaultUnitId: "0a989bfe-fb34-489c-b5fe-30f74a1dc09d",
  defaultUnitName: "Mét",
  defaultYieldPct: "2.5000",
  status: "active",
  createdAt: "2026-08-23T00:00:00.000Z",
  updatedAt: "2026-08-23T00:00:00.000Z",
};

describe("materialApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes search, group, and status filters to the backend", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [material] });

    await expect(
      materialApi.list({
        search: "FAB",
        materialGroupId: "c8404d89-315f-49e9-bf81-b05f0f410c4a",
        status: "active",
      }),
    ).resolves.toEqual([material]);

    expect(apiClient.get).toHaveBeenCalledWith("/masters/materials", {
      params: {
        search: "FAB",
        materialGroupId: "c8404d89-315f-49e9-bf81-b05f0f410c4a",
        status: "active",
      },
    });
  });

  it("preserves exact decimal strings from the API", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: material });

    await expect(materialApi.detail(material.id)).resolves.toMatchObject({
      defaultYieldPct: "2.5000",
    });
  });
});
