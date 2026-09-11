import { Navigate, Outlet } from "react-router-dom";
import { canManageUsers } from "@/lib/areaAccess";
import { useAuthStore } from "@/store/authStore";

export function UserManagementRoute() {
  const user = useAuthStore((state) => state.user);
  return canManageUsers(user) ? <Outlet /> : <Navigate to="/forbidden" replace />;
}
