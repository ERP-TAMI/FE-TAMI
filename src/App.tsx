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
import { AuditLogRoute } from "@/routes/AuditLogRoute";
import { UserManagementAlias } from "@/routes/UserManagementAlias";
import { PurchaseOrderModuleRoute } from "@/routes/PurchaseOrderModuleRoute";
import { BusinessDashboardRoute } from "@/routes/BusinessDashboardRoute";
import { canManagePurchaseOrders, getLandingPath } from "@/lib/areaAccess";
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
import BomDetailPage from "@/pages/bom/BomDetailPage";
import BomAggregatePage from "@/pages/bom/BomAggregatePage";
import PoPage from "@/pages/po/PoPage";
import PoDetailPage from "@/pages/po/PoDetailPage";
import PoProductDetailPage from "@/pages/po/PoProductDetailPage";
import MaterialsHubPage from "@/pages/masters/MaterialsHubPage";
import StagesHubPage from "@/pages/masters/StagesHubPage";
import WorkshopListPage from "@/pages/masters/WorkshopListPage";
import SizeChartListPage from "@/pages/masters/SizeChartListPage";
import UsersPage from "@/pages/admin/UsersPage";
import StyleListPage from "@/pages/styles/StyleListPage";
import StyleDetailPage from "@/pages/styles/StyleDetailPage";
import DocumentLibraryPage from "@/pages/documents/DocumentLibraryPage";
import AuditLogPage from "@/pages/audit/AuditLogPage";
import ProfilePage from "@/pages/account/ProfilePage";
import ForbiddenPage from "@/pages/ForbiddenPage";
import NotFoundPage from "@/pages/NotFoundPage";

const AUTH_GUARD_ENABLED = true;

function ManagementPoDetailRoute() {
  const user = useAuthStore((state) => state.user);
  const canEdit = canManagePurchaseOrders(user);
  return (
    <PoDetailPage
      key={`management-po-${canEdit ? "full-access" : "read-only"}`}
      managementContext
      readOnlyManagement={!canEdit}
    />
  );
}

function ManagementPoProductDetailRoute() {
  const user = useAuthStore((state) => state.user);
  const canEdit = canManagePurchaseOrders(user);
  return (
    <PoProductDetailPage
      key={`management-po-product-${canEdit ? "full-access" : "read-only"}`}
      managementContext
      readOnlyManagement={!canEdit}
    />
  );
}

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
              <Route path="purchase-orders/:id" element={<ManagementPoDetailRoute />} />
              <Route path="purchase-orders/:id/detail" element={<ManagementPoDetailRoute />} />
              <Route path="purchase-orders/:id/products" element={<ManagementPoDetailRoute />} />
              <Route
                path="purchase-orders/:id/products/:productId"
                element={<ManagementPoProductDetailRoute />}
              />
              <Route
                path="purchase-orders/:id/products/:productId/:tab"
                element={<ManagementPoProductDetailRoute />}
              />
              <Route path="purchase-orders/:id/lines" element={<ManagementPoDetailRoute />} />
              <Route path="purchase-orders/:id/documents" element={<ManagementPoDetailRoute />} />
              <Route path="purchase-orders/:id/files" element={<ManagementPoDetailRoute />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route element={<UserManagementRoute />}>
                <Route path="users" element={<UsersPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="it" element={<ItRoute />}>
            <Route element={<ItLayout />}>
              <Route index element={<Navigate to={getLandingPath(user)} replace />} />
              <Route path="dashboard" element={<Navigate to={getLandingPath(user)} replace />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route element={<UserManagementRoute />}>
                <Route path="users" element={<UsersPage />} />
              </Route>
            </Route>
          </Route>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to={getLandingPath(user)} replace />} />
            <Route element={<BusinessDashboardRoute />}>
              <Route path="dashboard" element={<DashboardPage />} />
            </Route>
            <Route path="profile" element={<ProfilePage />} />
            <Route path="styles" element={<StyleListPage />} />
            <Route path="documents" element={<DocumentLibraryPage />} />
            <Route path="styles/:id/detail" element={<StyleDetailPage />} />
            <Route path="styles/:id/operation-steps" element={<StyleDetailPage />} />
            <Route path="styles/:id/steps" element={<StyleDetailPage />} />
            <Route path="styles/:id" element={<StyleDetailPage />} />
            <Route path="styles/:id/production-doc" element={<StyleDetailPage />} />
            <Route path="styles/:id/documents" element={<StyleDetailPage />} />
            <Route path="styles/:id/sample-rounds" element={<StyleDetailPage />} />
            <Route path="bom" element={<BomPage />} />
            <Route path="bom/aggregate" element={<BomAggregatePage />} />
            <Route path="bom/:id" element={<BomDetailPage />} />
            <Route element={<PurchaseOrderModuleRoute />}>
              <Route path="po" element={<PoPage />} />
              <Route path="po/:id" element={<PoDetailPage />} />
              <Route path="po/:id/detail" element={<PoDetailPage />} />
              <Route path="po/:id/products" element={<PoDetailPage />} />
              <Route path="po/:id/lines" element={<PoDetailPage />} />
              <Route path="po/:id/documents" element={<PoDetailPage />} />
              <Route path="po/:id/files" element={<PoDetailPage />} />
              <Route path="po/:id/products/:productId" element={<PoProductDetailPage />} />
              <Route path="po/:id/products/:productId/:tab" element={<PoProductDetailPage />} />
              <Route path="po/:id/line/:productId" element={<PoProductDetailPage />} />
              <Route path="po/:id/line/:productId/:tab" element={<PoProductDetailPage />} />
            </Route>
            <Route path="masters" element={<Navigate to="/masters/materials" replace />} />
            <Route path="masters/materials" element={<MaterialsHubPage />} />
            <Route path="masters/materials/groups" element={<MaterialsHubPage />} />
            <Route path="masters/materials/units" element={<MaterialsHubPage />} />
            <Route path="masters/stages" element={<StagesHubPage />} />
            <Route path="masters/stages/groups" element={<StagesHubPage />} />
            <Route path="masters/workshops" element={<WorkshopListPage />} />
            <Route path="masters/size-charts" element={<SizeChartListPage />} />
            <Route element={<AuditLogRoute />}>
              <Route path="audit-log" element={<AuditLogPage />} />
            </Route>
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
