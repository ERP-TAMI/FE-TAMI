import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@/store/authStore";
import { ProfileInfoForm } from "./ProfileInfoForm";

const user: AuthUser = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "it@tami.test",
  fullName: "Nhân viên IT",
  phone: "0905123456",
  roleCode: "IT",
  roleName: "Công nghệ thông tin",
  permissions: [],
};

afterEach(cleanup);

describe("ProfileInfoForm", () => {
  it("renders only editable profile fields and submits their normalized values", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ProfileInfoForm user={user} isSubmitting={false} onSubmit={onSubmit} />);

    expect(screen.queryByLabelText("Email")).toBeNull();
    expect(screen.queryByLabelText("Vai trò")).toBeNull();

    fireEvent.change(screen.getByLabelText("Họ và tên"), {
      target: { value: "  Nguyễn Văn A  " },
    });
    fireEvent.change(screen.getByLabelText("Số điện thoại"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ fullName: "Nguyễn Văn A", phone: null }),
    );
  });

  it("shows validation feedback for an invalid phone number", async () => {
    render(<ProfileInfoForm user={user} isSubmitting={false} onSubmit={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Số điện thoại"), { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    expect(await screen.findByText("Số điện thoại không hợp lệ")).toBeTruthy();
  });
});
