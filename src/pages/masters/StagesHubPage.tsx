import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { DocsIcon, GroupIcon } from "@/icons";
import StageListPage from "./StageListPage";
import StageGroupListPage from "./StageGroupListPage";

type StagesTab = "stages" | "groups";

type TabConfig = {
  key: StagesTab;
  label: string;
  path: string;
  icon: ReactNode;
};

const TABS: TabConfig[] = [
  {
    key: "stages",
    label: "Công đoạn",
    path: "/masters/stages",
    icon: <DocsIcon className="h-4 w-4" aria-hidden="true" />,
  },
  {
    key: "groups",
    label: "Nhóm công đoạn",
    path: "/masters/stages/groups",
    icon: <GroupIcon className="h-4 w-4" aria-hidden="true" />,
  },
];

const TAB_META: Record<StagesTab, { title: string; metaTitle: string; metaDescription: string }> =
  {
    stages: {
      title: "Công đoạn",
      metaTitle: "Công đoạn | TAMI ERP",
      metaDescription: "Quản lý danh mục công đoạn",
    },
    groups: {
      title: "Nhóm công đoạn",
      metaTitle: "Nhóm công đoạn | TAMI ERP",
      metaDescription: "Quản lý nhóm công đoạn",
    },
  };

function getActiveTab(pathname: string): StagesTab {
  return pathname.endsWith("/groups") ? "groups" : "stages";
}

export default function StagesHubPage() {
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

      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="flex space-x-6" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => navigate(tab.path)}
              aria-current={activeTab === tab.key ? "page" : undefined}
              className={`flex items-center gap-2 border-b-2 py-2.5 px-1 text-sm font-semibold transition-colors cursor-pointer ${
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

      {activeTab === "stages" ? <StageListPage /> : <StageGroupListPage />}
    </div>
  );
}
