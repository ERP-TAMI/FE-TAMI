import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UserAccountActionDialog } from "./UserAccountActionDialog";
import type { UserListItem } from "@/types/user-management";

const target: UserListItem = {
  id: "22222222-2222-4222-8222-222222222222",
  fullName: "Nguyễn Văn A",
  email: "a@example.com",
  phone: null,
  role: { code: "NVKH", name: "Nhân viên Kinh doanh" },
  accountStatus: "active",
  passwordSetupRequired: false,
  passwordSetupEmailStatus: null,
  passwordSetupEmailAttemptedAt: null,
};

afterEach(cleanup);

describe("UserAccountActionDialog", () => {
  it("requires and trims the reason before locking an account", async () => {
    const onConfirm = vi.fn();
    render(
      <UserAccountActionDialog
        action="lock"
        user={target}
        isSubmitting={false}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Khóa tài khoản" }));
    expect(await screen.findByText("Lý do là bắt buộc.")).toBeTruthy();
    expect(screen.getByText(/lý do này sẽ được gửi tới email của người dùng/i)).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Lý do khóa tài khoản"), {
      target: { value: "  Nghi ngờ lộ tài khoản  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Khóa tài khoản" }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith("Nghi ngờ lộ tài khoản"));
  });

  it("clearly warns that password reset revokes current access", () => {
    render(
      <UserAccountActionDialog
        action="reset"
        user={target}
        isSubmitting={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText(/mật khẩu hiện tại và tất cả phiên đăng nhập/i)).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("warns that the disable reason will be emailed to the user", () => {
    render(
      <UserAccountActionDialog
        action="disable"
        user={target}
        isSubmitting={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText(/lý do này sẽ được gửi tới email của người dùng/i)).toBeTruthy();
  });
});
