import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/apiClient";
import { authApi } from "./auth.api";

vi.mock("@/lib/apiClient", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("authApi password reset", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requests a password-reset email through the public endpoint", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { status: "pending" } });

    await expect(authApi.requestPasswordReset("user@tami.test")).resolves.toEqual({
      status: "pending",
    });
    expect(apiClient.post).toHaveBeenCalledWith("/auth/forgot-password", {
      email: "user@tami.test",
    });
  });

  it("uses dedicated validate and complete endpoints", async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { valid: true, expiresAt: "2026-09-15T00:00:00.000Z" },
    });

    await authApi.validatePasswordReset("token");
    await authApi.completePasswordReset("token", "new password");

    expect(apiClient.post).toHaveBeenNthCalledWith(1, "/auth/password-reset/validate", {
      token: "token",
    });
    expect(apiClient.post).toHaveBeenNthCalledWith(2, "/auth/password-reset/complete", {
      token: "token",
      password: "new password",
    });
  });
});

describe("authApi profile", () => {
  const user = {
    id: "e10e8593-747a-4fa8-933c-84f550e1da13",
    email: "user@tami.test",
    fullName: "Nguyễn Văn A",
    phone: "0901234567",
    roleCode: "NVKH",
    roleName: "Nhân viên kinh doanh",
    permissions: [],
  };

  beforeEach(() => vi.clearAllMocks());

  it("updates only editable profile fields and parses the response", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({
      data: { ...user, fullName: "Tên mới", phone: null },
    });

    await expect(
      authApi.updateProfile({ fullName: "Tên mới", phone: null }),
    ).resolves.toMatchObject({ fullName: "Tên mới", phone: null });
    expect(apiClient.patch).toHaveBeenCalledWith("/auth/me", {
      fullName: "Tên mới",
      phone: null,
    });
  });

  it("changes the current user's password without sending its confirmation", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: undefined });

    await authApi.changePassword({
      currentPassword: "current-password",
      newPassword: "new-password",
    });

    expect(apiClient.patch).toHaveBeenCalledWith("/auth/me/password", {
      currentPassword: "current-password",
      newPassword: "new-password",
    });
  });
});
