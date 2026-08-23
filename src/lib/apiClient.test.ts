import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import apiClient, { triggerRefresh } from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";

const authResponse = {
  accessToken: "new-access-token",
  user: {
    id: "11111111-1111-1111-1111-111111111111",
    email: "sa@tami.test",
    fullName: "Quản trị hệ thống",
    roleCode: "SA",
    roleName: "Quản trị hệ thống",
    permissions: ["system.users.manage"],
  },
};

describe("triggerRefresh", () => {
  beforeEach(() => {
    useAuthStore.setState({ status: "idle", user: null, accessToken: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stores the new session and returns the access token on success", async () => {
    vi.spyOn(apiClient, "post").mockResolvedValue({ data: authResponse });

    const token = await triggerRefresh();

    expect(token).toBe("new-access-token");
    expect(useAuthStore.getState()).toMatchObject({
      status: "authenticated",
      accessToken: "new-access-token",
    });
  });

  it("dedupes concurrent calls into a single /auth/refresh request", async () => {
    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({ data: authResponse });

    const [first, second] = await Promise.all([triggerRefresh(), triggerRefresh()]);

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(first).toBe("new-access-token");
    expect(second).toBe("new-access-token");
  });

  it("clears the session and returns null when the refresh request fails", async () => {
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "stale-token",
      user: authResponse.user,
    });
    vi.spyOn(apiClient, "post").mockRejectedValue({
      isAxiosError: true,
      response: { status: 401 },
    });

    const token = await triggerRefresh();

    expect(token).toBeNull();
    expect(useAuthStore.getState()).toMatchObject({
      status: "unauthenticated",
      accessToken: null,
      user: null,
    });
  });

  it("allows a new refresh attempt after the previous one has settled", async () => {
    const postSpy = vi
      .spyOn(apiClient, "post")
      .mockRejectedValueOnce({ isAxiosError: true, response: { status: 401 } })
      .mockResolvedValueOnce({ data: authResponse });

    const first = await triggerRefresh();
    const second = await triggerRefresh();

    expect(postSpy).toHaveBeenCalledTimes(2);
    expect(first).toBeNull();
    expect(second).toBe("new-access-token");
  });
});
