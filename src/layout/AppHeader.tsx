import { useNavigate } from "react-router-dom";
import { useSidebar } from "@/context/SidebarContext";
import { ThemeToggleButton } from "@/components/shared/ThemeToggleButton";
import { authApi } from "@/api/auth.api";
import { useAuthStore } from "@/store/authStore";

export default function AppHeader() {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-40 flex w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex w-full items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggle}
            aria-label={isMobileOpen ? "Close navigation" : "Open navigation"}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <span aria-hidden="true">{isMobileOpen ? "×" : "☰"}</span>
          </button>
          <div>
            <p className="text-theme-sm font-semibold text-gray-900 dark:text-white">
              TAMI ERP Foundation
            </p>
            <p className="text-theme-xs hidden text-gray-500 sm:block dark:text-gray-400">
              TailAdmin application shell
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggleButton />
          {user && (
            <div className="hidden items-center gap-2.5 border-l border-gray-200 pl-4 sm:flex dark:border-gray-800">
              <span className="bg-brand-500 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white">
                {user.fullName.charAt(0).toUpperCase()}
              </span>
              <div className="leading-tight">
                <p className="text-theme-sm font-medium text-gray-900 dark:text-white">
                  {user.fullName}
                </p>
                <p className="text-theme-xs text-gray-500 dark:text-gray-400">{user.roleName}</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="text-theme-sm hidden rounded-lg border border-gray-200 px-3 py-2 font-medium text-gray-600 hover:bg-gray-100 sm:inline-flex dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}
