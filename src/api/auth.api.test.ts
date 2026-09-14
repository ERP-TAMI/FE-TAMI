import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/apiClient";
import { authApi } from "./auth.api";

vi.mock("@/lib/apiClient", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
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
