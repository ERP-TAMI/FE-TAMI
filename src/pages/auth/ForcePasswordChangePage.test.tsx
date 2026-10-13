import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ForcePasswordChangePage from "./ForcePasswordChangePage";
import { useAuthStore } from "@/store/authStore";

const mocks = vi.hoisted(() => ({ changePassword: vi.fn() }));

vi.mock("@/hooks/useProfile", () => ({
  useProfile: () => ({
    changePassword: { mutateAsync: mocks.changePassword, isPending: false },
  }),
}));

const user = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "sa@tami.test",
  fullName: "Quản trị hệ thống",
  phone: null,
  roleCode: "SA",
  roleName: "Quản trị hệ thống",
  permissions: ["system.users.manage"],
  purchaseOrderMode: "FULL_ACCESS" as const,
  mustChangePassword: true,
};

afterEach(cleanup);

describe("ForcePasswordChangePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ status: "authenticated", user, accessToken: "token" });
  });

  it("clears the session and cached user data after changing the temporary password", async () => {
    mocks.changePassword.mockResolvedValue(undefined);
    const queryClient = new QueryClient();
    queryClient.setQueryData(["profile", "current"], user);
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/force-password-change"]}>
          <Routes>
            <Route path="/force-password-change" element={<ForcePasswordChangePage />} />
            <Route path="/login" element={<div>Đăng nhập bằng mật khẩu mới</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText("Mật khẩu tạm"), {
      target: { value: "Temp-Pass-482!" },
    });
    fireEvent.change(screen.getByLabelText("Mật khẩu mới"), {
      target: { value: "New-Pass-935!" },
    });
    fireEvent.change(screen.getByLabelText("Xác nhận mật khẩu mới"), {
      target: { value: "New-Pass-935!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Đổi mật khẩu và tiếp tục" }));

    await waitFor(() => expect(mocks.changePassword).toHaveBeenCalledWith({
      currentPassword: "Temp-Pass-482!",
      newPassword: "New-Pass-935!",
    }));
    expect(await screen.findByText("Đăng nhập bằng mật khẩu mới")).toBeTruthy();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });
});
