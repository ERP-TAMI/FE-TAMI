import AccountMenu from "@/layout/AccountMenu";
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
      <div className="flex w-full items-center justify-between gap-4 px-4 py-2 md:px-6 md:py-2.5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggle}
            aria-label={isMobileOpen ? "Close navigation" : "Open navigation"}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <span aria-hidden="true">{isMobileOpen ? "×" : "☰"}</span>
          </button>
          <div className="leading-tight">
            <p className="text-theme-sm font-semibold text-gray-900 dark:text-white">TAMI ERP</p>
            <p className="text-theme-xs hidden leading-tight text-gray-500 sm:block dark:text-gray-400">
              Hệ thống nhân viên
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggleButton />
          <AccountMenu area="employee" />
        </div>
      </div>
    </header>
  );
}
