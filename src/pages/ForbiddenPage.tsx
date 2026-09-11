import { Link } from "react-router-dom";
import PageMeta from "@/components/shared/PageMeta";
import { getLandingPath } from "@/lib/areaAccess";
import { useAuthStore } from "@/store/authStore";

export default function ForbiddenPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <PageMeta title="Không có quyền truy cập | TAMI ERP" description="TAMI ERP" />
      <section className="max-w-md text-center" aria-labelledby="forbidden-title">
        <p className="text-title-lg text-brand-500 font-semibold">403</p>
        <h1
          id="forbidden-title"
          className="text-title-sm mt-3 font-semibold text-gray-900 dark:text-white"
        >
          Bạn không có quyền truy cập
        </h1>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          Tài khoản hiện tại chưa được cấp quyền sử dụng chức năng này.
        </p>
        <Link
          to={getLandingPath(user)}
          className="bg-brand-500 hover:bg-brand-600 focus-visible:outline-brand-500 mt-6 inline-flex rounded-lg px-4 py-3 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Về trang chính
        </Link>
      </section>
    </main>
  );
}
