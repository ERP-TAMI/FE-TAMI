import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { AuditLogRedirect } from "@/routes/AuditLogRedirect";
import { useAuthStore, type AuthUser } from "@/store/authStore";

function userWith(roleCode: string, permissions: string[]): AuthUser {
  return {
    id: "u1",
    email: "user@tami.test",
    fullName: "User",
    phone: null,
    roleCode,
    roleName: roleCode,
    permissions,
    purchaseOrderMode: "READ_ONLY",
  } as AuthUser;
}

function renderRedirect(user: AuthUser) {
  useAuthStore.setState({ status: "authenticated", user, accessToken: "token" });
  render(
    <MemoryRouter initialEntries={["/audit-log"]}>
      <Routes>
        <Route path="/audit-log" element={<AuditLogRedirect />} />
        <Route path="/management/audit-log" element={<p>management audit</p>} />
        <Route path="/it/audit-log" element={<p>it audit</p>} />
        <Route path="/forbidden" element={<p>forbidden</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AuditLogRedirect", () => {
  afterEach(() => {
    cleanup();
    useAuthStore.setState({ status: "idle", user: null, accessToken: null });
  });

  it("sends management users to the management audit log", () => {
    renderRedirect(userWith("SA", ["management.area.access"]));
    expect(screen.getByText("management audit")).toBeTruthy();
  });

  it("sends IT users to the IT audit log", () => {
    renderRedirect(userWith("IT", []));
    expect(screen.getByText("it audit")).toBeTruthy();
  });

  it("forbids users who belong to neither area", () => {
    renderRedirect(userWith("NVKH", []));
    expect(screen.getByText("forbidden")).toBeTruthy();
  });
});
