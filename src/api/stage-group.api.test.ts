import { beforeEach, describe, expect, it, vi } from "vitest";
import { stageGroupApi } from "@/api/stage-group.api";
import apiClient from "@/lib/apiClient";

vi.mock("@/lib/apiClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const group = {
  id: "64bfc097-69d1-43f5-af97-cb0e7428f7df",
  groupCode: "NC-MAY",
  groupName: "Nhóm may",
  description: null,
  status: "active" as const,
  itemCount: 1,
  createdAt: "2026-08-24T01:00:00.000Z",
  updatedAt: "2026-08-24T01:00:00.000Z",
};

describe("stageGroupApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists stage groups using the dedicated endpoint", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [group] });

    await expect(stageGroupApi.list({ status: "active" })).resolves.toEqual([group]);
    expect(apiClient.get).toHaveBeenCalledWith("/masters/stage-groups", {
      params: { status: "active" },
    });
  });

  it("sends the full ordered independent child list when updating", async () => {
    const input = {
      groupName: "Nhóm may",
      description: null,
      items: [
        {
          id: "771c0dc2-cd59-44e3-9b16-cacb200f20e5",
          itemName: "May thân",
          description: "May ráp thân",
          ssv: "12.500",
          status: "active" as const,
          orderIndex: 0,
        },
      ],
    };
    const detail = {
      ...group,
      items: [
        {
          ...input.items[0],
          ssv: "12.500",
        },
      ],
    };
    vi.mocked(apiClient.patch).mockResolvedValue({ data: detail });

    await expect(stageGroupApi.update(group.id, input)).resolves.toEqual(detail);
    expect(apiClient.patch).toHaveBeenCalledWith(`/masters/stage-groups/${group.id}`, input);
  });

  it("deletes a stage group through the dedicated endpoint", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined });

    await expect(stageGroupApi.remove(group.id)).resolves.toBeUndefined();
    expect(apiClient.delete).toHaveBeenCalledWith(`/masters/stage-groups/${group.id}`);
  });

  it("rejects malformed independent children at the API boundary", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        ...group,
        items: [
          {
            id: "invalid",
            itemName: "May thân",
            description: null,
            ssv: "12.500",
            status: "active",
            orderIndex: 0,
          },
        ],
      },
    });

    await expect(stageGroupApi.detail(group.id)).rejects.toThrow();
  });
});
