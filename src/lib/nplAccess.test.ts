import { describe, it, expect } from "vitest";
import { canViewNplCost } from "@/lib/nplAccess";
import type { AuthUser } from "@/store/authStore";

function makeUser(roleCode: string): AuthUser {
  return {
    id: "u1",
    email: "test@tami.vn",
    fullName: "Test User",
    roleCode,
    roleName: roleCode,
    permissions: [],
  };
}

describe("canViewNplCost", () => {
  it("returns true for TPKH", () => {
    expect(canViewNplCost(makeUser("TPKH"))).toBe(true);
  });

  it("returns true for KT (Kế toán)", () => {
    expect(canViewNplCost(makeUser("KT"))).toBe(true);
  });

  it("returns true for SA (Giám đốc)", () => {
    expect(canViewNplCost(makeUser("SA"))).toBe(true);
  });

  it("returns false for NVKH", () => {
    expect(canViewNplCost(makeUser("NVKH"))).toBe(false);
  });

  it("returns false for RD", () => {
    expect(canViewNplCost(makeUser("RD"))).toBe(false);
  });

  it("returns false for null user", () => {
    expect(canViewNplCost(null)).toBe(false);
  });
});
