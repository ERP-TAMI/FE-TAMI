import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/apiClient";
import { materialGroupApi } from "./material-group.api";

vi.mock("@/lib/apiClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("materialGroupApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests only active groups for new-material selectors", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [
        {
          id: "e41a0a7d-28b1-4d78-9c26-b017f5c5f890",
          name: "Fabric",
          status: "active",
        },
      ],
    });

    await expect(materialGroupApi.list("active")).resolves.toHaveLength(1);
    expect(apiClient.get).toHaveBeenCalledWith("/masters/material-groups", {
      params: { status: "active" },
    });
  });
});
