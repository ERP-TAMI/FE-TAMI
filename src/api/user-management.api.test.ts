import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/apiClient";
import { userManagementApi } from "./user-management.api";

vi.mock("@/lib/apiClient", () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const response = {
  data: [
    {
      id: "9fb4d58f-0e6d-4ed5-b122-2b9f61aae115",
      fullName: "Nhân viên IT",
      email: "it@tami.test",
      phone: null,
      role: { code: "IT", name: "Công nghệ thông tin" },
      accountStatus: "active",
      passwordSetupRequired: false,
    },
  ],
  meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
};

describe("userManagementApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends normalized list filters and validates the response", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: response });

    await expect(
      userManagementApi.list({ search: "An", role: "IT", status: "active", page: 2, limit: 20 }),
    ).resolves.toEqual(response);

    expect(apiClient.get).toHaveBeenCalledWith("/system/users", {
      params: { search: "An", role: "IT", status: "active", page: 2, limit: 20 },
    });
  });

  it("does not send empty optional filters", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: response });

    await userManagementApi.list({ search: "", page: 1, limit: 10 });

    expect(apiClient.get).toHaveBeenCalledWith("/system/users", {
      params: { page: 1, limit: 10 },
    });
  });

  it("rejects an invalid server payload at the API boundary", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { ...response, data: [{ ...response.data[0], accountStatus: "disabled" }] },
    });

    await expect(userManagementApi.list({ page: 1, limit: 10 })).rejects.toThrow();
  });

  it("accepts additive fields from a backward-compatible server response", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        ...response,
        requestId: "req-123",
        data: [
          {
            ...response.data[0],
            avatarUrl: "https://example.test/avatar.png",
            role: { ...response.data[0].role, description: "System role" },
          },
        ],
        meta: { ...response.meta, hasNextPage: false },
      },
    });

    await expect(userManagementApi.list({ page: 1, limit: 10 })).resolves.toEqual(response);
  });

  it("creates, updates and resends password setup using the agreed contracts", async () => {
    const input = {
      fullName: "Nguyễn Văn A",
      email: "a@example.com",
      phone: null,
      roleCode: "NVKH" as const,
      accountStatus: "active" as const,
    };
    vi.mocked(apiClient.post)
      .mockResolvedValueOnce({
        data: { user: response.data[0], invitationStatus: "sent" },
      })
      .mockResolvedValueOnce({ data: { invitationStatus: "failed" } });
    vi.mocked(apiClient.patch).mockResolvedValue({
      data: { user: response.data[0], invitationStatus: null },
    });

    await expect(userManagementApi.create(input)).resolves.toMatchObject({
      invitationStatus: "sent",
    });
    await expect(userManagementApi.update(response.data[0].id, input)).resolves.toMatchObject({
      invitationStatus: null,
    });
    await expect(userManagementApi.resendPasswordSetup(response.data[0].id)).resolves.toEqual({
      invitationStatus: "failed",
    });

    expect(apiClient.post).toHaveBeenNthCalledWith(1, "/system/users", input);
    expect(apiClient.patch).toHaveBeenCalledWith(`/system/users/${response.data[0].id}`, input);
  });
});
