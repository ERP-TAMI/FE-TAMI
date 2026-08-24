import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/apiClient";
import { stageApi } from "@/api/stage.api";

vi.mock("@/lib/apiClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const stage = {
  id: "64bfc097-69d1-43f5-af97-cb0e7428f7df",
  stageCode: "GD-CAT",
  stageName: "Cắt vải",
  description: "Cắt chi tiết theo sơ đồ",
  ssv: "12.500",
  status: "active" as const,
};

describe("stageApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists stages with optional server-side filters", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [stage] });

    await expect(stageApi.list({ search: "cắt", status: "active" })).resolves.toEqual([stage]);
    expect(apiClient.get).toHaveBeenCalledWith("/masters/stages", {
      params: { search: "cắt", status: "active" },
    });
  });

  it("updates only the supplied SSV rows through the bulk endpoint", async () => {
    const input = { items: [{ id: stage.id, ssv: "13.000" }] };
    vi.mocked(apiClient.patch).mockResolvedValue({ data: [{ ...stage, ssv: "13.000" }] });

    await expect(stageApi.updateSsvBulk(input)).resolves.toEqual([{ ...stage, ssv: "13.000" }]);
    expect(apiClient.patch).toHaveBeenCalledWith("/masters/stages/bulk-ssv", input);
  });

  it("deletes a stage through the stage endpoint", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined });

    await expect(stageApi.remove(stage.id)).resolves.toBeUndefined();
    expect(apiClient.delete).toHaveBeenCalledWith(`/masters/stages/${stage.id}`);
  });

  it("rejects an invalid response at the API boundary", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [{ ...stage, ssv: -1 }] });

    await expect(stageApi.list()).rejects.toThrow();
  });
});
