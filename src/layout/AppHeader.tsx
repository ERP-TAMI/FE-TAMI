import { Link } from "react-router-dom";
import { useSidebar } from "@/context/SidebarContext";
import { ThemeToggleButton } from "@/components/shared/ThemeToggleButton";

export default function AppHeader() {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
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
        <div className="flex items-center gap-3">
          <ThemeToggleButton />
          <Link
            to="/login"
            className="text-theme-sm hidden rounded-lg border border-gray-200 px-3 py-2 font-medium text-gray-600 hover:bg-gray-100 sm:inline-flex dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Login
          </Link>
        </div>
      </div>
    </header>
  );
}
