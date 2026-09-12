import type { AuthUser } from "@/store/authStore";

/**
 * Roles that are allowed to see the cost/price column in NPL list.
 * - TPKH       (Trưởng phòng Kế hoạch / Kinh doanh)
 * - KT / ACCOUNTING / KE_TOAN (Kế toán)
 * - SA / GIAM_DOC / DIRECTOR / ADMIN (Ban giám đốc / Quản trị)
 *
 * NVKH (Nhân viên Kế hoạch / Kinh doanh) and RD (R&D) are explicitly excluded.
 */
const COST_VISIBLE_ROLES = new Set([
  "tpkh",
  "kt",
  "accounting",
  "ke_toan",
  "sa",
  "giam_doc",
  "director",
  "admin",
]);

/**
 * Check if the current user is allowed to see the NPL cost column.
 */
export function canViewNplCost(user: AuthUser | null): boolean {
  if (!user || !user.roleCode) return false;
  return COST_VISIBLE_ROLES.has(user.roleCode.toLowerCase().trim());
}
