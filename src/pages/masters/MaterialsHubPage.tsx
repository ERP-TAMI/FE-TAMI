import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { BoxCubeIcon, GroupIcon, TableIcon } from "@/icons";
import MaterialsPage from "./MaterialsPage";
import MaterialGroupListPage from "./MaterialGroupListPage";
import UnitListPage from "./UnitListPage";

type MaterialsTab = "materials" | "groups" | "units";

type TabConfig = {
  key: MaterialsTab;
  label: string;
  path: string;
  icon: ReactNode;
};

const TABS: TabConfig[] = [
  {
    key: "materials",
    label: "Vật tư",
    path: "/masters/materials",
    icon: <BoxCubeIcon className="h-4 w-4" aria-hidden="true" />,
  },
  {
    key: "groups",
    label: "Nhóm vật tư",
    path: "/masters/materials/groups",
    icon: <GroupIcon className="h-4 w-4" aria-hidden="true" />,
  },
  {
    key: "units",
    label: "Đơn vị tính",
    path: "/masters/materials/units",
    icon: <TableIcon className="h-4 w-4" aria-hidden="true" />,
  },
];

const TAB_META: Record<
  MaterialsTab,
  { title: string; metaTitle: string; metaDescription: string }
> = {
  materials: {
    title: "Vật tư - Phụ liệu",
    metaTitle: "Vật tư - Phụ liệu | TAMI ERP",
    metaDescription: "Quản lý danh mục vật tư và phụ liệu",
  },
  groups: {
    title: "Nhóm vật tư",
    metaTitle: "Nhóm vật tư | TAMI ERP",
    metaDescription: "Quản lý danh mục nhóm vật tư",
  },
  units: {
    title: "Đơn vị tính",
    metaTitle: "Đơn vị tính | TAMI ERP",
    metaDescription: "Quản lý danh mục đơn vị tính",
  },
};

function getActiveTab(pathname: string): MaterialsTab {
  if (pathname.endsWith("/groups")) return "groups";
  if (pathname.endsWith("/units")) return "units";
  return "materials";
}

export default function MaterialsHubPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = getActiveTab(location.pathname);
  const meta = TAB_META[activeTab];

  return (
    <div className="space-y-4">
      <PageMeta title={meta.metaTitle} description={meta.metaDescription} />
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Dữ liệu chung" },
          { label: meta.title },
        ]}
        title={meta.title}
      />

      <div className="overflow-x-auto border-b border-gray-200 dark:border-gray-800">
        <nav className="flex w-max space-x-6" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => navigate(tab.path)}
              aria-current={activeTab === tab.key ? "page" : undefined}
              className={`flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-1 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "materials" ? (
        <MaterialsPage />
      ) : activeTab === "groups" ? (
        <MaterialGroupListPage />
      ) : (
        <UnitListPage />
      )}
    </div>
  );
}
