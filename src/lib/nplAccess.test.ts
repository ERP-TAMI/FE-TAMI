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
    expect(canViewNplCost(makeUser("tpkh"))).toBe(true);
  });

  it("returns true for KT and ACCOUNTING (Kế toán)", () => {
    expect(canViewNplCost(makeUser("KT"))).toBe(true);
    expect(canViewNplCost(makeUser("kt"))).toBe(true);
    expect(canViewNplCost(makeUser("ACCOUNTING"))).toBe(true);
    expect(canViewNplCost(makeUser("accounting"))).toBe(true);
    expect(canViewNplCost(makeUser("ke_toan"))).toBe(true);
  });

  it("returns true for SA and ADMIN / GIAM_DOC (Giám đốc / Ban quản trị)", () => {
    expect(canViewNplCost(makeUser("SA"))).toBe(true);
    expect(canViewNplCost(makeUser("sa"))).toBe(true);
    expect(canViewNplCost(makeUser("ADMIN"))).toBe(true);
    expect(canViewNplCost(makeUser("GIAM_DOC"))).toBe(true);
  });

  it("returns false for NVKH", () => {
    expect(canViewNplCost(makeUser("NVKH"))).toBe(false);
    expect(canViewNplCost(makeUser("nvkh"))).toBe(false);
  });

  it("returns false for RD", () => {
    expect(canViewNplCost(makeUser("RD"))).toBe(false);
    expect(canViewNplCost(makeUser("rd"))).toBe(false);
  });

  it("returns false for null user or empty role", () => {
    expect(canViewNplCost(null)).toBe(false);
    expect(canViewNplCost(makeUser(""))).toBe(false);
  });
});
