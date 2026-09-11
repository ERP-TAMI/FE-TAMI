import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosError } from "axios";
import { authApi } from "@/api/auth.api";
import SetPasswordPage from "./SetPasswordPage";

vi.mock("@/api/auth.api", () => ({
  authApi: {
    validatePasswordSetup: vi.fn(),
    completePasswordSetup: vi.fn(),
  },
}));

function renderPage(token = "setup-token") {
  window.history.pushState({}, "", `/set-password?token=${token}`);
  return render(
    <MemoryRouter>
      <SetPasswordPage />
    </MemoryRouter>,
  );
}

describe("SetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authApi.validatePasswordSetup).mockResolvedValue({
      valid: true,
      expiresAt: "2026-09-12T00:00:00.000Z",
    });
    vi.mocked(authApi.completePasswordSetup).mockResolvedValue();
  });

  afterEach(cleanup);

  it("removes the token from the address bar and submits a valid password", async () => {
    renderPage();
    expect(window.location.search).toBe("");
    expect(await screen.findByLabelText("Mật khẩu mới")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Mật khẩu mới"), {
      target: { value: "a secure passphrase" },
    });
    fireEvent.change(screen.getByLabelText("Nhập lại mật khẩu"), {
      target: { value: "a secure passphrase" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Đặt mật khẩu" }));

    await waitFor(() =>
      expect(authApi.completePasswordSetup).toHaveBeenCalledWith(
        "setup-token",
        "a secure passphrase",
      ),
    );
    expect(
      await screen.findByText("Bạn có thể đăng nhập nếu tài khoản đang hoạt động."),
    ).toBeTruthy();
  });

  it("can show and hide both password fields", async () => {
    vi.mocked(authApi.validatePasswordSetup).mockResolvedValue({
      valid: true,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    window.history.replaceState({}, "", "/set-password?token=valid-token");
    renderPage();

    const password = await screen.findByLabelText("Mật khẩu mới");
    const confirmation = screen.getByLabelText("Nhập lại mật khẩu");
    expect(password.getAttribute("type")).toBe("password");

    fireEvent.click(screen.getByRole("button", { name: "Hiện mật khẩu" }));
    expect(password.getAttribute("type")).toBe("text");
    expect(confirmation.getAttribute("type")).toBe("text");

    fireEvent.click(screen.getByRole("button", { name: "Ẩn mật khẩu" }));
    expect(password.getAttribute("type")).toBe("password");
  });

  it("shows an expired-link message", async () => {
    const error = new AxiosError("expired");
    error.response = {
      data: { code: "PASSWORD_SETUP_TOKEN_EXPIRED", message: "expired" },
      status: 410,
      statusText: "Gone",
      headers: {},
      config: { headers: {} } as never,
    };
    vi.mocked(authApi.validatePasswordSetup).mockRejectedValue(error);
    renderPage();

    expect(await screen.findByText(/đã hết hạn/i)).toBeTruthy();
    expect(screen.queryByLabelText("Mật khẩu mới")).toBeNull();
  });

  it("validates matching passwords with the approved length policy", async () => {
    renderPage();
    await screen.findByLabelText("Mật khẩu mới");
    fireEvent.change(screen.getByLabelText("Mật khẩu mới"), { target: { value: "short" } });
    fireEvent.change(screen.getByLabelText("Nhập lại mật khẩu"), { target: { value: "other" } });
    fireEvent.click(screen.getByRole("button", { name: "Đặt mật khẩu" }));

    expect(await screen.findByText("Mật khẩu phải có ít nhất 8 ký tự")).toBeTruthy();
    expect(screen.getByText("Mật khẩu nhập lại không khớp")).toBeTruthy();
    expect(authApi.completePasswordSetup).not.toHaveBeenCalled();
  });
});
