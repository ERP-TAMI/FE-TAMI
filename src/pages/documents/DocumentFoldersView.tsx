import { useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { documentsLibraryApi } from "@/api/documents-library.api";
import type { DocumentFolderItem } from "@/types/document-library";
import { DocumentFolderTree } from "@/pages/documents/DocumentFolderTree";

type DocumentFoldersViewProps = {
  path: DocumentFolderItem[];
  canManage: boolean;
  onOpenFolder: (folder: DocumentFolderItem) => void;
  onSelectPath: (path: DocumentFolderItem[]) => void;
  onOpenRoot: () => void;
  onBack: () => void;
  onCreate: (name: string, parent: DocumentFolderItem | null) => Promise<boolean>;
  onRename: (folder: DocumentFolderItem) => void;
  onDelete: (folder: DocumentFolderItem) => void;
  mergeContents?: boolean;
  renderDocumentPanel?: (
    folderRows: ReactNode | null,
    folderCards: ReactNode | null,
    folderCount: number,
  ) => ReactNode;
};

export function DocumentFoldersView({
  path,
  canManage,
  onOpenFolder,
  onSelectPath,
  onOpenRoot,
  onBack,
  onCreate,
  onRename,
  onDelete,
  mergeContents = false,
  renderDocumentPanel,
}: DocumentFoldersViewProps) {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [saving, setSaving] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const currentFolder = path.at(-1) ?? null;
  const foldersQuery = useQuery({
    queryKey: ["document-library", "folders", { parentId: currentFolder?.id }],
    queryFn: () => documentsLibraryApi.listFolders({ parentId: currentFolder?.id }),
  });
  const folders = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("vi");
    if (!term) return foldersQuery.data ?? [];
    return (foldersQuery.data ?? []).filter((folder) =>
      folder.folderName.toLocaleLowerCase("vi").includes(term),
    );
  }, [foldersQuery.data, search]);

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
    setSearch("");
    setOpenMenu(null);
    onOpenFolder(folder);
  };

  const backToParent = () => {
    setSearch("");
    setOpenMenu(null);
    onBack();
  };

  const beginCreateChild = (folder: DocumentFolderItem) => {
    openFolder(folder);
    setCreating(true);
    setNewFolderName("");
  };

  const renderFolderActions = (folder: DocumentFolderItem) => {
    if (!canManage) return null;

    return (
      <div className="relative">
        <button
          type="button"
          aria-label={`Tùy chọn thư mục ${folder.folderName}`}
          aria-expanded={openMenu === folder.id}
          onClick={() => setOpenMenu((current) => (current === folder.id ? null : folder.id))}
          className="focus-visible:outline-brand-500 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none dark:hover:bg-gray-700 dark:hover:text-white"
        >
          <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
        </button>
        {openMenu === folder.id && (
          <div
            role="menu"
            className="absolute top-9 right-0 z-20 flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
          >
            <button
              type="button"
              role="menuitem"
              aria-label="Tạo thư mục mới"
              title="Tạo thư mục mới"
              onClick={() => beginCreateChild(folder)}
              className="hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/30 rounded-md p-2 text-gray-600 dark:text-gray-300"
            >
              <FolderPlus aria-hidden="true" className="h-4 w-4" />
            </button>
            <button
              type="button"
              role="menuitem"
              aria-label="Đổi tên thư mục"
              title="Đổi tên thư mục"
              onClick={() => {
                setOpenMenu(null);
                onRename(folder);
              }}
              className="rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Pencil aria-hidden="true" className="h-4 w-4" />
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
              className="text-error-600 hover:bg-error-50 dark:text-error-300 dark:hover:bg-error-950/30 rounded-md p-2"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const handleFolderContextMenu = (event: MouseEvent, folder: DocumentFolderItem) => {
    if (!canManage) return;
    event.preventDefault();
    setOpenMenu(folder.id);
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
            <span className="mt-0.5 block text-xs text-gray-500">
              {folder.documentCount} file{folder.documentCount === 1 ? "" : "s"}
              {folder.hasChildren ? " · Có thư mục con" : ""}
            </span>
          </span>
        </button>
      </td>
      <td className="px-3 py-3">
        <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          Thư mục
        </span>
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
      className="group flex min-w-0 items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50/80 motion-reduce:transition-none dark:border-gray-800 dark:hover:bg-gray-800/40"
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
          <span className="mt-0.5 block text-xs text-gray-500">
            {folder.documentCount} file{folder.documentCount === 1 ? "" : "s"}
            {folder.hasChildren ? " · Có thư mục con" : ""}
          </span>
        </span>
      </button>
      {renderFolderActions(folder)}
    </div>
  ));

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
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
            <h2 className="truncate font-semibold text-gray-900 dark:text-white">
              {currentFolder?.folderName ?? "Tất cả thư mục"}
            </h2>
            {path.length > 1 && (
              <p className="mt-1 truncate text-xs text-gray-500">
                {path
                  .slice(0, -1)
                  .map((folder) => folder.folderName)
                  .join(" / ")}
              </p>
            )}
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Tìm thư mục hiện tại"
            placeholder="Tìm thư mục..."
            className="focus:border-brand-300 focus:ring-brand-100 dark:focus:ring-brand-950 h-9 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-sm transition-colors outline-none placeholder:text-gray-400 focus:ring-2 sm:w-48 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          {canManage && (
            <button
              type="button"
              onClick={() => {
                setCreating(true);
                setNewFolderName("");
              }}
              className="bg-brand-600 hover:bg-brand-700 focus-visible:outline-brand-500 inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              Tạo thư mục
            </button>
          )}
        </div>
      </header>

      <div className="grid min-h-56 md:grid-cols-[220px_minmax(0,1fr)]">
        <DocumentFolderTree path={path} onSelectPath={onSelectPath} onOpenRoot={onOpenRoot} />

        <div
          role="region"
          aria-label={`Nội dung ${currentFolder?.folderName ?? "tất cả thư mục"}`}
          className="min-w-0"
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

          {mergeContents &&
          renderDocumentPanel &&
          !foldersQuery.isLoading &&
          !foldersQuery.isError ? (
            renderDocumentPanel(folderRows, folderCards, folders.length)
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
                <div className="divide-y divide-gray-100 dark:divide-gray-800">{folderCards}</div>
              ) : null}
              {renderDocumentPanel?.(null, null, folders.length)}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
