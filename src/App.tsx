import {
  createBrowserRouter,
  Navigate,
  Outlet,
  Route,
  RouterProvider,
  Routes,
  type DataRouter,
} from "react-router-dom";
import AppLayout from "@/layout/AppLayout";
import ManagementLayout from "@/layout/ManagementLayout";
import ItLayout from "@/layout/ItLayout";
import ManagementDashboardPage from "@/pages/management/ManagementDashboardPage";
import ManagementPoOverviewPage from "@/pages/management/ManagementPoOverviewPage";
import { ManagementRoute } from "@/routes/ManagementRoute";
import { ItRoute } from "@/routes/ItRoute";
import { UserManagementRoute } from "@/routes/UserManagementRoute";
import { UserManagementAlias } from "@/routes/UserManagementAlias";
import { getLandingPath } from "@/lib/areaAccess";
import { useAuthStore } from "@/store/authStore";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { useAuthBootstrap } from "@/hooks/useAuthBootstrap";
import LoginPage from "@/pages/auth/LoginPage";
import SetPasswordPage from "@/pages/auth/SetPasswordPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import DashboardPage from "@/pages/Dashboard/DashboardPage";
import BomPage from "@/pages/bom/BomPage";
import PoPage from "@/pages/po/PoPage";
import PoDetailPage from "@/pages/po/PoDetailPage";
import PoProductDetailPage from "@/pages/po/PoProductDetailPage";
import MaterialsPage from "@/pages/masters/MaterialsPage";
import MaterialGroupListPage from "@/pages/masters/MaterialGroupListPage";
import StageListPage from "@/pages/masters/StageListPage";
import StageGroupListPage from "@/pages/masters/StageGroupListPage";
import UnitListPage from "@/pages/masters/UnitListPage";
import WorkshopListPage from "@/pages/masters/WorkshopListPage";
import SizeChartListPage from "@/pages/masters/SizeChartListPage";
import UsersPage from "@/pages/admin/UsersPage";
import StyleListPage from "@/pages/styles/StyleListPage";
import StyleDetailPage from "@/pages/styles/StyleDetailPage";
import AuditLogPage from "@/pages/audit/AuditLogPage";
import ItDashboardPage from "@/pages/it/ItDashboardPage";
import ForbiddenPage from "@/pages/ForbiddenPage";
import NotFoundPage from "@/pages/NotFoundPage";

const AUTH_GUARD_ENABLED = true;

export function AppRoutes() {
  const status = useAuthBootstrap();
  const user = useAuthStore((state) => state.user);

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/set-password" element={<SetPasswordPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/login"
          element={
            status === "authenticated" ? (
              <Navigate to={getLandingPath(user)} replace />
            ) : status === "idle" || status === "loading" ? (
              <div role="status">Đang tải phiên đăng nhập…</div>
            ) : (
              <LoginPage />
            )
          }
        />
        <Route element={AUTH_GUARD_ENABLED ? <ProtectedRoute /> : <Outlet />}>
          <Route path="management" element={<ManagementRoute />}>
            <Route element={<ManagementLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ManagementDashboardPage />} />
              <Route path="purchase-orders" element={<ManagementPoOverviewPage />} />
              <Route element={<UserManagementRoute />}>
                <Route path="users" element={<UsersPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="it" element={<ItRoute />}>
            <Route element={<ItLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ItDashboardPage />} />
              <Route element={<UserManagementRoute />}>
                <Route path="users" element={<UsersPage />} />
              </Route>
            </Route>
          </Route>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to={getLandingPath(user)} replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="styles" element={<StyleListPage />} />
            <Route path="styles/:id/detail" element={<StyleDetailPage />} />
            <Route path="styles/:id/operation-steps" element={<StyleDetailPage />} />
            <Route path="styles/:id/steps" element={<StyleDetailPage />} />
            <Route path="styles/:id" element={<StyleDetailPage />} />
            <Route path="styles/:id/production-doc" element={<StyleDetailPage />} />
            <Route path="styles/:id/documents" element={<StyleDetailPage />} />
            <Route path="bom" element={<BomPage />} />
            <Route path="po" element={<PoPage />} />
            <Route path="po/:id" element={<PoDetailPage />} />
            <Route path="po/:id/detail" element={<PoDetailPage />} />
            <Route path="po/:id/products" element={<PoDetailPage />} />
            <Route path="po/:id/lines" element={<PoDetailPage />} />
            <Route path="po/:id/documents" element={<PoDetailPage />} />
            <Route path="po/:id/files" element={<PoDetailPage />} />
            <Route path="po/:id/history" element={<PoDetailPage />} />
            <Route path="po/:id/products/:productId" element={<PoProductDetailPage />} />
            <Route path="po/:id/products/:productId/:tab" element={<PoProductDetailPage />} />
            <Route path="po/:id/line/:productId" element={<PoProductDetailPage />} />
            <Route path="po/:id/line/:productId/:tab" element={<PoProductDetailPage />} />
            <Route path="masters" element={<Navigate to="/masters/materials" replace />} />
            <Route path="masters/materials" element={<MaterialsPage />} />
            <Route path="masters/material-groups" element={<MaterialGroupListPage />} />
            <Route path="masters/stages" element={<StageListPage />} />
            <Route path="masters/stage-groups" element={<StageGroupListPage />} />
            <Route path="masters/units" element={<UnitListPage />} />
            <Route path="masters/workshops" element={<WorkshopListPage />} />
            <Route path="masters/size-charts" element={<SizeChartListPage />} />
            <Route path="audit-log" element={<AuditLogPage />} />
          </Route>
          <Route element={<UserManagementRoute />}>
            <Route path="admin" element={<UserManagementAlias />} />
            <Route path="admin/users" element={<UserManagementAlias />} />
          </Route>
          <Route path="forbidden" element={<ForbiddenPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export function createAppRouter(): DataRouter {
  return createBrowserRouter([{ path: "*", element: <AppRoutes /> }]);
}

export default function App({ router }: { router: DataRouter }) {
  return <RouterProvider router={router} />;
}
