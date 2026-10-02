import {
  BadgeCheck,
  Check,
  Clock3,
  Files,
  FolderClosed,
  House,
  LoaderCircle,
  Star,
} from "lucide-react";

export type DocumentLibraryView = "overview" | "folders" | "documents";
export type DocumentLibraryFilter = "recent" | "pinned" | "processing" | "assigned";

type NavigationItem = {
  id: DocumentLibraryView | DocumentLibraryFilter;
  label: string;
  icon: typeof House;
  kind: "view" | "filter";
};

const navigationGroups: { label?: string; items: NavigationItem[] }[] = [
  {
    items: [
      { id: "overview", label: "Tổng quan", icon: House, kind: "view" },
      { id: "recent", label: "Gần đây", icon: Clock3, kind: "filter" },
      { id: "pinned", label: "Được ghim", icon: Star, kind: "filter" },
    ],
  },
  {
    label: "Thư mục",
    items: [{ id: "folders", label: "Tất cả thư mục", icon: FolderClosed, kind: "view" }],
  },
  {
    label: "Tài liệu",
    items: [
      { id: "documents", label: "Tất cả tài liệu", icon: Files, kind: "view" },
      { id: "processing", label: "Đang xử lý", icon: LoaderCircle, kind: "filter" },
      { id: "assigned", label: "Đã gán", icon: BadgeCheck, kind: "filter" },
    ],
  },
];

type DocumentLibrarySidebarProps = {
  activeView: DocumentLibraryView;
  activeFilters: ReadonlySet<DocumentLibraryFilter>;
  onNavigate: (view: DocumentLibraryView) => void;
  onToggleFilter: (filter: DocumentLibraryFilter) => void;
};

export function DocumentLibrarySidebar({
  activeView,
  activeFilters,
  onNavigate,
  onToggleFilter,
}: DocumentLibrarySidebarProps) {
  return (
    <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-3 shadow-xs xl:sticky xl:top-4 dark:border-gray-800 dark:bg-gray-900">
      <p className="px-3 pt-2 pb-3 text-[11px] font-semibold tracking-[0.12em] text-gray-500 uppercase dark:text-gray-400">
        Kho tài liệu
      </p>
      <nav aria-label="Điều hướng kho tài liệu" className="space-y-3">
        {navigationGroups.map((group) => (
          <div
            key={group.label ?? "primary"}
            className={group.label ? "border-t border-gray-100 pt-3 dark:border-gray-800" : ""}
          >
            {group.label && (
              <h2 className="px-3 pb-1.5 text-[10px] font-semibold tracking-[0.12em] text-gray-400 uppercase dark:text-gray-500">
                {group.label}
              </h2>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ id, label, icon: Icon, kind }) => {
                const active =
                  kind === "view"
                    ? activeView === id &&
                      !(
                        id === "documents" &&
                        (activeFilters.has("assigned") || activeFilters.has("processing"))
                      )
                    : activeFilters.has(id as DocumentLibraryFilter);
                return (
                  <button
                    key={id}
                    type="button"
                    aria-current={kind === "view" && active ? "page" : undefined}
                    aria-pressed={kind === "filter" ? active : undefined}
                    onClick={() =>
                      kind === "view"
                        ? onNavigate(id as DocumentLibraryView)
                        : onToggleFilter(id as DocumentLibraryFilter)
                    }
                    className={`focus-visible:outline-brand-500 flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none ${
                      active
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 font-semibold"
                        : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                    <span>{label}</span>
                    {kind === "filter" && active && (
                      <Check aria-hidden="true" className="ml-auto h-4 w-4 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
