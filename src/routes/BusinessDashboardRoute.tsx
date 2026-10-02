import { Navigate, Outlet } from "react-router-dom";
import { canAccessBusinessDashboard, getLandingPath } from "@/lib/areaAccess";
import { useAuthStore } from "@/store/authStore";

export function BusinessDashboardRoute() {
  const user = useAuthStore((state) => state.user);
  if (canAccessBusinessDashboard(user)) return <Outlet />;
  const landingPath = user ? getLandingPath(user) : "/login";
  return <Navigate to={landingPath === "/dashboard" ? "/forbidden" : landingPath} replace />;
}
