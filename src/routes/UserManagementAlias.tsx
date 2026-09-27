import { Navigate } from "react-router-dom";
import { canAccessItArea, canAccessManagement, getLandingPath } from "@/lib/areaAccess";
import { useAuthStore } from "@/store/authStore";

export function UserManagementAlias() {
  const user = useAuthStore((state) => state.user);
  const destination = canAccessItArea(user)
    ? "/it/users"
    : canAccessManagement(user)
      ? "/management/users"
      : getLandingPath(user);

  return <Navigate to={destination} replace />;
}
