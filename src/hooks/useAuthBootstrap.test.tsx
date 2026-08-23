import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthBootstrap } from "./useAuthBootstrap";
import { useAuthStore } from "@/store/authStore";

const triggerRefresh = vi.fn();
vi.mock("@/lib/apiClient", () => ({
  triggerRefresh: (...args: unknown[]) => triggerRefresh(...args),
}));

function base64url(json: unknown): string {
  return btoa(JSON.stringify(json)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fakeJwt(expiresInSeconds: number): string {
  const header = base64url({ alg: "HS256", typ: "JWT" });
  const payload = base64url({ exp: Math.floor(Date.now() / 1000) + expiresInSeconds });
  return `${header}.${payload}.signature`;
}

const user = {
  id: "1",
  email: "sa@tami.test",
  fullName: "Quản trị hệ thống",
  roleCode: "SA",
  roleName: "Quản trị hệ thống",
  permissions: [],
};

describe("useAuthBootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    useAuthStore.setState({ status: "idle", user: null, accessToken: null });
  });

  it("goes straight to unauthenticated with no API call when nothing is persisted", async () => {
    renderHook(() => useAuthBootstrap());

    await waitFor(() => {
      expect(useAuthStore.getState().status).toBe("unauthenticated");
    });
    expect(triggerRefresh).not.toHaveBeenCalled();
  });

  it("reuses a persisted, still-valid access token with no API call", async () => {
    const accessToken = fakeJwt(600); // 10 minutes left
    window.localStorage.setItem("tami_session", JSON.stringify({ user, accessToken }));

    renderHook(() => useAuthBootstrap());

    await waitFor(() => {
      expect(useAuthStore.getState().status).toBe("authenticated");
    });
    expect(useAuthStore.getState().accessToken).toBe(accessToken);
    expect(triggerRefresh).not.toHaveBeenCalled();
  });

  it("calls /auth/refresh when the persisted access token has actually expired", async () => {
    const accessToken = fakeJwt(-60); // expired 1 minute ago
    window.localStorage.setItem("tami_session", JSON.stringify({ user, accessToken }));
    triggerRefresh.mockResolvedValue("new-token");

    renderHook(() => useAuthBootstrap());

    await waitFor(() => {
      expect(triggerRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it("falls back to unauthenticated when refreshing an expired token fails", async () => {
    const accessToken = fakeJwt(-60);
    window.localStorage.setItem("tami_session", JSON.stringify({ user, accessToken }));
    triggerRefresh.mockResolvedValue(null);

    renderHook(() => useAuthBootstrap());

    await waitFor(() => {
      expect(useAuthStore.getState().status).toBe("unauthenticated");
    });
  });
});
