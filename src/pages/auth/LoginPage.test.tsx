import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "@/pages/auth/LoginPage";
import { authApi } from "@/api/auth.api";
import { useAuthStore } from "@/store/authStore";

vi.mock("@/api/auth.api", () => ({
  authApi: {
    login: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ status: "idle", user: null, accessToken: null });
  });

  afterEach(cleanup);

  it("renders the login form", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Đăng nhập" })).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Mật khẩu")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Quên mật khẩu?" }).getAttribute("href")).toBe(
      "/forgot-password",
    );
  });

  it("places the forgot-password action after the password field", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    const password = screen.getByLabelText("Mật khẩu");
    const forgotPassword = screen.getByRole("link", { name: "Quên mật khẩu?" });

    expect(
      password.compareDocumentPosition(forgotPassword) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("logs in successfully and redirects to the dashboard", async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      accessToken: "signed.access.token",
      user: {
        id: "11111111-1111-1111-1111-111111111111",
        email: "sa@tami.test",
        fullName: "Quản trị hệ thống",
        roleCode: "SA",
        roleName: "Quản trị hệ thống",
        permissions: ["management.area.access"],
      },
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    fillAndSubmit("sa@tami.test", "correct-password");

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith("sa@tami.test", "correct-password");
    });
    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(mockNavigate).toHaveBeenCalledWith("/management/dashboard", { replace: true });
  });

  it("redirects an IT login to the IT dashboard", async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      accessToken: "signed.it.token",
      user: {
        id: "22222222-2222-4222-8222-222222222222",
        email: "it@tami.test",
        fullName: "Nhân viên IT",
        roleCode: "IT",
        roleName: "Công nghệ thông tin",
        permissions: ["system.users.manage"],
      },
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    fillAndSubmit("it@tami.test", "correct-password");

    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
    expect(mockNavigate).toHaveBeenCalledWith("/it/dashboard", { replace: true });
  });

  it("shows a Vietnamese error for wrong credentials and does not navigate", async () => {
    vi.mocked(authApi.login).mockRejectedValue({
      isAxiosError: true,
      response: { status: 401, data: { code: "INVALID_CREDENTIALS" } },
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    fillAndSubmit("sa@tami.test", "wrong-password");

    expect(await screen.findByText("Email hoặc mật khẩu không đúng.")).toBeTruthy();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows the administrator-lock message for a manually locked account", async () => {
    vi.mocked(authApi.login).mockRejectedValue({
      isAxiosError: true,
      response: { status: 403, data: { code: "ACCOUNT_MANUALLY_LOCKED" } },
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    fillAndSubmit("sa@tami.test", "whatever");

    expect(
      await screen.findByText(
        "Tài khoản đã bị quản trị viên khóa. Vui lòng liên hệ quản trị viên.",
      ),
    ).toBeTruthy();
  });

  it("shows the retry message for a temporary failed-login lockout", async () => {
    vi.mocked(authApi.login).mockRejectedValue({
      isAxiosError: true,
      response: { status: 403, data: { code: "ACCOUNT_TEMPORARILY_LOCKED" } },
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    fillAndSubmit("sa@tami.test", "whatever");

    expect(
      await screen.findByText(
        "Tài khoản đang tạm khoá do đăng nhập sai nhiều lần. Vui lòng thử lại sau.",
      ),
    ).toBeTruthy();
  });

  it("shows the unlock time returned on the fifth failed attempt", async () => {
    vi.mocked(authApi.login).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 403,
        data: {
          code: "ACCOUNT_TEMPORARILY_LOCKED",
          lockedUntil: "2026-09-14T10:15:00.000Z",
        },
      },
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    fillAndSubmit("sa@tami.test", "wrong-password");

    expect(await screen.findByText(/Có thể thử lại lúc/)).toBeTruthy();
  });

  it("shows a connection error message when the request has no response", async () => {
    vi.mocked(authApi.login).mockRejectedValue({ isAxiosError: true, response: undefined });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    fillAndSubmit("sa@tami.test", "whatever");

    expect(
      await screen.findByText(
        "Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.",
      ),
    ).toBeTruthy();
  });
});
