import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authApi } from "@/api/auth.api";
import { useAuthStore, type AuthUser } from "@/store/authStore";
import { profileKeys, useProfile } from "./useProfile";

vi.mock("@/api/auth.api", () => ({
  authApi: { me: vi.fn(), updateProfile: vi.fn(), changePassword: vi.fn() },
}));

const user: AuthUser = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "it@tami.test",
  fullName: "Nhân viên IT",
  phone: null,
  roleCode: "IT",
  roleName: "Công nghệ thông tin",
  permissions: [],
};

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, ...renderHook(() => useProfile(), { wrapper }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(authApi.me).mockResolvedValue(user);
  useAuthStore.setState({ status: "authenticated", user, accessToken: "token" });
});

describe("useProfile", () => {
  it("updates both query data and the authenticated user after saving", async () => {
    const updated = { ...user, fullName: "Tên mới", phone: "0905123456" };
    vi.mocked(authApi.updateProfile).mockResolvedValue(updated);
    const { client, result } = setup();
    await waitFor(() => expect(result.current.profile.isSuccess).toBe(true));

    await act(() =>
      result.current.updateProfile.mutateAsync({
        fullName: updated.fullName,
        phone: updated.phone,
      }),
    );

    expect(client.getQueryData(profileKeys.current)).toEqual(updated);
    expect(useAuthStore.getState().user).toEqual(updated);
  });

  it("keeps password confirmation outside the API mutation contract", async () => {
    vi.mocked(authApi.changePassword).mockResolvedValue(undefined);
    const { result } = setup();

    await act(() =>
      result.current.changePassword.mutateAsync({
        currentPassword: "current-pass",
        newPassword: "new-password",
      }),
    );

    expect(authApi.changePassword).toHaveBeenCalledWith({
      currentPassword: "current-pass",
      newPassword: "new-password",
    });
  });
});
