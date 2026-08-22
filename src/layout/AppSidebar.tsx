import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { BoxCubeIcon, GridIcon, ListIcon, PageIcon, UserCircleIcon } from "@/icons";
import { useSidebar } from "@/context/SidebarContext";

type NavItem = {
  name: string;
  path: string;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  { name: "Dashboard", path: "/dashboard", icon: <GridIcon /> },
  { name: "BOM", path: "/bom", icon: <BoxCubeIcon /> },
  { name: "Purchase Orders", path: "/po", icon: <ListIcon /> },
  { name: "Vật tư", path: "/masters/materials", icon: <PageIcon /> },
  { name: "Nhóm vật tư", path: "/masters/material-groups", icon: <PageIcon /> },
  { name: "Administration", path: "/admin", icon: <UserCircleIcon /> },
  { name: "Audit log", path: "/audit-log", icon: <ListIcon /> },
];

export default function AppSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const showLabels = isExpanded || isHovered || isMobileOpen;

  return (
    <aside
      aria-label="Primary navigation"
      className={`fixed top-0 left-0 z-50 flex h-screen flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 ${
        showLabels ? "w-[290px]" : "w-[90px]"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex py-8 ${showLabels ? "justify-start" : "lg:justify-center"}`}>
        <NavLink to="/dashboard" aria-label="TAMI ERP dashboard">
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
      </div>
      <nav className="flex flex-1 flex-col gap-2 overflow-y-auto pb-6" aria-label="ERP modules">
        <p
          className={`mb-2 text-xs tracking-wider text-gray-400 uppercase ${
            showLabels ? "" : "text-center"
          }`}
        >
          {showLabels ? "Workspace" : "•••"}
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `menu-item group ${
                isActive ? "menu-item-active" : "menu-item-inactive"
              } ${showLabels ? "justify-start" : "justify-center"}`
            }
          >
            <span className="menu-item-icon-size">{item.icon}</span>
            {showLabels && <span className="menu-item-text">{item.name}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
