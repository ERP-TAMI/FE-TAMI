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
};

afterEach(cleanup);

describe("UserForm", () => {
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
    expect(within(role).queryByRole("option", { name: "Công nghệ thông tin" })).toBeNull();
    expect(within(role).getByRole("option", { name: "Kế toán" })).toBeTruthy();
    expect(screen.queryByLabelText("Trạng thái")).toBeNull();
  });

  it("disables role and status when editing the current account", () => {
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
    expect(screen.getByLabelText("Trạng thái").hasAttribute("disabled")).toBe(true);
    expect(screen.getByText(/không thể tự đổi vai trò/i)).toBeTruthy();
  });

  it("keeps the current role and status when submitting a self profile edit", async () => {
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
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ roleCode: "IT", accountStatus: "active" }),
      ),
    );
  });

  it("maps the derived pending setup status to the editable active status", () => {
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

    expect((screen.getByLabelText("Trạng thái") as HTMLSelectElement).value).toBe("active");
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
          accountStatus: "active",
        }),
      ),
    );
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
