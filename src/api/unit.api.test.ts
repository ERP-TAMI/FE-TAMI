import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/apiClient";
import { unitApi } from "./unit.api";

vi.mock("@/lib/apiClient", () => ({ default: { get: vi.fn() } }));

describe("unitApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads only active units for Material selectors", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [
        {
          id: "0a989bfe-fb34-489c-b5fe-30f74a1dc09d",
          name: "Mét",
          status: "active",
        },
      ],
    });

    await expect(unitApi.list("active")).resolves.toHaveLength(1);
    expect(apiClient.get).toHaveBeenCalledWith("/masters/units", {
      params: { status: "active" },
    });
  });
});
