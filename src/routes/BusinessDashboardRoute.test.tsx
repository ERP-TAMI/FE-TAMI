import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { BusinessDashboardRoute } from "./BusinessDashboardRoute";
import { useAuthStore, type AuthUser } from "@/store/authStore";

function user(roleCode: string): AuthUser {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    email: "dashboard@tami.test",
    fullName: "Dashboard test",
    phone: null,
    roleCode,
    roleName: roleCode,
    permissions: [],
    purchaseOrderMode: "READ_ONLY",
  };
}

afterEach(() => {
  cleanup();
  useAuthStore.setState({ user: null });
});

describe("BusinessDashboardRoute", () => {
  function renderRoute(roleCode: string) {
    useAuthStore.setState({ user: user(roleCode) });
    return render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<BusinessDashboardRoute />}>
            <Route path="/dashboard" element={<div>Business dashboard</div>} />
          </Route>
          <Route path="/it/profile" element={<div>IT profile</div>} />
          <Route path="/management/dashboard" element={<div>Management dashboard</div>} />
          <Route path="/forbidden" element={<div>Forbidden</div>} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("allows an operational role to open the shared dashboard", () => {
    renderRoute("NVKH");
    expect(screen.getByText("Business dashboard")).toBeTruthy();
  });

  it("redirects IT and unknown roles away from the operational dashboard", () => {
    renderRoute("IT");
    expect(screen.getByText("IT profile")).toBeTruthy();
    cleanup();
    renderRoute("UNKNOWN");
    expect(screen.getByText("Forbidden")).toBeTruthy();
  });
});
