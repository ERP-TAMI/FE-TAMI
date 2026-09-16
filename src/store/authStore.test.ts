import { beforeEach, describe, expect, it } from "vitest";
import { readPersistedSession, useAuthStore } from "./authStore";

const user = {
  id: "e10e8593-747a-4fa8-933c-84f550e1da13",
  email: "user@tami.test",
  fullName: "Nguyễn Văn A",
  phone: "0901234567",
  roleCode: "NVKH",
  roleName: "Nhân viên kinh doanh",
  permissions: [],
};

describe("authStore profile synchronization", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useAuthStore.setState({ status: "idle", user: null, accessToken: null });
  });

  it("updates the current user while preserving and persisting the access token", () => {
    useAuthStore.getState().setSession(user, "access-token");

    useAuthStore.getState().updateUser({ ...user, fullName: "Tên mới", phone: null });

    expect(useAuthStore.getState()).toMatchObject({
      status: "authenticated",
      accessToken: "access-token",
      user: { fullName: "Tên mới", phone: null },
    });
    expect(readPersistedSession()).toMatchObject({
      accessToken: "access-token",
      user: { fullName: "Tên mới", phone: null },
    });
  });
});
