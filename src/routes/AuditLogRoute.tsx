import { Navigate, Outlet } from "react-router-dom";
import { canViewAuditLog } from "@/lib/areaAccess";
import { useAuthStore } from "@/store/authStore";

export function AuditLogRoute() {
  const user = useAuthStore((state) => state.user);
  return canViewAuditLog(user) ? <Outlet /> : <Navigate to="/forbidden" replace />;
}
