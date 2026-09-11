import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/apiClient";
import { userManagementApi } from "./user-management.api";

vi.mock("@/lib/apiClient", () => ({ default: { get: vi.fn() } }));

const response = {
  data: [
    {
      id: "9fb4d58f-0e6d-4ed5-b122-2b9f61aae115",
      fullName: "Nhân viên IT",
      email: "it@tami.test",
      phone: null,
      role: { code: "IT", name: "Công nghệ thông tin" },
      accountStatus: "active",
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
});
