import type { AuthUser } from "@/store/authStore";

export function canAccessManagement(user: AuthUser | null): boolean {
  return user?.permissions.includes("management.area.access") ?? false;
}

export function getLandingPath(user: AuthUser | null): string {
  return canAccessManagement(user) ? "/management/dashboard" : "/dashboard";
}
