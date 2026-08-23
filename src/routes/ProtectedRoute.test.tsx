import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuthStore } from "@/store/authStore";

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/login" element={<div>Login screen</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>Dashboard content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    useAuthStore.setState({ status: "idle", user: null, accessToken: null });
  });

  afterEach(cleanup);

  it("shows a loading indicator while the session is being restored", () => {
    useAuthStore.setState({ status: "loading" });
    renderProtected();

    expect(screen.getByRole("status", { name: "Đang tải" })).toBeTruthy();
    expect(screen.queryByText("Dashboard content")).toBeNull();
  });

  it("redirects to /login when unauthenticated", () => {
    useAuthStore.setState({ status: "unauthenticated" });
    renderProtected();

    expect(screen.getByText("Login screen")).toBeTruthy();
    expect(screen.queryByText("Dashboard content")).toBeNull();
  });

  it("renders the protected content when authenticated", () => {
    useAuthStore.setState({
      status: "authenticated",
      user: {
        id: "11111111-1111-1111-1111-111111111111",
        email: "sa@tami.test",
        fullName: "Quản trị hệ thống",
        roleCode: "SA",
        roleName: "Quản trị hệ thống",
        permissions: [],
      },
      accessToken: "token",
    });
    renderProtected();

    expect(screen.getByText("Dashboard content")).toBeTruthy();
  });
});
