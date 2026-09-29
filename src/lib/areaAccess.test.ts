import { describe, expect, it } from "vitest";
import type { AuthUser } from "@/store/authStore";
import {
  canAccessEditablePurchaseOrderModule,
  canAccessItArea,
  canAccessManagement,
  canManageUsers,
  getLandingPath,
  getPostLoginPath,
} from "@/lib/areaAccess";

function user(roleCode: string, permissions: string[] = []): AuthUser {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    email: `${roleCode.toLowerCase()}@tami.test`,
    fullName: roleCode,
    phone: null,
    roleCode,
    roleName: roleCode,
    permissions,
    purchaseOrderMode: "READ_ONLY",
  };
}

describe("area access policy", () => {
  it("lands IT accounts in the IT area", () => {
    const itUser = user("IT", ["system.users.manage"]);

    expect(canAccessItArea(itUser)).toBe(true);
    expect(canManageUsers(itUser)).toBe(true);
    expect(getLandingPath(itUser)).toBe("/it/users");
  });

  it("lands management accounts in the management area", () => {
    const sa = user("SA", ["management.area.access", "system.users.manage"]);

    expect(canAccessManagement(sa)).toBe(true);
    expect(canManageUsers(sa)).toBe(true);
    expect(getLandingPath(sa)).toBe("/management/dashboard");
  });

  it("does not grant user management from role or area alone", () => {
    expect(canManageUsers(user("IT"))).toBe(false);
    expect(canManageUsers(user("SA", ["management.area.access"]))).toBe(false);
    expect(canManageUsers(user("NVKH"))).toBe(false);
    expect(getLandingPath(user("IT"))).toBe("/it/profile");
  });

  it("allows only full-access SA users into the editable PO module", () => {
    expect(canAccessEditablePurchaseOrderModule(user("SA"))).toBe(false);
    expect(
      canAccessEditablePurchaseOrderModule({
        ...user("SA"),
        purchaseOrderMode: "FULL_ACCESS",
      }),
    ).toBe(true);
    expect(canAccessEditablePurchaseOrderModule(user("NVKH"))).toBe(true);
    expect(
      canAccessEditablePurchaseOrderModule(
        user("TPKH", ["management.area.access"]),
      ),
    ).toBe(false);
  });

  it("keeps only authorized internal deep links after login", () => {
    const itUser = user("IT", ["system.users.manage"]);
    const sa = user("SA", ["management.area.access", "system.users.manage"]);
    const employee = user("NVKH");

    expect(getPostLoginPath(itUser, "/it/users")).toBe("/it/users");
    expect(getPostLoginPath(itUser, "/management/users")).toBe("/it/users");
    expect(getPostLoginPath(sa, "/management/users")).toBe("/management/users");
    expect(getPostLoginPath(employee, "/admin/users")).toBe("/dashboard");
    expect(getPostLoginPath(employee, "//outside.example/path")).toBe("/dashboard");
  });
});
