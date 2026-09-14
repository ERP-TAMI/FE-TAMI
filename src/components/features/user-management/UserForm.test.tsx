import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UserForm } from "./UserForm";
import type { UserListItem } from "@/types/user-management";

const existing: UserListItem = {
  id: "11111111-1111-4111-8111-111111111111",
  fullName: "Nhân viên IT",
  email: "it@example.test",
  phone: null,
  role: { code: "IT", name: "Công nghệ thông tin" },
  accountStatus: "active",
  passwordSetupRequired: false,
  passwordSetupEmailStatus: null,
  passwordSetupEmailAttemptedAt: null,
  accountLockEmailStatus: null,
};

afterEach(cleanup);

describe("UserForm", () => {
  it("does not register a hidden account status field", () => {
    render(
      <UserForm
        mode="create"
        actorRole="IT"
        actorId="actor-id"
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(document.querySelector('input[name="accountStatus"]')).toBeNull();
  });
  it("uses role labels consistent with backend role names", () => {
    render(
      <UserForm
        mode="create"
        actorId="sa"
        actorRole="SA"
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const role = screen.getByLabelText("Vai trò");
    expect(within(role).getByRole("option", { name: "SA / Giám đốc" })).toBeTruthy();
    expect(within(role).getByRole("option", { name: "IT" })).toBeTruthy();
    expect(within(role).getByRole("option", { name: "R&D" })).toBeTruthy();
  });

  it("only exposes business roles when the actor is IT", () => {
    render(
      <UserForm
        mode="create"
        actorId="actor"
        actorRole="IT"
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    const role = screen.getByLabelText("Vai trò");
    expect(within(role).queryByRole("option", { name: "SA / Giám đốc" })).toBeNull();
    expect(within(role).queryByRole("option", { name: "IT" })).toBeNull();
    expect(within(role).getByRole("option", { name: "Kế toán" })).toBeTruthy();
    expect(screen.queryByLabelText("Trạng thái")).toBeNull();
  });

  it("disables role and keeps account status out of profile editing", () => {
    render(
      <UserForm
        mode="edit"
        user={existing}
        actorId={existing.id}
        actorRole="IT"
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    const role = screen.getByLabelText("Vai trò") as HTMLSelectElement;
    expect(role.hasAttribute("disabled")).toBe(true);
    expect(role.value).toBe("IT");
    expect(screen.queryByLabelText("Trạng thái")).toBeNull();
    expect(screen.getByText(/không thể tự đổi vai trò/i)).toBeTruthy();
  });

  it("keeps the current role but does not submit status from a profile edit", async () => {
    const onSubmit = vi.fn();
    render(
      <UserForm
        mode="edit"
        user={existing}
        actorId={existing.id}
        actorRole="IT"
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText("Họ và tên"), {
      target: { value: "Nhân viên IT cập nhật" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ roleCode: "IT" })),
    );
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("accountStatus");
  });

  it("does not expose pending setup status in profile editing", () => {
    render(
      <UserForm
        mode="edit"
        user={{ ...existing, accountStatus: "pending_setup", passwordSetupRequired: true }}
        actorId="sa"
        actorRole="SA"
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText("Trạng thái")).toBeNull();
  });

  it("normalizes email and empty phone before submit", async () => {
    const onSubmit = vi.fn();
    render(
      <UserForm
        mode="create"
        actorId="sa"
        actorRole="SA"
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.change(screen.getByLabelText("Họ và tên"), { target: { value: "Nguyễn A" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "USER@Example.COM" } });
    fireEvent.click(screen.getByRole("button", { name: "Tạo người dùng" }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "user@example.com",
          phone: null,
        }),
      ),
    );
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("accountStatus");
  });

  it("declares browser autofill semantics for email and phone", () => {
    render(
      <UserForm
        mode="create"
        actorId="sa"
        actorRole="SA"
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Email").getAttribute("autocomplete")).toBe("email");
    expect(screen.getByLabelText("Số điện thoại").getAttribute("autocomplete")).toBe("tel");
  });
});
