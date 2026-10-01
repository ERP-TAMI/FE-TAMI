import type { AuthUser } from "@/store/authStore";
import { canAccessManagement } from "@/lib/managementAccess";

export { canAccessManagement };

const USER_MANAGEMENT_PERMISSION = "system.users.manage";
const AUDIT_LOG_PERMISSION = "system.audit.view";

export function canAccessItArea(user: AuthUser | null): boolean {
  return user?.roleCode === "IT";
}

export function canManageUsers(user: AuthUser | null): boolean {
  return user?.permissions.includes(USER_MANAGEMENT_PERMISSION) ?? false;
}

export function canViewAuditLog(user: AuthUser | null): boolean {
  return user?.permissions.includes(AUDIT_LOG_PERMISSION) ?? false;
}

export function canManagePurchaseOrders(user: AuthUser | null): boolean {
  return user?.roleCode === "SA" && user.purchaseOrderMode === "FULL_ACCESS";
}

export function canManagePurchaseOrderProductStatus(user: AuthUser | null): boolean {
  return user?.roleCode === "SA" || user?.roleCode === "TPKH";
}

export function canAccessEditablePurchaseOrderModule(user: AuthUser | null): boolean {
  if (!user) return false;
  if (user.roleCode === "SA") return canManagePurchaseOrders(user);
  return !canAccessManagement(user);
}

export function getLandingPath(user: AuthUser | null): string {
  if (canAccessItArea(user)) return canManageUsers(user) ? "/it/users" : "/it/profile";
  if (canAccessManagement(user)) return "/management/dashboard";
  return "/dashboard";
}

function isWithin(path: string, area: string): boolean {
  return path === area || path.startsWith(`${area}/`);
}

export function getPostLoginPath(user: AuthUser, requestedPath?: string): string {
  const landingPath = getLandingPath(user);
  if (!requestedPath || !requestedPath.startsWith("/") || requestedPath.startsWith("//")) {
    return landingPath;
  }
  if (requestedPath === "/login") return landingPath;

  if (isWithin(requestedPath, "/it")) {
    if (!canAccessItArea(user)) return landingPath;
    if (isWithin(requestedPath, "/it/users") && !canManageUsers(user)) return landingPath;
    return requestedPath;
  }

  if (isWithin(requestedPath, "/management")) {
    if (!canAccessManagement(user)) return landingPath;
    if (isWithin(requestedPath, "/management/users") && !canManageUsers(user)) {
      return landingPath;
    }
    return requestedPath;
  }

  if (isWithin(requestedPath, "/admin")) {
    return canManageUsers(user) ? requestedPath : landingPath;
  }

  return requestedPath;
}
