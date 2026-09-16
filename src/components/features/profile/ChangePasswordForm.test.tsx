import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChangePasswordForm } from "./ChangePasswordForm";

afterEach(cleanup);

function fillPasswords(currentPassword: string, newPassword: string, confirmation: string) {
  fireEvent.change(screen.getByLabelText("Mật khẩu hiện tại"), {
    target: { value: currentPassword },
  });
  fireEvent.change(screen.getByLabelText("Mật khẩu mới"), { target: { value: newPassword } });
  fireEvent.change(screen.getByLabelText("Xác nhận mật khẩu mới"), {
    target: { value: confirmation },
  });
}

function openForm() {
  fireEvent.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));
}

describe("ChangePasswordForm", () => {
  it("rejects a confirmation that does not match", async () => {
    render(<ChangePasswordForm isSubmitting={false} onSubmit={vi.fn()} />);
    openForm();
    fillPasswords("current-pass", "new-password", "different-password");
    fireEvent.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));

    expect(await screen.findByText("Mật khẩu xác nhận không khớp")).toBeTruthy();
  });

  it("rejects reusing the current password", async () => {
    render(<ChangePasswordForm isSubmitting={false} onSubmit={vi.fn()} />);
    openForm();
    fillPasswords("same-password", "same-password", "same-password");
    fireEvent.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));

    expect(await screen.findByText("Mật khẩu mới phải khác mật khẩu hiện tại")).toBeTruthy();
  });

  it("submits only current and new passwords and clears the form", async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<ChangePasswordForm isSubmitting={false} onSubmit={onSubmit} />);
    openForm();
    fillPasswords("current-pass", "new-password", "new-password");
    fireEvent.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        currentPassword: "current-pass",
        newPassword: "new-password",
      }),
    );
    await waitFor(() =>
      expect(screen.queryByLabelText("Mật khẩu hiện tại")).toBeNull(),
    );
  });

  it("keeps the form open when the request is handled as a failure", async () => {
    const onSubmit = vi.fn().mockResolvedValue(false);
    render(<ChangePasswordForm isSubmitting={false} onSubmit={onSubmit} />);
    openForm();
    fillPasswords("wrong-password", "new-password", "new-password");
    fireEvent.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect((screen.getByLabelText("Mật khẩu hiện tại") as HTMLInputElement).value).toBe(
      "wrong-password",
    );
  });

  it("keeps password fields hidden until requested and clears them when cancelled", async () => {
    render(<ChangePasswordForm isSubmitting={false} onSubmit={vi.fn()} />);

    expect(screen.queryByLabelText("Mật khẩu hiện tại")).toBeNull();
    openForm();
    expect(await screen.findByLabelText("Mật khẩu hiện tại")).toBe(document.activeElement);
    fillPasswords("current-pass", "new-password", "new-password");
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));

    expect(screen.queryByLabelText("Mật khẩu hiện tại")).toBeNull();
    openForm();
    expect((screen.getByLabelText("Mật khẩu hiện tại") as HTMLInputElement).value).toBe("");
  });
});
