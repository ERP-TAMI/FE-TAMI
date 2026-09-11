import { NavLink, Outlet } from "react-router-dom";
import { ThemeToggleButton } from "@/components/shared/ThemeToggleButton";
import AccountMenu from "@/layout/AccountMenu";
import { canManageUsers } from "@/lib/areaAccess";
import { useAuthStore } from "@/store/authStore";

export default function ItLayout() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <aside className="border-b border-gray-200 bg-white p-4 lg:fixed lg:inset-y-0 lg:w-64 lg:border-r dark:border-gray-800 dark:bg-gray-900">
        <NavLink
          to="/it/dashboard"
          className="focus-visible:outline-brand-500 block rounded-lg px-3 py-3 text-lg font-semibold text-gray-900 focus-visible:outline-2 dark:text-white"
        >
          TAMI ERP
        </NavLink>
        <p className="px-3 pb-4 text-xs font-medium tracking-wide text-gray-500 uppercase">Khu IT</p>
        <nav aria-label="Điều hướng IT" className="flex flex-wrap gap-2 lg:flex-col">
          {canManageUsers(user) && (
            <NavLink
              to="/it/users"
              className={({ isActive }) =>
                `focus-visible:outline-brand-500 rounded-lg px-3 py-3 text-sm font-medium focus-visible:outline-2 ${isActive ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300" : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"}`
              }
            >
              Quản trị người dùng
            </NavLink>
          )}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-6 dark:border-gray-800 dark:bg-gray-900">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">IT</span>
          <div className="flex items-center gap-3">
            <ThemeToggleButton />
            <AccountMenu area="it" />
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
