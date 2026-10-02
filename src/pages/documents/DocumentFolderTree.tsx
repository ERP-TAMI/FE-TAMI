import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Folder, FolderClosed } from "lucide-react";
import { documentsLibraryApi } from "@/api/documents-library.api";
import type { DocumentFolderItem } from "@/types/document-library";

type DocumentFolderTreeProps = {
  path: DocumentFolderItem[];
  onSelectPath: (path: DocumentFolderItem[]) => void;
  onOpenRoot: () => void;
};

export function DocumentFolderTree({ path, onSelectPath, onOpenRoot }: DocumentFolderTreeProps) {
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(() => new Set());
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(() => new Set());
  const pathIds = new Set(path.map((folder) => folder.id));
  const rootFoldersQuery = useQuery({
    queryKey: ["document-library", "folders", { parentId: undefined }],
    queryFn: () => documentsLibraryApi.listFolders({}),
  });
  const pathKey = path.map((folder) => folder.id).join("/");

  useEffect(() => {
    if (!pathKey) return;
    setCollapsedFolderIds((current) => {
      const next = new Set(current);
      path.forEach((folder) => next.delete(folder.id));
      return next;
    });
  }, [path, pathKey]);

  const toggleExpanded = (folderId: string, isExpanded: boolean) => {
    if (isExpanded) {
      setCollapsedFolderIds((current) => new Set(current).add(folderId));
    } else {
      setCollapsedFolderIds((current) => {
        const next = new Set(current);
        next.delete(folderId);
        return next;
      });
      setExpandedFolderIds((current) => new Set(current).add(folderId));
    }
  };

  return (
    <aside className="bg-gray-25/70 max-h-56 overflow-y-auto border-b border-gray-100 p-3 md:max-h-[min(65vh,720px)] md:border-r md:border-b-0 dark:border-gray-800 dark:bg-gray-900/70">
      <h3 className="bg-gray-25/70 sticky top-0 z-10 px-2 pb-2 text-[10px] font-semibold tracking-[0.12em] text-gray-500 uppercase dark:bg-gray-900/95">
        Cây thư mục
      </h3>
      <div role="tree" aria-label="Cây thư mục tài liệu" className="text-sm">
        <button
          type="button"
          role="treeitem"
          aria-selected={path.length === 0}
          onClick={onOpenRoot}
          className={`focus-visible:outline-brand-500 flex min-h-9 w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none ${
            path.length === 0
              ? "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 font-medium"
              : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
          }`}
        >
          <Folder aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span className="truncate">Tất cả thư mục</span>
        </button>

        {rootFoldersQuery.isLoading ? (
          <p className="px-2 py-3 text-xs text-gray-500">Đang tải cây thư mục...</p>
        ) : rootFoldersQuery.isError ? (
          <button
            type="button"
            onClick={() => void rootFoldersQuery.refetch()}
            className="text-brand-600 focus-visible:outline-brand-500 rounded px-2 py-3 text-left text-xs hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Không tải được cây thư mục. Thử lại
          </button>
        ) : (
          <ul role="group" className="mt-1 space-y-0.5">
            {(rootFoldersQuery.data ?? []).map((folder) => (
              <DocumentFolderTreeNode
                key={folder.id}
                folder={folder}
                ancestors={[]}
                path={path}
                pathIds={pathIds}
                expandedFolderIds={expandedFolderIds}
                collapsedFolderIds={collapsedFolderIds}
                onToggleExpanded={toggleExpanded}
                onSelectPath={onSelectPath}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

type DocumentFolderTreeNodeProps = {
  folder: DocumentFolderItem;
  ancestors: DocumentFolderItem[];
  path: DocumentFolderItem[];
  pathIds: Set<string>;
  expandedFolderIds: Set<string>;
  collapsedFolderIds: Set<string>;
  onToggleExpanded: (folderId: string, isExpanded: boolean) => void;
  onSelectPath: (path: DocumentFolderItem[]) => void;
};

function DocumentFolderTreeNode({
  folder,
  ancestors,
  path,
  pathIds,
  expandedFolderIds,
  collapsedFolderIds,
  onToggleExpanded,
  onSelectPath,
}: DocumentFolderTreeNodeProps) {
  const pathFolder = path.find((item) => item.id === folder.id);
  const isCurrent = path.at(-1)?.id === folder.id;
  const isExpanded =
    folder.hasChildren &&
    !collapsedFolderIds.has(folder.id) &&
    (expandedFolderIds.has(folder.id) || pathIds.has(folder.id));
  const childrenQuery = useQuery({
    queryKey: ["document-library", "folders", { parentId: folder.id }],
    queryFn: () => documentsLibraryApi.listFolders({ parentId: folder.id }),
    enabled: isExpanded,
  });
  const folderPath = pathFolder
    ? path.slice(0, path.indexOf(pathFolder) + 1)
    : [...ancestors, folder];

  return (
    <li role="none">
      <div
        role="treeitem"
        aria-level={ancestors.length + 1}
        aria-expanded={folder.hasChildren ? isExpanded : undefined}
        aria-selected={isCurrent}
        className={`flex min-w-0 items-center rounded-lg pr-1 transition-colors ${
          isCurrent
            ? "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 font-medium"
            : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
        }`}
      >
        {folder.hasChildren ? (
          <button
            type="button"
            aria-label={`${isExpanded ? "Thu gọn" : "Mở rộng"} cây thư mục ${folder.folderName}`}
            aria-expanded={isExpanded}
            onClick={() => onToggleExpanded(folder.id, isExpanded)}
            className="focus-visible:outline-brand-500 rounded p-1.5 text-gray-400 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-1 dark:hover:text-gray-200"
          >
            {isExpanded ? (
              <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span aria-hidden="true" className="w-7 shrink-0" />
        )}
        <button
          type="button"
          aria-label={`Chọn thư mục ${folder.folderName}`}
          onClick={() => onSelectPath(folderPath)}
          className="focus-visible:outline-brand-500 flex min-h-9 min-w-0 flex-1 items-center gap-2 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-1"
        >
          <FolderClosed aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span className="truncate">{folder.folderName}</span>
        </button>
      </div>

      {isExpanded && (
        <ul role="group" className="ml-3 border-l border-gray-200 pl-2 dark:border-gray-700">
          {childrenQuery.isLoading ? (
            <li role="none" className="px-2 py-2 text-xs text-gray-400">
              Đang tải...
            </li>
          ) : childrenQuery.isError ? (
            <li role="none">
              <button
                type="button"
                onClick={() => void childrenQuery.refetch()}
                className="text-brand-600 px-2 py-2 text-left text-xs hover:underline"
              >
                Tải nhánh này lại
              </button>
            </li>
          ) : (childrenQuery.data ?? []).length === 0 ? (
            <li role="none" className="px-2 py-2 text-xs text-gray-400">
              Thư mục trống
            </li>
          ) : (
            (childrenQuery.data ?? []).map((child) => (
              <DocumentFolderTreeNode
                key={child.id}
                folder={child}
                ancestors={[...ancestors, folder]}
                path={path}
                pathIds={pathIds}
                expandedFolderIds={expandedFolderIds}
                collapsedFolderIds={collapsedFolderIds}
                onToggleExpanded={onToggleExpanded}
                onSelectPath={onSelectPath}
              />
            ))
          )}
        </ul>
      )}
    </li>
  );
}
