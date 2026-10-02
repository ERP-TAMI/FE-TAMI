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

const navigationItems: NavigationItem[] = [
  { id: "overview", label: "Tổng quan", icon: House, kind: "view" },
  { id: "recent", label: "Gần đây", icon: Clock3, kind: "filter" },
  { id: "pinned", label: "Được ghim", icon: Star, kind: "filter" },
  { id: "folders", label: "Tất cả thư mục", icon: FolderClosed, kind: "view" },
  { id: "documents", label: "Tất cả tài liệu", icon: Files, kind: "view" },
  { id: "processing", label: "Đang xử lý", icon: LoaderCircle, kind: "filter" },
  { id: "assigned", label: "Đã gán", icon: BadgeCheck, kind: "filter" },
];

type DocumentLibraryNavigationProps = {
  activeView: DocumentLibraryView;
  activeFilters: ReadonlySet<DocumentLibraryFilter>;
  onNavigate: (view: DocumentLibraryView) => void;
  onToggleFilter: (filter: DocumentLibraryFilter) => void;
};

export function DocumentLibraryNavigation({
  activeView,
  activeFilters,
  onNavigate,
  onToggleFilter,
}: DocumentLibraryNavigationProps) {
  return (
    <nav aria-label="Điều hướng kho tài liệu" className="flex flex-wrap items-center gap-1.5">
      {navigationItems.map(({ id, label, icon: Icon, kind }) => {
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
            className={`focus-visible:outline-brand-500 inline-flex min-h-9 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none ${
              active
                ? "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 font-semibold"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span>{label}</span>
            {kind === "filter" && active && (
              <Check aria-hidden="true" className="h-4 w-4 shrink-0" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
