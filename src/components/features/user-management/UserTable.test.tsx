import { cleanup, render, screen } from "@testing-library/react";
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
    expect(screen.getByRole("button", { name: "Gửi lại email" })).toBeTruthy();
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
});
