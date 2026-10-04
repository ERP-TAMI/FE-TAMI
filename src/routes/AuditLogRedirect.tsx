import { Navigate } from "react-router-dom";
import { canAccessItArea, canAccessManagement } from "@/lib/areaAccess";
import { useAuthStore } from "@/store/authStore";

// Keeps old /audit-log links working now that the page lives inside each area.
export function AuditLogRedirect() {
  const user = useAuthStore((state) => state.user);
  if (canAccessManagement(user)) return <Navigate to="/management/audit-log" replace />;
  if (canAccessItArea(user)) return <Navigate to="/it/audit-log" replace />;
  return <Navigate to="/forbidden" replace />;
}
