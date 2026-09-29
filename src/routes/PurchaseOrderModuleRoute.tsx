import { Navigate, Outlet } from "react-router-dom";
import {
  canAccessEditablePurchaseOrderModule,
  canAccessManagement,
} from "@/lib/areaAccess";
import { useAuthStore } from "@/store/authStore";

export function PurchaseOrderModuleRoute() {
  const user = useAuthStore((state) => state.user);

  return canAccessEditablePurchaseOrderModule(user) ? (
    <Outlet />
  ) : (
    <Navigate
      to={canAccessManagement(user) ? "/management/dashboard" : "/dashboard"}
      replace
    />
  );
}
