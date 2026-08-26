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
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { useAuthBootstrap } from "@/hooks/useAuthBootstrap";
import LoginPage from "@/pages/auth/LoginPage";
import DashboardPage from "@/pages/Dashboard/DashboardPage";
import BomPage from "@/pages/bom/BomPage";
import PoPage from "@/pages/po/PoPage";
import MaterialsPage from "@/pages/masters/MaterialsPage";
import MaterialGroupListPage from "@/pages/masters/MaterialGroupListPage";
import StageListPage from "@/pages/masters/StageListPage";
import StageGroupListPage from "@/pages/masters/StageGroupListPage";
import UnitListPage from "@/pages/masters/UnitListPage";
import WorkshopListPage from "@/pages/masters/WorkshopListPage";
import UsersPage from "@/pages/admin/UsersPage";
import StyleListPage from "@/pages/styles/StyleListPage";
import StyleDetailPage from "@/pages/styles/StyleDetailPage";
import AuditLogPage from "@/pages/audit/AuditLogPage";
import NotFoundPage from "@/pages/NotFoundPage";

const AUTH_GUARD_ENABLED = true;

export function AppRoutes() {
  const status = useAuthBootstrap();

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route
          path="/login"
          element={
            status === "authenticated" ? <Navigate to="/dashboard" replace /> : <LoginPage />
          }
        />
        <Route element={AUTH_GUARD_ENABLED ? <ProtectedRoute /> : <Outlet />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="styles" element={<StyleListPage />} />
            <Route path="styles/:id/detail" element={<StyleDetailPage />} />
            <Route path="styles/:id/operation-steps" element={<StyleDetailPage />} />
            <Route path="styles/:id/steps" element={<StyleDetailPage />} />
            <Route path="styles/:id" element={<StyleDetailPage />} />
            <Route path="bom" element={<BomPage />} />
            <Route path="po" element={<PoPage />} />
            <Route path="masters" element={<Navigate to="/masters/materials" replace />} />
            <Route path="masters/materials" element={<MaterialsPage />} />
            <Route path="masters/material-groups" element={<MaterialGroupListPage />} />
            <Route path="masters/stages" element={<StageListPage />} />
            <Route path="masters/stage-groups" element={<StageGroupListPage />} />
            <Route path="masters/units" element={<UnitListPage />} />
            <Route path="masters/workshops" element={<WorkshopListPage />} />
            <Route path="admin" element={<Navigate to="/admin/users" replace />} />
            <Route path="admin/users" element={<UsersPage />} />
            <Route path="audit-log" element={<AuditLogPage />} />
          </Route>
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
