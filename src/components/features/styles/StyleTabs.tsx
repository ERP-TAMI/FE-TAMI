interface Props {
  activeTab: "general" | "production_doc";
  onTabChange: (tab: "general" | "production_doc") => void;
}

export function StyleTabs({ activeTab, onTabChange }: Props) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-800">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        <button
          type="button"
          onClick={() => onTabChange("general")}
          className={`group relative min-w-0 py-3 text-sm font-semibold transition-all duration-150 ${
            activeTab === "general"
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          <span>Thông tin chung</span>
          <span
            className={`absolute inset-x-0 bottom-0 h-0.5 rounded-t-sm transition-all duration-150 ${
              activeTab === "general"
                ? "bg-blue-600 dark:bg-blue-400"
                : "bg-transparent group-hover:bg-gray-300 dark:group-hover:bg-gray-700"
            }`}
          />
        </button>

        <button
          type="button"
          onClick={() => onTabChange("production_doc")}
          className={`group relative min-w-0 py-3 text-sm font-semibold transition-all duration-150 ${
            activeTab === "production_doc"
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          <span>Tài liệu sản xuất tiếng Việt</span>
          <span
            className={`absolute inset-x-0 bottom-0 h-0.5 rounded-t-sm transition-all duration-150 ${
              activeTab === "production_doc"
                ? "bg-blue-600 dark:bg-blue-400"
                : "bg-transparent group-hover:bg-gray-300 dark:group-hover:bg-gray-700"
            }`}
          />
        </button>
      </nav>
    </div>
  );
}
