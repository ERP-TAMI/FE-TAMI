import { Navigate, Outlet } from "react-router-dom";
import { canAccessManagement } from "@/lib/managementAccess";
import { useAuthStore } from "@/store/authStore";

export function ManagementRoute() {
  const user = useAuthStore((state) => state.user);
  return canAccessManagement(user) ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
