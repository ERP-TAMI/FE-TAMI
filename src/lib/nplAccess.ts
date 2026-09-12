import type { AuthUser } from "@/store/authStore";

/**
 * Roles that are allowed to see the cost/price column in NPL list.
 * - TPKH  (TP Kế hoạch)
 * - KT    (Kế toán)
 * - SA    (Giám đốc / Super Admin)
 *
 * NVKH (NV Kế hoạch) and RD (R&D) are explicitly excluded.
 */
const COST_VISIBLE_ROLES = new Set(["TPKH", "KT", "SA"]);

/**
 * Check if the current user is allowed to see the NPL cost column.
 */
export function canViewNplCost(user: AuthUser | null): boolean {
  if (!user) return false;
  return COST_VISIBLE_ROLES.has(user.roleCode);
}
