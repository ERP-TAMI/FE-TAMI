import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authApi } from "@/api/auth.api";
import ResetPasswordPage from "./ResetPasswordPage";

vi.mock("@/api/auth.api", () => ({
  authApi: {
    validatePasswordReset: vi.fn(),
    completePasswordReset: vi.fn(),
  },
}));

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authApi.validatePasswordReset).mockResolvedValue({
      valid: true,
      expiresAt: "2026-09-15T00:00:00.000Z",
    });
    vi.mocked(authApi.completePasswordReset).mockResolvedValue();
    window.history.replaceState({}, "", "/reset-password?token=reset-token");
  });
  afterEach(cleanup);

  it("removes the token from the URL and completes the reset", async () => {
    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    expect(window.location.search).toBe("");
    await screen.findByLabelText("Mật khẩu mới");
    fireEvent.change(screen.getByLabelText("Mật khẩu mới"), {
      target: { value: "new password" },
    });
    fireEvent.change(screen.getByLabelText("Nhập lại mật khẩu"), {
      target: { value: "new password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu mật khẩu mới" }));

    await waitFor(() =>
      expect(authApi.completePasswordReset).toHaveBeenCalledWith(
        "reset-token",
        "new password",
      ),
    );
    expect(await screen.findByText(/Mật khẩu đã được thay đổi/)).toBeTruthy();
  });
});
