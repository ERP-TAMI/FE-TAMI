import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useProfile } from "@/hooks/useProfile";
import ProfilePage from "./ProfilePage";

vi.mock("@/hooks/useProfile", () => ({ useProfile: vi.fn() }));

const mockedUseProfile = vi.mocked(useProfile);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ProfilePage", () => {
  it("keeps the profile focused on personal information and password security", () => {
    mockedUseProfile.mockReturnValue({
      profile: {
        data: {
          id: "11111111-1111-4111-8111-111111111111",
          email: "it@tami.test",
          fullName: "Công nghệ thông tin",
          phone: "0912345678",
          roleCode: "IT",
          roleName: "Công nghệ thông tin",
          permissions: ["dashboard.view", "users.read"],
        },
        isPending: false,
        isError: false,
        refetch: vi.fn(),
      },
      updateProfile: { isPending: false, mutateAsync: vi.fn() },
      changePassword: { isPending: false, mutateAsync: vi.fn() },
    } as never);

    render(
      <MemoryRouter initialEntries={["/it/profile"]}>
        <ProfilePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Thông tin cá nhân" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Bảo mật" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Đổi mật khẩu" })).toBeTruthy();
    expect(screen.queryByText("Thông tin tổ chức & tài khoản")).toBeNull();
    expect(screen.queryByText("Xác thực hai yếu tố (2FA)")).toBeNull();
  });
});
