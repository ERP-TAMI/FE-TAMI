import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { UserListItem } from "@/types/user-management";
import { UserTable } from "./UserTable";

afterEach(cleanup);

const user: UserListItem = {
  id: "9fb4d58f-0e6d-4ed5-b122-2b9f61aae115",
  fullName: "Nguyễn Văn A",
  email: "a@example.test",
  phone: null,
  role: { code: "NVKH", name: "Nhân viên Kế hoạch" },
  accountStatus: "pending_setup",
  passwordSetupRequired: true,
  passwordSetupEmailStatus: "failed",
  passwordSetupEmailAttemptedAt: "2026-09-12T12:00:00.000Z",
};

describe("UserTable", () => {
  it("shows an accessible warning when the latest setup email failed", () => {
    render(<UserTable users={[user]} onEdit={vi.fn()} onResend={vi.fn()} />);

    expect(screen.getByLabelText("Lần gửi email đặt mật khẩu gần nhất thất bại")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: `Mở thao tác cho ${user.fullName}` }));
    expect(screen.getByRole("menuitem", { name: "Gửi lại email" })).toBeTruthy();
  });

  it("does not show a failure warning while delivery is pending", () => {
    render(
      <UserTable
        users={[{ ...user, passwordSetupEmailStatus: "pending" }]}
        onEdit={vi.fn()}
        onResend={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText("Lần gửi email đặt mật khẩu gần nhất thất bại")).toBeNull();
  });

  it("offers only actions that match the current account state", () => {
    const lockedUser = {
      ...user,
      id: "22222222-2222-4222-8222-222222222222",
      fullName: "Tài khoản bị khóa",
      accountStatus: "locked" as const,
      passwordSetupRequired: false,
    };
    render(
      <UserTable
        users={[user, lockedUser]}
        onEdit={vi.fn()}
        canManage={() => true}
        canManageAccount={() => true}
        onAccountAction={vi.fn()}
      />,
    );

    expect(screen.queryByRole("combobox")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: `Mở thao tác cho ${user.fullName}` }));
    const pendingActions = within(
      screen.getByRole("menu", { name: `Thao tác với ${user.fullName}` }),
    );
    expect(pendingActions.getByRole("menuitem", { name: "Khóa tài khoản" })).toBeTruthy();
    expect(pendingActions.queryByRole("menuitem", { name: "Đặt lại mật khẩu" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: `Mở thao tác cho ${lockedUser.fullName}` }));
    const lockedActions = within(
      screen.getByRole("menu", { name: `Thao tác với ${lockedUser.fullName}` }),
    );
    expect(lockedActions.getByRole("menuitem", { name: "Mở khóa" })).toBeTruthy();
    expect(lockedActions.getByRole("menuitem", { name: "Đặt lại mật khẩu" })).toBeTruthy();
    expect(lockedActions.queryByRole("menuitem", { name: "Khóa tài khoản" })).toBeNull();
  });

  it("runs an account action from the overflow menu and then closes it", () => {
    const onAccountAction = vi.fn();
    render(
      <UserTable
        users={[{ ...user, accountStatus: "active", passwordSetupRequired: false }]}
        onEdit={vi.fn()}
        canManage={() => true}
        canManageAccount={() => true}
        onAccountAction={onAccountAction}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: `Mở thao tác cho ${user.fullName}` }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Khóa tài khoản" }));

    expect(onAccountAction).toHaveBeenCalledWith(expect.objectContaining({ id: user.id }), "lock");
    expect(screen.queryByRole("menu", { name: `Thao tác với ${user.fullName}` })).toBeNull();
  });
});
