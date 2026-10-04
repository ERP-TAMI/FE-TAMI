import { useMemo, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { BoxCubeIcon, ChevronDownIcon, GridIcon, ListIcon, PageIcon } from "@/icons";
import { useSidebar } from "@/context/SidebarContext";
import { useAuthStore } from "@/store/authStore";
import {
  canAccessBusinessDashboard,
  canAccessEditablePurchaseOrderModule,
  canViewAuditLog,
} from "@/lib/areaAccess";

type NavChild = {
  name: string;
  path: string;
  permission?: string;
};

type NavItem = {
  name: string;
  path?: string;
  icon: ReactNode;
  children?: NavChild[];
};

const ALL_NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", path: "/dashboard", icon: <GridIcon /> },
  {
    name: "Quản lý Mẫu Fit",
    icon: <PageIcon />,
    children: [
      { name: "Mẫu Fit", path: "/styles", permission: "master_data.styles.view" },
      {
        name: "Kho tài liệu",
        path: "/documents",
        permission: "master_data.documents.view",
      },
    ],
  },
  {
    name: "Quản lý NPL",
    icon: <BoxCubeIcon />,
    children: [
      { name: "Danh sách NPL", path: "/bom" },
      { name: "Tổng hợp nhu cầu", path: "/bom/aggregate" },
    ],
  },
  { name: "Quản lý PO", path: "/po", icon: <ListIcon /> },
  {
    name: "Dữ liệu chung",
    icon: <PageIcon />,
    children: [
      { name: "Vật tư", path: "/masters/materials" },
      { name: "Công đoạn", path: "/masters/stages" },
      { name: "Xưởng sản xuất", path: "/masters/workshops" },
      { name: "Bảng Size", path: "/masters/size-charts" },
    ],
  },
  { name: "Nhật ký hệ thống", path: "/audit-log", icon: <ListIcon /> },
];

export default function AppSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const showLabels = isExpanded || isHovered || isMobileOpen;

  const navItems = useMemo(() => {
    const visibleItems: NavItem[] = [];
    for (const item of ALL_NAV_ITEMS) {
      if (item.children) {
        const children = item.children.filter(
          (child) =>
            !child.permission ||
            user?.roleCode === "SA" ||
            (user?.permissions.includes(child.permission) ?? false),
        );
        if (children.length > 0) visibleItems.push({ ...item, children });
        continue;
      }

      if (item.path === "/dashboard" && !canAccessBusinessDashboard(user)) continue;
      if (item.path === "/po" && !canAccessEditablePurchaseOrderModule(user)) continue;
      if (item.path === "/audit-log" && !canViewAuditLog(user)) continue;
      visibleItems.push(item);
    }
    return visibleItems;
  }, [user]);

  const toggleGroup = (name: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const isChildActive = (item: NavItem) =>
    item.children?.some((child) => location.pathname.startsWith(child.path)) ?? false;

  return (
    <aside
      aria-label="Primary navigation"
      className={`fixed top-0 left-0 z-50 flex h-screen flex-col border-r border-gray-200 bg-white px-4 text-gray-900 transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 ${
        showLabels ? "w-[250px]" : "w-[80px]"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`mb-4 flex h-[69px] shrink-0 items-center ${
          showLabels ? "justify-start" : "lg:justify-center"
        }`}
      >
        <NavLink to="/dashboard" aria-label="TAMI ERP dashboard">
          {showLabels ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="TAMI ERP"
                width={120}
                height={32}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="TAMI ERP"
                width={120}
                height={32}
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
            const isOpen = openGroups.has(item.name) || isChildActive(item);
            return (
              <div key={item.name}>
                <button
                  type="button"
                  onClick={() => toggleGroup(item.name)}
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
                        end={child.path === "/bom"}
                        className={({ isActive }) =>
                           `menu-dropdown-item flex items-center gap-2 ${
                            isActive
                              ? "menu-dropdown-item-active font-semibold"
                              : "menu-dropdown-item-inactive"
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                                isActive
                                  ? "bg-brand-500 ring-brand-500/20 ring-2"
                                  : "bg-gray-300 dark:bg-gray-700"
                              }`}
                            />
                            <span>{child.name}</span>
                          </>
                        )}
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
