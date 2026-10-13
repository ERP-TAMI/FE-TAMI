import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getLandingPath } from "@/lib/areaAccess";
import { useAuthStore } from "@/store/authStore";

export function ProtectedRoute() {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <span
          role="status"
          aria-label="Đang tải"
          className="border-brand-500 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
        />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user?.mustChangePassword && location.pathname !== "/force-password-change") {
    return <Navigate to="/force-password-change" replace state={{ from: location }} />;
  }

  if (!user?.mustChangePassword && location.pathname === "/force-password-change") {
    return <Navigate to={getLandingPath(user)} replace />;
  }

  return <Outlet />;
}
