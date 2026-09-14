import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosError } from "axios";
import { authApi } from "@/api/auth.api";
import ForgotPasswordPage from "./ForgotPasswordPage";

vi.mock("@/api/auth.api", () => ({
  authApi: { requestPasswordReset: vi.fn() },
}));

describe("ForgotPasswordPage", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("requests a password-reset email and shows the accepted state", async () => {
    vi.mocked(authApi.requestPasswordReset).mockResolvedValue({ status: "pending" });
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@tami.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gửi liên kết đặt lại" }));

    await waitFor(() =>
      expect(authApi.requestPasswordReset).toHaveBeenCalledWith("user@tami.test"),
    );
    expect(await screen.findByText(/user@tami\.test/)).toBeTruthy();
  });

  it("shows the explicit missing-email message required by the task", async () => {
    const error = new AxiosError("missing");
    error.response = {
      data: { code: "EMAIL_NOT_FOUND", message: "missing" },
      status: 404,
      statusText: "Not Found",
      headers: {},
      config: { headers: {} } as never,
    };
    vi.mocked(authApi.requestPasswordReset).mockRejectedValue(error);
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "missing@tami.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gửi liên kết đặt lại" }));

    expect(await screen.findByText("Email này chưa tồn tại trong hệ thống.")).toBeTruthy();
  });
});
