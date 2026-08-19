import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/apiClient";
import { bomApi } from "./bom.api";

vi.mock("@/lib/apiClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("bomApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("always requests active materials and forwards server-side search", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

    await bomApi.listMaterialOptions("cotton");

    expect(apiClient.get).toHaveBeenCalledWith("/masters/materials", {
      params: { status: "active", search: "cotton" },
    });
  });
});
