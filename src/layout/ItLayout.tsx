import { Menu, PanelLeftClose, PanelLeftOpen, UsersRound, X } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { ThemeToggleButton } from "@/components/shared/ThemeToggleButton";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import AccountMenu from "@/layout/AccountMenu";
import Backdrop from "@/layout/Backdrop";
import { canManageUsers, getLandingPath } from "@/lib/areaAccess";
import { useAuthStore } from "@/store/authStore";

function ItLayoutContent() {
  const user = useAuthStore((state) => state.user);
  const { isExpanded, isHovered, isMobileOpen, setIsHovered, toggleSidebar, toggleMobileSidebar } =
    useSidebar();
  const showLabels = isExpanded || isHovered || isMobileOpen;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <aside
        aria-label="Điều hướng IT"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-gray-200 bg-white px-4 text-gray-900 transition-all duration-200 ease-in-out dark:border-gray-800 dark:bg-gray-900 ${
          showLabels ? "w-[250px]" : "w-[80px]"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`flex items-center py-8 ${showLabels ? "justify-between" : "justify-center"}`}
        >
          <NavLink
            to={getLandingPath(user)}
            aria-label="TAMI ERP - Khu công nghệ thông tin"
            className="focus-visible:outline-brand-500 cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            {showLabels ? (
              <>
                <img
                  className="dark:hidden"
                  src="/images/logo/logo.svg"
                  alt="TAMI ERP"
                  width={150}
                  height={40}
                />
                <img
                  className="hidden dark:block"
                  src="/images/logo/logo-dark.svg"
                  alt="TAMI ERP"
                  width={150}
                  height={40}
                />
              </>
            ) : (
              <img src="/images/logo/logo-icon.svg" alt="TAMI ERP" width={32} height={32} />
            )}
          </NavLink>
          {isMobileOpen && (
            <button
              type="button"
              aria-label="Đóng điều hướng IT"
              onClick={toggleMobileSidebar}
              className="focus-visible:outline-brand-500 cursor-pointer rounded-lg p-2 text-gray-600 transition-colors duration-150 hover:bg-gray-100 focus-visible:outline-2 lg:hidden dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          )}
        </div>
        <nav aria-label="Chức năng IT" className="flex flex-1 flex-col gap-2 overflow-y-auto pb-6">
          <p
            aria-hidden="true"
            className={`mb-2 text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400 ${showLabels ? "" : "text-center"}`}
          >
            {showLabels ? "Workspace" : "•••"}
          </p>
          {canManageUsers(user) && (
            <NavLink
              to="/it/users"
              aria-label="Quản trị người dùng"
              onClick={() => {
                if (isMobileOpen) toggleMobileSidebar();
              }}
              className={({ isActive }) =>
                `menu-item group focus-visible:outline-brand-500 cursor-pointer transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  isActive
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-500/[0.12] dark:text-brand-300"
                    : "menu-item-inactive"
                } ${showLabels ? "justify-start" : "justify-center"}`
              }
            >
              <UsersRound aria-hidden="true" className="h-6 w-6 shrink-0" />
              {showLabels && <span className="menu-item-text">Quản trị người dùng</span>}
            </NavLink>
          )}
        </nav>
      </aside>
      <Backdrop />
      <div
        className={`min-w-0 transition-all duration-200 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[250px]" : "lg:ml-[80px]"
        }`}
      >
        <header className="sticky top-0 z-40 flex w-full items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 py-2 md:px-6 md:py-2.5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth >= 1024) toggleSidebar();
                else toggleMobileSidebar();
              }}
              aria-label="Bật/tắt điều hướng IT"
              className="focus-visible:outline-brand-500 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors duration-150 hover:bg-gray-100 focus-visible:outline-2 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {isExpanded ? (
                <PanelLeftClose aria-hidden="true" className="hidden h-5 w-5 lg:block" />
              ) : (
                <PanelLeftOpen aria-hidden="true" className="hidden h-5 w-5 lg:block" />
              )}
              <Menu aria-hidden="true" className="h-5 w-5 lg:hidden" />
            </button>
            <div className="leading-tight">
              <p className="text-theme-sm font-semibold text-gray-900 dark:text-white">TAMI ERP</p>
              <p className="text-theme-xs hidden text-gray-600 sm:block dark:text-gray-300">
                Công nghệ thông tin
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggleButton />
            <AccountMenu area="it" />
          </div>
        </header>
        <main id="main-content" className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function ItLayout() {
  return (
    <SidebarProvider>
      <ItLayoutContent />
    </SidebarProvider>
  );
}
