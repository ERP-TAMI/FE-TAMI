import { Navigate, Outlet } from "react-router-dom";
import { canAccessItArea, getLandingPath } from "@/lib/areaAccess";
import { useAuthStore } from "@/store/authStore";

export function ItRoute() {
  const user = useAuthStore((state) => state.user);
  return canAccessItArea(user) ? <Outlet /> : <Navigate to={getLandingPath(user)} replace />;
}
