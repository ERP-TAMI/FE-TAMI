import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChangePasswordModal } from "./ChangePasswordModal";

afterEach(cleanup);

describe("ChangePasswordModal", () => {
  it("lets keyboard users reveal and hide every password field", () => {
    render(
      <ChangePasswordModal
        open={true}
        isSubmitting={false}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const currentPassword = screen.getByLabelText("Mật khẩu hiện tại");
    const visibilityButtons = screen.getAllByRole("button", { name: /^Hiện / });

    expect(visibilityButtons).toHaveLength(3);
    for (const button of visibilityButtons) {
      expect(button.getAttribute("tabindex")).toBeNull();
      expect(button.getAttribute("aria-pressed")).toBe("false");
    }

    expect(currentPassword.getAttribute("type")).toBe("password");
    fireEvent.click(visibilityButtons[0]);
    expect(currentPassword.getAttribute("type")).toBe("text");
    expect(
      screen.getByRole("button", { name: "Ẩn mật khẩu hiện tại" }).getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("cannot be dismissed while the password request is running", () => {
    const onClose = vi.fn();

    render(
      <ChangePasswordModal
        open={true}
        isSubmitting={true}
        onSubmit={vi.fn()}
        onClose={onClose}
      />,
    );

    expect(
      (screen.getByRole("button", { name: "Đóng hộp thoại" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("validates mismatching passwords and submits on valid input", async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();

    render(
      <ChangePasswordModal
        open={true}
        isSubmitting={false}
        onSubmit={onSubmit}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole("heading", { name: "Đổi mật khẩu tài khoản" })).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Mật khẩu hiện tại"), {
      target: { value: "old-password-123" },
    });
    fireEvent.change(screen.getByLabelText("Mật khẩu mới"), {
      target: { value: "new-password-123" },
    });
    fireEvent.change(screen.getByLabelText("Xác nhận mật khẩu mới"), {
      target: { value: "different-password" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Cập nhật mật khẩu" }));
    expect(await screen.findByText("Mật khẩu xác nhận không khớp")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Xác nhận mật khẩu mới"), {
      target: { value: "new-password-123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật mật khẩu" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        currentPassword: "old-password-123",
        newPassword: "new-password-123",
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("calls onClose when cancel button is clicked", () => {
    const onClose = vi.fn();

    render(
      <ChangePasswordModal
        open={true}
        isSubmitting={false}
        onSubmit={vi.fn()}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
    expect(onClose).toHaveBeenCalled();
  });
});
