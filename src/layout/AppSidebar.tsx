import { useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BoxCubeIcon,
  ChevronDownIcon,
  GridIcon,
  ListIcon,
  PageIcon,
  UserCircleIcon,
} from "@/icons";
import { useSidebar } from "@/context/SidebarContext";

type NavChild = {
  name: string;
  path: string;
};

type NavItem = {
  name: string;
  path?: string;
  icon: ReactNode;
  children?: NavChild[];
};

const navItems: NavItem[] = [
  { name: "Dashboard", path: "/dashboard", icon: <GridIcon /> },
  { name: "Mẫu Fit", path: "/styles", icon: <PageIcon /> },
  { name: "BOM", path: "/bom", icon: <BoxCubeIcon /> },
  { name: "Purchase Orders", path: "/po", icon: <ListIcon /> },
  {
    name: "Dữ liệu chung",
    icon: <PageIcon />,
    children: [
      { name: "Vật tư", path: "/masters/materials" },
      { name: "Nhóm vật tư", path: "/masters/material-groups" },
    ],
  },
  { name: "Administration", path: "/admin", icon: <UserCircleIcon /> },
  { name: "Audit log", path: "/audit-log", icon: <ListIcon /> },
];

export default function AppSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const showLabels = isExpanded || isHovered || isMobileOpen;

  const isChildActive = (item: NavItem) =>
    item.children?.some((child) => location.pathname.startsWith(child.path)) ?? false;

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
        {navItems.map((item) => {
          if (item.children) {
            const isOpen = openGroup === item.name || isChildActive(item);
            return (
              <div key={item.name}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenGroup((prev) => (prev === item.name ? null : item.name))
                  }
                  aria-expanded={isOpen}
                  className={`menu-item group w-full ${
                    isChildActive(item) ? "menu-item-active" : "menu-item-inactive"
                  } ${showLabels ? "justify-start" : "justify-center"}`}
                >
                  <span className="menu-item-icon-size">{item.icon}</span>
                  {showLabels && (
                    <>
                      <span className="menu-item-text flex-1 text-left">{item.name}</span>
                      <ChevronDownIcon
                        className={`menu-item-arrow h-5 w-5 ${
                          isOpen ? "menu-item-arrow-active" : "menu-item-arrow-inactive"
                        }`}
                        aria-hidden="true"
                      />
                    </>
                  )}
                </button>
                {showLabels && isOpen && (
                  <div className="mt-1 ml-9 flex flex-col gap-1 border-l border-gray-200 pl-3 dark:border-gray-800">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          `menu-dropdown-item ${
                            isActive ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive"
                          }`
                        }
                      >
                        {child.name}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path as string}
              className={({ isActive }) =>
                `menu-item group ${
                  isActive ? "menu-item-active" : "menu-item-inactive"
                } ${showLabels ? "justify-start" : "justify-center"}`
              }
            >
              <span className="menu-item-icon-size">{item.icon}</span>
              {showLabels && <span className="menu-item-text">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
