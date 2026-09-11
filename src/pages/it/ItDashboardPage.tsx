import { Link } from "react-router-dom";
import PageMeta from "@/components/shared/PageMeta";
import { canManageUsers } from "@/lib/areaAccess";
import { useAuthStore } from "@/store/authStore";

export default function ItDashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <section className="space-y-4">
      <PageMeta title="Khu IT | TAMI ERP" description="Khu làm việc dành cho bộ phận IT" />
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Khu IT</h1>
      <p className="max-w-2xl text-gray-600 dark:text-gray-400">
        Quản lý các chức năng hệ thống được cấp cho tài khoản IT của bạn.
      </p>
      {canManageUsers(user) && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="font-medium text-gray-900 dark:text-white">Quản trị người dùng</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Truy cập khu vực quản trị tài khoản và phân quyền người dùng.
          </p>
          <Link
            to="/it/users"
            className="text-brand-600 focus-visible:outline-brand-500 mt-4 inline-flex rounded-md text-sm font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-brand-400"
          >
            Mở Quản trị người dùng
          </Link>
        </div>
      )}
    </section>
  );
}
