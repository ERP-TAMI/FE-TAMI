import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Folder,
  FolderPlus,
  Grid2X2,
  List,
  MoreVertical,
  Pencil,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { documentsLibraryApi } from "@/api/documents-library.api";
import type { DocumentFolderItem } from "@/types/document-library";
import {
  DocumentLibraryStatusFilter,
  type DocumentLibraryFilter,
} from "@/pages/documents/DocumentLibraryStatusFilter";

type OpenFolderMenu = { id: string; top: number; left: number } | null;

type DocumentFoldersViewProps = {
  path: DocumentFolderItem[];
  search: string;
  onSearchChange: (search: string) => void;
  showAssignmentFilter: boolean;
  assignmentFilter: DocumentLibraryFilter;
  onAssignmentFilterChange: (filter: DocumentLibraryFilter) => void;
  displayMode: "list" | "grid";
  onDisplayModeChange: (mode: "list" | "grid") => void;
  canManage: boolean;
  canUpload: boolean;
  uploading: boolean;
  uploadButtonLabel: string;
  onUploadClick: () => void;
  onOpenFolder: (folder: DocumentFolderItem) => void;
  onSelectPath: (path: DocumentFolderItem[]) => void;
  onOpenRoot: () => void;
  onBack: () => void;
  onCreate: (name: string, parent: DocumentFolderItem | null) => Promise<boolean>;
  onRename: (folder: DocumentFolderItem) => void;
  onDelete: (folder: DocumentFolderItem) => void;
  mergeContents?: boolean;
  renderDocumentPanel?: (folderRows: ReactNode | null, folderCards: ReactNode | null) => ReactNode;
  searchResults?: ReactNode;
};

export function DocumentFoldersView({
  path,
  search,
  onSearchChange,
  showAssignmentFilter,
  assignmentFilter,
  onAssignmentFilterChange,
  displayMode,
  onDisplayModeChange,
  canManage,
  canUpload,
  uploading,
  uploadButtonLabel,
  onUploadClick,
  onOpenFolder,
  onSelectPath,
  onOpenRoot,
  onBack,
  onCreate,
  onRename,
  onDelete,
  mergeContents = false,
  renderDocumentPanel,
  searchResults,
}: DocumentFoldersViewProps) {
  const [creating, setCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [saving, setSaving] = useState(false);
  const [openMenu, setOpenMenu] = useState<OpenFolderMenu>(null);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const createMenuButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchInput, setSearchInput] = useState(search);
  const currentFolder = path.at(-1) ?? null;
  useEffect(() => setSearchInput(search), [search]);
  useEffect(() => {
    if (!createMenuOpen) return;
    const closeOutside = (event: globalThis.MouseEvent) => {
      if (event.target instanceof Node && !createMenuRef.current?.contains(event.target)) {
        setCreateMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCreateMenuOpen(false);
        createMenuButtonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [createMenuOpen]);
  useEffect(() => {
    if (!openMenu) return;
    const closeOutside = (event: globalThis.MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-folder-actions]") || target.closest("[data-folder-actions-menu]")) return;
      setOpenMenu(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };
    const closeOnScroll = () => setOpenMenu(null);
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("scroll", closeOnScroll, true);
    window.addEventListener("resize", closeOnScroll);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("scroll", closeOnScroll, true);
      window.removeEventListener("resize", closeOnScroll);
    };
  }, [openMenu]);
  const foldersQuery = useQuery({
    queryKey: ["document-library", "folders", { parentId: currentFolder?.id }],
    queryFn: () => documentsLibraryApi.listFolders({ parentId: currentFolder?.id }),
  });
  const folders = foldersQuery.data ?? [];

  const saveFolder = async () => {
    const name = newFolderName.trim();
    if (!name || saving) return;
    setSaving(true);
    try {
      if (await onCreate(name, currentFolder)) {
        setCreating(false);
        setNewFolderName("");
      }
    } finally {
      setSaving(false);
    }
  };

  const openFolder = (folder: DocumentFolderItem) => {
    onSearchChange("");
    setOpenMenu(null);
    onOpenFolder(folder);
  };

  const backToParent = () => {
    onSearchChange("");
    setOpenMenu(null);
    onBack();
  };

  const beginCreateChild = (folder: DocumentFolderItem) => {
    openFolder(folder);
    setCreating(true);
    setNewFolderName("");
  };

  const showFolderMenu = (folderId: string, rect: Pick<DOMRect, "top" | "bottom" | "left" | "right">) => {
    const menuWidth = 184;
    const menuHeight = 136;
    const top = rect.bottom + menuHeight <= window.innerHeight - 8
      ? rect.bottom + 4
      : Math.max(8, rect.top - menuHeight - 4);
    const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
    setOpenMenu({ id: folderId, top, left });
  };

  const renderFolderActions = (folder: DocumentFolderItem) => {
    if (!canManage) return null;
    const isOpen = openMenu?.id === folder.id;

    return (
      <div className="relative flex justify-end" data-folder-actions>
        <button
          type="button"
          aria-label={`Tùy chọn thư mục ${folder.folderName}`}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          onClick={(event) => isOpen ? setOpenMenu(null) : showFolderMenu(folder.id, event.currentTarget.getBoundingClientRect())}
          className="focus-visible:outline-brand-500 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none dark:hover:bg-gray-700 dark:hover:text-white"
        >
          <MoreVertical aria-hidden="true" className="h-4 w-4" />
        </button>
        {isOpen && openMenu && createPortal(
          <div role="menu" data-folder-actions-menu style={{ top: openMenu.top, left: openMenu.left }} className="fixed z-[100] w-48 rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <button
              type="button"
              role="menuitem"
              onClick={() => beginCreateChild(folder)}
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <FolderPlus aria-hidden="true" className="h-3.5 w-3.5" />Tạo thư mục con
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpenMenu(null);
                onRename(folder);
              }}
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Pencil aria-hidden="true" className="h-3.5 w-3.5" />Đổi tên
            </button>
            <button
              type="button"
              role="menuitem"
              aria-label="Xóa thư mục"
              title="Xóa thư mục"
              onClick={() => {
                setOpenMenu(null);
                onDelete(folder);
              }}
              className="text-error-600 hover:bg-error-50 dark:text-error-300 dark:hover:bg-error-950/30 flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs"
            >
              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />Xóa thư mục
            </button>
          </div>, document.body,
        )}
      </div>
    );
  };

  const handleFolderContextMenu = (event: MouseEvent, folder: DocumentFolderItem) => {
    if (!canManage) return;
    event.preventDefault();
    showFolderMenu(folder.id, { top: event.clientY, bottom: event.clientY, left: event.clientX, right: event.clientX });
  };

  const folderRows = folders.map((folder) => (
    <tr
      key={`folder:${folder.id}`}
      onContextMenu={(event) => handleFolderContextMenu(event, folder)}
      className="group transition-colors hover:bg-gray-50/80 motion-reduce:transition-none dark:hover:bg-gray-800/40"
    >
      <td className="px-4 py-3" />
      <td className="px-3 py-3">
        <button
          type="button"
          onClick={() => openFolder(folder)}
          aria-label={`Mở thư mục ${folder.folderName}`}
          className="focus-visible:outline-brand-500 flex w-full min-w-0 items-center gap-3 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Folder aria-hidden="true" className="text-brand-500 h-5 w-5 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
            {folder.folderName}
          </span>
        </span>
        </button>
      </td>
      <td className="px-3 py-3">
        <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">Folder</span>
      </td>
      <td className="px-3 py-3 text-gray-400">—</td>
      <td className="px-3 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
        {new Date(folder.createdAt).toLocaleDateString("vi-VN")}
      </td>
      <td className="px-3 py-3 text-gray-400">—</td>
      <td className="px-3 py-2">{renderFolderActions(folder)}</td>
    </tr>
  ));

  const folderCards = folders.map((folder) => (
    <div
      key={`folder-card:${folder.id}`}
      onContextMenu={(event) => handleFolderContextMenu(event, folder)}
      className="group flex min-h-20 min-w-0 items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50/80 motion-reduce:transition-none dark:border-gray-800 dark:hover:bg-gray-800/40"
    >
      <button
        type="button"
        onClick={() => openFolder(folder)}
        className="focus-visible:outline-brand-500 flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2"
        aria-label={`Mở thư mục ${folder.folderName}`}
      >
        <Folder aria-hidden="true" className="text-brand-500 h-5 w-5 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-gray-800 dark:text-gray-100">
            {folder.folderName}
          </span>
        </span>
      </button>
      {renderFolderActions(folder)}
    </div>
  ));

  const folderListItems = folders.map((folder) => (
    <div
      key={`folder-list:${folder.id}`}
      onContextMenu={(event) => handleFolderContextMenu(event, folder)}
      className="group flex min-h-16 min-w-0 items-center gap-3 border-b border-gray-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-gray-50/80 motion-reduce:transition-none dark:border-gray-800 dark:hover:bg-gray-800/40"
    >
      <button
        type="button"
        onClick={() => openFolder(folder)}
        className="focus-visible:outline-brand-500 flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2"
        aria-label={`Mở thư mục ${folder.folderName}`}
      >
        <Folder aria-hidden="true" className="text-brand-500 h-5 w-5 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-gray-800 dark:text-gray-100">
            {folder.folderName}
          </span>
        </span>
      </button>
      {renderFolderActions(folder)}
    </div>
  ));

  return (
    <div className="min-w-0">
      <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs md:h-full md:min-h-0 dark:border-gray-800 dark:bg-gray-900">
        <header className="bg-gray-25/70 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex min-w-0 items-center gap-2">
            {path.length > 0 && (
              <button
                type="button"
                aria-label="Quay lại thư mục cha"
                onClick={backToParent}
                className="focus-visible:outline-brand-500 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none dark:hover:bg-gray-800"
              >
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
            <div className="min-w-0">
              {search.trim() ? <h2 className="truncate font-semibold text-gray-900 dark:text-white">Kết quả tìm kiếm</h2> : path.length > 0 ? (
                <nav aria-label="Đường dẫn thư mục" className="flex min-w-0 items-center gap-2 text-sm">
                  <button type="button" onClick={() => { onSearchChange(""); onOpenRoot(); }} className={`${path.length ? "text-gray-500 hover:text-brand-600" : "font-semibold text-gray-900 dark:text-white"} shrink-0`}>Kho tài liệu</button>
                  {path.map((folder, index) => <span key={folder.id} className="flex min-w-0 items-center gap-2">
                    <span aria-hidden="true" className="text-gray-400">/</span>
                    {index === path.length - 1 ? <span aria-current="page" className="truncate font-semibold text-gray-900 dark:text-white">{folder.folderName}</span> : <button type="button" onClick={() => { onSearchChange(""); onSelectPath(path.slice(0, index + 1)); }} className="max-w-40 truncate text-gray-500 hover:text-brand-600">{folder.folderName}</button>}
                  </span>)}
                </nav>
              ) : null}
            </div>
          </div>
          <form
            onSubmit={(event) => { event.preventDefault(); onSearchChange(searchInput.trim()); }}
            onClick={(event) => {
              if (!(event.target instanceof HTMLButtonElement)) searchInputRef.current?.focus();
            }}
            role="search"
            className="flex h-10 w-full min-w-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100 sm:ml-3 sm:w-80 dark:border-gray-700 dark:bg-gray-800 dark:focus-within:ring-brand-950"
          >
            <button type="submit" aria-label="Tìm kiếm" title="Tìm kiếm" className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-gray-700">
              <Search aria-hidden="true" className="h-4 w-4" />
            </button>
            <input ref={searchInputRef} value={searchInput} onChange={(event) => setSearchInput(event.target.value)} aria-label="Tìm file hoặc thư mục" placeholder="Tìm file hoặc thư mục · Enter" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 dark:text-white" />
            {searchInput && <button type="button" aria-label="Xóa nội dung tìm kiếm" onClick={() => { setSearchInput(""); onSearchChange(""); searchInputRef.current?.focus(); }} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"><X aria-hidden="true" className="h-4 w-4" /></button>}
          </form>
          <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
            {showAssignmentFilter && (
              <DocumentLibraryStatusFilter
                value={assignmentFilter}
                onChange={onAssignmentFilterChange}
              />
            )}
            <div
              role="group"
              aria-label="Chế độ hiển thị thư mục"
              className="flex shrink-0 rounded-lg border border-gray-200 bg-gray-50/70 p-0.5 dark:border-gray-700 dark:bg-gray-800/70"
            >
              <button
                type="button"
                aria-label="Dạng danh sách"
                aria-pressed={displayMode === "list"}
                onClick={() => onDisplayModeChange("list")}
                className={`focus-visible:outline-brand-500 rounded-md p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 ${displayMode === "list" ? "text-brand-600 dark:text-brand-300 bg-white shadow-xs dark:bg-gray-700" : "text-gray-500 hover:bg-white dark:text-gray-400 dark:hover:bg-gray-700"}`}
              >
                <List aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Dạng lưới"
                aria-pressed={displayMode === "grid"}
                onClick={() => onDisplayModeChange("grid")}
                className={`focus-visible:outline-brand-500 rounded-md p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 ${displayMode === "grid" ? "text-brand-600 dark:text-brand-300 bg-white shadow-xs dark:bg-gray-700" : "text-gray-500 hover:bg-white dark:text-gray-400 dark:hover:bg-gray-700"}`}
              >
                <Grid2X2 aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            {(canManage || canUpload) && (
              <div className="relative" ref={createMenuRef}>
                <button
                  ref={createMenuButtonRef}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={createMenuOpen}
                  onClick={() => setCreateMenuOpen((open) => !open)}
                  className="bg-brand-600 hover:bg-brand-700 focus-visible:outline-brand-500 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto"
                >
                  <FolderPlus aria-hidden="true" className="h-4 w-4" />
                  Tạo mới
                  <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${createMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {createMenuOpen && <div role="menu" className="absolute right-0 z-30 mt-2 min-w-48 rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                  {canManage && <button type="button" role="menuitem" onClick={() => { setCreating(true); setNewFolderName(""); setCreateMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"><FolderPlus aria-hidden="true" className="h-4 w-4" />Thư mục mới</button>}
                  {canUpload && <button type="button" role="menuitem" disabled={uploading} onClick={() => { onUploadClick(); setCreateMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:text-gray-200 dark:hover:bg-gray-800"><Upload aria-hidden="true" className="h-4 w-4" />{uploadButtonLabel}</button>}
                </div>}
              </div>
            )}
          </div>
        </header>

        <div
          role="region"
          aria-label={`Nội dung ${currentFolder?.folderName ?? "tất cả thư mục"}`}
          className="flex min-h-56 min-w-0 flex-1 flex-col"
        >
          {creating && canManage && (
            <form
              aria-label="Thư mục mới"
              onSubmit={(event) => {
                event.preventDefault();
                void saveFolder();
              }}
              className="border-brand-100 bg-brand-50/60 dark:border-brand-900 dark:bg-brand-950/20 flex items-center gap-3 border-b px-4 py-3"
            >
              <Folder aria-hidden="true" className="text-brand-600 h-5 w-5 shrink-0" />
              <input
                autoFocus
                value={newFolderName}
                onChange={(event) => setNewFolderName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setCreating(false);
                    setNewFolderName("");
                  }
                }}
                disabled={saving}
                maxLength={255}
                aria-label="Tên thư mục mới"
                placeholder="Tên thư mục mới"
                className="border-brand-200 focus:border-brand-500 dark:border-brand-800 h-9 min-w-0 flex-1 rounded-lg border bg-white px-3 text-sm text-gray-900 outline-none dark:bg-gray-900 dark:text-white"
              />
              <button
                type="submit"
                aria-label="Lưu thư mục mới"
                disabled={saving || !newFolderName.trim()}
                className="text-brand-700 dark:text-brand-300 rounded-md p-2 hover:bg-white disabled:opacity-40 dark:hover:bg-gray-800"
              >
                <Check aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Hủy tạo thư mục"
                disabled={saving}
                onClick={() => {
                  setCreating(false);
                  setNewFolderName("");
                }}
                className="rounded-md p-2 text-gray-500 hover:bg-white dark:hover:bg-gray-800"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </form>
          )}

          {search.trim() ? (
            searchResults ?? <p className="p-10 text-center text-sm text-gray-500">Đang tìm...</p>
          ) : mergeContents &&
          renderDocumentPanel &&
          !foldersQuery.isLoading &&
          !foldersQuery.isError ? (
            renderDocumentPanel(folderRows, folderCards)
          ) : (
            <>
              {foldersQuery.isLoading && !renderDocumentPanel ? (
                <p className="p-10 text-center text-sm text-gray-500">Đang tải thư mục...</p>
              ) : foldersQuery.isError ? (
                <div className="p-10 text-center text-sm text-gray-500">
                  <p>Không tải được danh sách thư mục.</p>
                  <button
                    type="button"
                    onClick={() => void foldersQuery.refetch()}
                    className="text-brand-600 mt-2 hover:underline"
                  >
                    Thử lại
                  </button>
                </div>
              ) : folders.length === 0 && !renderDocumentPanel ? (
                <div className="p-12 text-center text-sm text-gray-500">
                  {search ? "Không tìm thấy thư mục phù hợp." : "Chưa có thư mục trong vị trí này."}
                </div>
              ) : folders.length > 0 && (!mergeContents || !renderDocumentPanel) ? (
                <div
                  className={
                    displayMode === "grid"
                      ? "grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3"
                      : "divide-y divide-gray-100 dark:divide-gray-800"
                  }
                >
                  {displayMode === "grid" ? folderCards : folderListItems}
                </div>
              ) : null}
              {renderDocumentPanel?.(null, null)}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
