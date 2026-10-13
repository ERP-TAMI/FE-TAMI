import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuthStore } from "@/store/authStore";

function renderProtected(initialPath = "/dashboard") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login screen</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>Dashboard content</div>} />
          <Route path="/force-password-change" element={<div>Change password screen</div>} />
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
        phone: null,
        roleCode: "SA",
        roleName: "Quản trị hệ thống",
        permissions: [],
        purchaseOrderMode: "READ_ONLY",
        mustChangePassword: false,
      },
      accessToken: "token",
    });
    renderProtected();

    expect(screen.getByText("Dashboard content")).toBeTruthy();
  });

  it("redirects temporary-password sessions to the forced password page", () => {
    useAuthStore.setState({
      status: "authenticated",
      user: {
        id: "11111111-1111-1111-1111-111111111111",
        email: "sa@tami.test",
        fullName: "Quản trị hệ thống",
        phone: null,
        roleCode: "SA",
        roleName: "Quản trị hệ thống",
        permissions: [],
        purchaseOrderMode: "READ_ONLY",
        mustChangePassword: true,
      },
      accessToken: "token",
    });
    renderProtected();

    expect(screen.getByText("Change password screen")).toBeTruthy();
    expect(screen.queryByText("Dashboard content")).toBeNull();
  });

  it("allows a temporary-password session to reach its password page", () => {
    useAuthStore.setState({
      status: "authenticated",
      user: {
        id: "11111111-1111-1111-1111-111111111111",
        email: "sa@tami.test",
        fullName: "Quản trị hệ thống",
        phone: null,
        roleCode: "SA",
        roleName: "Quản trị hệ thống",
        permissions: [],
        purchaseOrderMode: "READ_ONLY",
        mustChangePassword: true,
      },
      accessToken: "token",
    });
    renderProtected("/force-password-change");

    expect(screen.getByText("Change password screen")).toBeTruthy();
  });
});
