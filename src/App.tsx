import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
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
import UnitListPage from "@/pages/masters/UnitListPage";
import UsersPage from "@/pages/admin/UsersPage";
import StyleListPage from "@/pages/styles/StyleListPage";
import StyleDetailPage from "@/pages/styles/StyleDetailPage";
import AuditLogPage from "@/pages/audit/AuditLogPage";
import NotFoundPage from "@/pages/NotFoundPage";

const AUTH_GUARD_ENABLED = true;

export default function App() {
  const status = useAuthBootstrap();

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route
          path="/login"
          element={status === "authenticated" ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route element={AUTH_GUARD_ENABLED ? <ProtectedRoute /> : <Outlet />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="styles" element={<StyleListPage />} />
            <Route path="styles/:id" element={<StyleDetailPage />} />
            <Route path="bom" element={<BomPage />} />
            <Route path="po" element={<PoPage />} />
            <Route path="masters" element={<Navigate to="/masters/materials" replace />} />
            <Route path="masters/materials" element={<MaterialsPage />} />
            <Route path="masters/material-groups" element={<MaterialGroupListPage />} />
            <Route path="masters/units" element={<UnitListPage />} />
            <Route path="admin" element={<Navigate to="/admin/users" replace />} />
            <Route path="admin/users" element={<UsersPage />} />
            <Route path="audit-log" element={<AuditLogPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
