import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/apiClient";
import { workshopApi } from "./workshop.api";

vi.mock("@/lib/apiClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const workshop = {
  id: "f4ab3c98-2941-42e9-a92a-1e90f6087fd0",
  workshopCode: "X-01",
  name: "Xưởng May 1",
  manager: "Nguyễn Văn A",
  location: "Khu A",
  capacity: 500,
  status: "active" as const,
  createdAt: "2026-08-26T00:00:00.000Z",
  updatedAt: "2026-08-26T00:00:00.000Z",
};

describe("workshopApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requests only active workshops for production-plan selectors", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [workshop] });

    await expect(workshopApi.list({ status: "active" })).resolves.toEqual([workshop]);

    expect(apiClient.get).toHaveBeenCalledWith("/masters/workshops", {
      params: { status: "active" },
    });
  });

  it("sends search and status filters and validates the response", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [workshop] });

    await workshopApi.list({ search: "may", status: "active" });

    expect(apiClient.get).toHaveBeenCalledWith("/masters/workshops", {
      params: { search: "may", status: "active" },
    });
  });

  it.each([-1, 2_147_483_648])(
    "rejects an invalid capacity response at the API boundary",
    async (capacity) => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [{ ...workshop, capacity }] });

      await expect(workshopApi.list()).rejects.toThrow();
    },
  );

  it("updates only mutable workshop fields", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { ...workshop, capacity: 700 } });

    await workshopApi.update(workshop.id, { name: "Xưởng May Chính", capacity: 700 });

    expect(apiClient.patch).toHaveBeenCalledWith(`/masters/workshops/${workshop.id}`, {
      name: "Xưởng May Chính",
      capacity: 700,
    });
  });

  it("deletes a workshop by id", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined });

    await expect(workshopApi.delete(workshop.id)).resolves.toBeUndefined();

    expect(apiClient.delete).toHaveBeenCalledWith(`/masters/workshops/${workshop.id}`);
  });
});
