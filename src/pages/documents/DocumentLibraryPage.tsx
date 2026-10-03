import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import {
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Link2,
  LoaderCircle,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { documentsLibraryApi } from "@/api/documents-library.api";
import { stylesApi } from "@/api/stylesApi";
import {
  Button,
  ConfirmDialog,
  FileTypeIcon,
  Modal,
  PageHeader,
  Toast,
  getFileMeta,
} from "@/components/shared";
import { useToast } from "@/hooks/useToast";
import { getApiError } from "@/lib/apiError";
import { useAuthStore } from "@/store/authStore";
import type {
  DocumentFolderItem,
  DocumentLibraryItem,
  DocumentVersionItem,
} from "@/types/document-library";
import type { Style } from "@/types/style";
import type { DocumentLibraryFilter } from "@/pages/documents/DocumentLibraryStatusFilter";
import { DocumentFoldersView } from "@/pages/documents/DocumentFoldersView";

const VIEW_PERMISSION = "master_data.documents.view";
const MANAGE_PERMISSION = "master_data.documents.manage";
const ASSIGN_PERMISSION = "master_data.documents.assign";
const FILE_MENU_WIDTH = 176;
const STYLE_PICKER_PAGE_SIZE = 20;
const MAX_BULK_DOCUMENT_SELECTION = 100;
const EMPTY_DOCUMENTS: DocumentLibraryItem[] = [];
type FolderDialogState = { mode: "rename"; folder: DocumentFolderItem; name: string } | null;
type ArchiveConfirmation = {
  documents: DocumentLibraryItem[];
  clearSelection: boolean;
} | null;
type OpenFileMenu = { key: string; top: number; left: number } | null;
type UploadPhase = "preparing" | "uploading" | "confirming" | "refreshing";
type UploadProgress = {
  done: number;
  total: number;
  processedBytes: number;
  totalBytes: number;
  currentBytes: number;
  currentFileName: string;
  failures: number;
  phase: UploadPhase;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN");
}

function formatDateOnly(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("vi-VN");
}

export default function DocumentLibraryPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();
  const canView = user?.permissions.includes(VIEW_PERMISSION) ?? false;
  const canManage = user?.permissions.includes(MANAGE_PERMISSION) ?? false;
  const canAssignDocuments = user?.permissions.includes(ASSIGN_PERMISSION) ?? false;

  const [selectedFolder, setSelectedFolder] = useState<DocumentFolderItem | null>(null);
  const [folderPath, setFolderPath] = useState<DocumentFolderItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<DocumentLibraryFilter>("all");
  const folderId = selectedFolder?.id ?? "";
  const [search, setSearch] = useState("");
  const [folderDialog, setFolderDialog] = useState<FolderDialogState>(null);
  const [savingFolder, setSavingFolder] = useState(false);
  const [deletingFolder, setDeletingFolder] = useState<DocumentFolderItem | null>(null);
  const [deleteFolderPending, setDeleteFolderPending] = useState(false);
  const [archiveConfirmation, setArchiveConfirmation] = useState<ArchiveConfirmation>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    done: 0,
    total: 0,
    processedBytes: 0,
    totalBytes: 0,
    currentBytes: 0,
    currentFileName: "",
    failures: 0,
    phase: "preparing",
  });
  const [versionsDocument, setVersionsDocument] = useState<DocumentLibraryItem | null>(null);
  const [versionDocument, setVersionDocument] = useState<DocumentLibraryItem | null>(null);
  const [assignmentDocuments, setAssignmentDocuments] = useState<DocumentLibraryItem[] | null>(
    null,
  );
  const [clearSelectionAfterAssign, setClearSelectionAfterAssign] = useState(false);
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [isAssigningDocument, setIsAssigningDocument] = useState(false);
  const [folderDisplayMode, setFolderDisplayMode] = useState<"list" | "grid">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openFileMenu, setOpenFileMenu] = useState<OpenFileMenu>(null);
  const [selectedActionsOpen, setSelectedActionsOpen] = useState(false);
  const [bulkActionPending, setBulkActionPending] = useState(false);
  const [selectedDocumentKeys, setSelectedDocumentKeys] = useState<Set<string>>(new Set());
  const selectedDocumentCache = useRef<Map<string, DocumentLibraryItem>>(new Map());
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const versionInputRef = useRef<HTMLInputElement>(null);
  const selectedActionsRef = useRef<HTMLDivElement>(null);

  const clearDocumentSelection = () => {
    selectedDocumentCache.current.clear();
    setSelectedDocumentKeys(new Set());
    setSelectedActionsOpen(false);
  };
  const assignmentStatus = activeFilter === "all" ? undefined : activeFilter === "assigned";
  const requestLimit = pageSize;
  const documentsQuery = useQuery({
    queryKey: [
      "document-library",
      {
        folderId,
        search,
        assignmentStatus,
        page: currentPage,
        limit: requestLimit,
      },
    ],
    queryFn: () =>
      documentsLibraryApi.list({
        ...(folderId ? { folderId } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(assignmentStatus !== undefined ? { assigned: assignmentStatus } : {}),
        page: currentPage,
        limit: requestLimit,
      }),
    enabled: canView && Boolean(folderId),
  });
  const versionsQuery = useQuery({
    queryKey: ["document-library", versionsDocument?.documentId, "versions"],
    queryFn: () => documentsLibraryApi.listVersions(versionsDocument!.documentId),
    enabled: Boolean(versionsDocument),
  });
  const stylePickerQuery = useQuery({
    queryKey: ["styles", "document-assignment", assignmentSearch, assignmentPage],
    queryFn: () =>
      stylesApi.getStyles({
        search: assignmentSearch.trim() || undefined,
        page: assignmentPage,
        limit: STYLE_PICKER_PAGE_SIZE,
      }),
    enabled: canAssignDocuments && Boolean(assignmentDocuments),
  });

  const documents = documentsQuery.data?.data ?? EMPTY_DOCUMENTS;
  const selectedDocuments = useMemo(() => {
    const selectedByDocumentId = new Map<string, DocumentLibraryItem>();
    for (const key of selectedDocumentKeys) {
      const document = selectedDocumentCache.current.get(key);
      if (document) selectedByDocumentId.set(document.documentId, document);
    }
    return Array.from(selectedByDocumentId.values());
  }, [selectedDocumentKeys]);
  const totalDocumentCount = documentsQuery.data?.meta.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalDocumentCount / requestLimit));
  const visiblePage = Math.min(currentPage, pageCount);
  const visibleDocuments = documents;
  const activeDisplayMode = folderDisplayMode;
  const uploadProgressPercent =
    uploadProgress.totalBytes > 0
      ? Math.min(
          100,
          Math.round(
            ((uploadProgress.processedBytes + uploadProgress.currentBytes) /
              uploadProgress.totalBytes) *
              100,
          ),
        )
      : uploadProgress.total > 0
        ? Math.round((uploadProgress.done / uploadProgress.total) * 100)
        : 0;
  const visibleUploadProgress =
    uploadProgress.phase === "refreshing"
      ? uploadProgressPercent
      : Math.min(99, uploadProgressPercent);
  const visibleDocumentKeys = visibleDocuments.map(
    (document) => `${document.documentId}:${document.folderId}`,
  );
  const allVisibleSelected =
    visibleDocumentKeys.length > 0 &&
    visibleDocumentKeys.every((key) => selectedDocumentKeys.has(key));
  const versions = versionsQuery.data ?? [];

  useEffect(() => {
    setCurrentPage(1);
    clearDocumentSelection();
  }, [activeFilter, folderId, search, pageSize]);

  useEffect(() => {
    if (documentsQuery.data && currentPage > pageCount) setCurrentPage(pageCount);
  }, [currentPage, pageCount, documentsQuery.data]);

  useEffect(() => {
    if (!selectedActionsOpen) return;
    const closeOnOutsideClick = (event: globalThis.MouseEvent) => {
      if (event.target instanceof Node && !selectedActionsRef.current?.contains(event.target)) {
        setSelectedActionsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedActionsOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedActionsOpen]);

  useEffect(() => {
    if (!openFileMenu) return;
    const closeOnOutsideClick = (event: globalThis.MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-file-actions]") || target.closest("[data-file-actions-menu]")) {
        return;
      }
      setOpenFileMenu(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenFileMenu(null);
    };
    const closeOnScroll = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-file-actions-menu]")) return;
      setOpenFileMenu(null);
    };
    const closeOnResize = () => setOpenFileMenu(null);

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("scroll", closeOnScroll, true);
    window.addEventListener("resize", closeOnResize);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("scroll", closeOnScroll, true);
      window.removeEventListener("resize", closeOnResize);
    };
  }, [openFileMenu]);

  if (!canView) return <Navigate to="/forbidden" replace />;

  const toggleFilter = (filter: DocumentLibraryFilter) => {
    setActiveFilter(filter);
  };

  const openFolder = (folder: DocumentFolderItem) => {
    setSearch("");
    setFolderPath((path) => [...path, folder]);
    setSelectedFolder(folder);
  };

  const goToParentFolder = () => {
    setSearch("");
    setFolderPath((path) => {
      const nextPath = path.slice(0, -1);
      setSelectedFolder(nextPath.at(-1) ?? null);
      return nextPath;
    });
  };

  const refreshLibrary = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["document-library"] }),
      queryClient.invalidateQueries({ queryKey: ["style-documents"] }),
    ]);
  };

  const handleSaveFolder = async () => {
    if (!folderDialog || folderDialog.mode !== "rename") return;
    const name = folderDialog.name.trim();
    if (!name) return;
    setSavingFolder(true);
    try {
      await documentsLibraryApi.renameFolder(folderDialog.folder.id, name);
      if (selectedFolder?.id === folderDialog.folder.id) {
        setSelectedFolder({ ...selectedFolder, folderName: name });
      }
      setFolderPath((path) =>
        path.map((folder) =>
          folder.id === folderDialog.folder.id ? { ...folder, folderName: name } : folder,
        ),
      );
      showToast("Đã đổi tên thư mục.");
      setFolderDialog(null);
      await refreshLibrary();
    } catch (err) {
      showToast(getApiError(err, "Đổi tên thư mục thất bại.").message, "error");
    } finally {
      setSavingFolder(false);
    }
  };

  const handleCreateFolder = async (
    folderName: string,
    parentFolder: DocumentFolderItem | null,
  ): Promise<boolean> => {
    try {
      await documentsLibraryApi.createFolder(folderName, parentFolder?.id);
      await refreshLibrary();
      showToast("Đã tạo thư mục.");
      return true;
    } catch (err) {
      showToast(getApiError(err, "Tạo thư mục thất bại.").message, "error");
      return false;
    }
  };

  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || !folderId) return;
    const files = Array.from(fileList);
    if (files.length === 0) return;
    setUploading(true);
    let processedBytes = 0;
    setUploadProgress({
      done: 0,
      total: files.length,
      processedBytes: 0,
      totalBytes: files.reduce((sum, file) => sum + file.size, 0),
      currentBytes: 0,
      currentFileName: "",
      failures: 0,
      phase: "preparing",
    });
    let succeeded = 0;
    const failures: string[] = [];
    for (const file of files) {
      setUploadProgress((progress) => ({
        ...progress,
        currentFileName: file.name,
        currentBytes: 0,
        phase: "preparing",
      }));
      try {
        const presign = await documentsLibraryApi.presignInitialUpload(folderId, file);
        setUploadProgress((progress) => ({ ...progress, phase: "uploading" }));
        await documentsLibraryApi.uploadToStorage(presign.uploadUrl, file, (loadedBytes) => {
          setUploadProgress((progress) => ({
            ...progress,
            currentBytes: Math.min(loadedBytes, file.size),
            phase: "uploading",
          }));
        });
        setUploadProgress((progress) => ({ ...progress, phase: "confirming" }));
        await documentsLibraryApi.confirmInitialUpload(folderId, file, presign.objectKey);
        succeeded += 1;
      } catch (err) {
        failures.push(`${file.name}: ${getApiError(err, "Upload thất bại.").message}`);
      } finally {
        processedBytes += file.size;
        setUploadProgress((progress) => ({
          ...progress,
          done: progress.done + 1,
          processedBytes,
          currentBytes: 0,
          currentFileName: "",
          failures: failures.length,
        }));
      }
    }
    setUploadProgress((progress) => ({ ...progress, phase: "refreshing" }));
    try {
      await refreshLibrary();
    } finally {
      setUploading(false);
    }
    if (failures.length === 0) {
      showToast(`Đã tải lên ${succeeded} tài liệu.`);
    } else {
      showToast(
        `Đã tải ${succeeded}/${files.length} tài liệu. ${failures.slice(0, 2).join(" ")}`,
        "error",
      );
    }
    if (uploadInputRef.current) uploadInputRef.current.value = "";
  };

  const handleVersionFile = async (file: File | undefined) => {
    if (!file || !versionDocument) return;
    const changeReason = window.prompt("Lý do cập nhật version (không bắt buộc):") ?? "";
    try {
      const presign = await documentsLibraryApi.presignVersionUpload(
        versionDocument.documentId,
        file,
      );
      await documentsLibraryApi.uploadToStorage(presign.uploadUrl, file);
      await documentsLibraryApi.confirmVersionUpload(
        versionDocument.documentId,
        file,
        presign.objectKey,
        changeReason.trim() || undefined,
      );
      await refreshLibrary();
      await queryClient.invalidateQueries({
        queryKey: ["document-library", versionDocument.documentId, "versions"],
      });
      showToast("Đã tạo version mới.");
    } catch (err) {
      showToast(getApiError(err, "Tạo version mới thất bại.").message, "error");
    } finally {
      setVersionDocument(null);
      if (versionInputRef.current) versionInputRef.current.value = "";
    }
  };

  const openFile = async (documentId: string, versionId?: string, download = false) => {
    const popup = window.open("", "_blank");
    try {
      const { url } = await documentsLibraryApi.getViewUrl(documentId, {
        versionId,
        download,
      });
      if (popup) popup.location.href = url;
    } catch (err) {
      popup?.close();
      showToast(getApiError(err, "Không thể mở tài liệu.").message, "error");
    }
  };

  const handleDeleteFolder = async () => {
    if (!deletingFolder) return;
    setDeleteFolderPending(true);
    try {
      await documentsLibraryApi.deleteFolder(deletingFolder.id);
      if (folderId === deletingFolder.id) {
        const nextPath = folderPath.slice(0, -1);
        setFolderPath(nextPath);
        setSelectedFolder(nextPath.at(-1) ?? null);
      }
      setDeletingFolder(null);
      await refreshLibrary();
      showToast("Đã xóa thư mục.");
    } catch (err) {
      showToast(getApiError(err, "Không thể xóa thư mục.").message, "error");
    } finally {
      setDeleteFolderPending(false);
    }
  };

  const handleArchive = (document: DocumentLibraryItem) => {
    setArchiveConfirmation({ documents: [document], clearSelection: false });
  };

  const handleBulkArchive = () => {
    setSelectedActionsOpen(false);
    const documentsToArchive = selectedDocuments;
    if (documentsToArchive.length === 0) return;
    setArchiveConfirmation({ documents: documentsToArchive, clearSelection: true });
  };

  const confirmArchiveDocuments = async () => {
    if (!archiveConfirmation || bulkActionPending) return;
    const { documents: documentsToArchive, clearSelection } = archiveConfirmation;
    setBulkActionPending(true);
    try {
      const results = await Promise.allSettled(
        documentsToArchive.map((document) => documentsLibraryApi.archive(document.documentId)),
      );
      const succeeded = results.filter((result) => result.status === "fulfilled").length;
      const failed = results.length - succeeded;
      await refreshLibrary();
      if (clearSelection) clearDocumentSelection();
      setArchiveConfirmation(null);
      showToast(
        failed === 0
          ? `Đã xóa ${succeeded} tài liệu khỏi kho.`
          : `Đã xóa ${succeeded}/${results.length} tài liệu; ${failed} tài liệu thất bại.`,
        failed === 0 ? "success" : "error",
      );
    } catch (err) {
      setArchiveConfirmation(null);
      showToast(getApiError(err, "Xóa tài liệu khỏi kho thất bại.").message, "error");
    } finally {
      setBulkActionPending(false);
    }
  };

  const openAssignmentDialog = (
    documentsToAssign: DocumentLibraryItem[],
    clearSelectionOnSuccess = false,
  ) => {
    if (documentsToAssign.length === 0) return;
    if (documentsToAssign.length > MAX_BULK_DOCUMENT_SELECTION) {
      showToast("Chỉ có thể gán tối đa 100 tài liệu trong một lần.", "error");
      return;
    }
    setAssignmentSearch("");
    setAssignmentPage(1);
    setSelectedStyleId(null);
    setClearSelectionAfterAssign(clearSelectionOnSuccess);
    setAssignmentDocuments(documentsToAssign);
  };

  const closeAssignmentDialog = () => {
    if (isAssigningDocument) return;
    setAssignmentDocuments(null);
    setSelectedStyleId(null);
    setClearSelectionAfterAssign(false);
  };

  const handleAssignDocument = async () => {
    if (!assignmentDocuments?.length || !selectedStyleId || isAssigningDocument) return;
    setIsAssigningDocument(true);
    try {
      await documentsLibraryApi.assignToStyle(
        selectedStyleId,
        assignmentDocuments.map((document) => document.documentId),
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["document-library"] }),
        queryClient.invalidateQueries({ queryKey: ["style-documents", selectedStyleId] }),
      ]);
      setAssignmentDocuments(null);
      setSelectedStyleId(null);
      if (clearSelectionAfterAssign) clearDocumentSelection();
      setClearSelectionAfterAssign(false);
      showToast(
        assignmentDocuments.length === 1
          ? "Đã gán tài liệu vào mẫu Fit."
          : `Đã gán ${assignmentDocuments.length} tài liệu vào mẫu Fit.`,
      );
    } catch (err) {
      showToast(getApiError(err, "Gán tài liệu vào mẫu Fit thất bại.").message, "error");
    } finally {
      setIsAssigningDocument(false);
    }
  };

  const toggleDocumentSelection = (document: DocumentLibraryItem) => {
    const key = `${document.documentId}:${document.folderId}`;
    if (selectedDocumentKeys.has(key)) {
      selectedDocumentCache.current.delete(key);
    } else {
      const selectedDocumentIds = new Set(
        Array.from(selectedDocumentCache.current.values(), (selected) => selected.documentId),
      );
      if (
        !selectedDocumentIds.has(document.documentId) &&
        selectedDocumentIds.size >= MAX_BULK_DOCUMENT_SELECTION
      ) {
        showToast("Bạn chỉ có thể chọn tối đa 100 tài liệu cho một lần thao tác.", "error");
        return;
      }
      selectedDocumentCache.current.set(key, document);
    }
    setSelectedDocumentKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleVisibleSelection = () => {
    if (allVisibleSelected) {
      visibleDocuments.forEach((document) =>
        selectedDocumentCache.current.delete(`${document.documentId}:${document.folderId}`),
      );
    }
    const newlySelectedKeys: string[] = [];
    let blockedByLimit = false;
    if (!allVisibleSelected) {
      const selectedDocumentIds = new Set(
        Array.from(selectedDocumentCache.current.values(), (document) => document.documentId),
      );
      visibleDocuments.forEach((document) => {
        const key = `${document.documentId}:${document.folderId}`;
        if (selectedDocumentKeys.has(key)) return;
        if (
          !selectedDocumentIds.has(document.documentId) &&
          selectedDocumentIds.size >= MAX_BULK_DOCUMENT_SELECTION
        ) {
          blockedByLimit = true;
          return;
        }
        selectedDocumentIds.add(document.documentId);
        selectedDocumentCache.current.set(key, document);
        newlySelectedKeys.push(key);
      });
    }
    setSelectedDocumentKeys((current) => {
      const next = new Set(current);
      if (allVisibleSelected) visibleDocumentKeys.forEach((key) => next.delete(key));
      else newlySelectedKeys.forEach((key) => next.add(key));
      return next;
    });
    if (blockedByLimit) {
      showToast(
        "Chỉ có thể chọn tối đa 100 tài liệu cho một lần thao tác. Đã chọn đủ 100 tài liệu.",
        "error",
      );
    }
  };

  const renderFileActions = (document: DocumentLibraryItem) => {
    const key = `${document.documentId}:${document.folderId}`;
    const isOpen = openFileMenu?.key === key;
    const closeMenu = () => setOpenFileMenu(null);
    const toggleMenu = (event: MouseEvent<HTMLButtonElement>) => {
      if (isOpen) {
        closeMenu();
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      const menuItemCount = 4 + Number(canAssignDocuments) + (canManage ? 2 : 0);
      const menuHeight = menuItemCount * 32 + 12;
      const top =
        rect.bottom + menuHeight <= window.innerHeight - 8
          ? rect.bottom + 4
          : Math.max(8, rect.top - menuHeight - 4);
      const left = Math.max(
        8,
        Math.min(rect.right - FILE_MENU_WIDTH, window.innerWidth - FILE_MENU_WIDTH - 8),
      );
      setOpenFileMenu({ key, top, left });
    };
    return (
      <div className="relative flex justify-end" data-file-actions>
        <button
          type="button"
          aria-label={`Thao tác ${document.fileName}`}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          onClick={toggleMenu}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          <MoreVertical aria-hidden="true" className="h-4 w-4" />
        </button>
        {isOpen &&
          openFileMenu &&
          createPortal(
            <div
              role="menu"
              data-file-actions-menu
              style={{ top: openFileMenu.top, left: openFileMenu.left }}
              className="fixed z-[100] max-h-[calc(100vh-1rem)] w-44 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  closeMenu();
                  void openFile(document.documentId, document.versionId);
                }}
                className="block w-full rounded px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Xem tài liệu
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  closeMenu();
                  void openFile(document.documentId, document.versionId, true);
                }}
                className="block w-full rounded px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Tải xuống
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  closeMenu();
                  setVersionsDocument(document);
                }}
                className="block w-full rounded px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Lịch sử version
              </button>
              {canAssignDocuments && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    closeMenu();
                    openAssignmentDialog([document]);
                  }}
                  className="text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/30 flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs"
                >
                  <Link2 aria-hidden="true" className="h-3.5 w-3.5" />
                  Gán vào mẫu Fit
                </button>
              )}
              {canManage && (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      closeMenu();
                      setVersionDocument(document);
                      setTimeout(() => versionInputRef.current?.click(), 0);
                    }}
                    className="text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/30 block w-full rounded px-3 py-2 text-left text-xs"
                  >
                    Tạo version
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      closeMenu();
                      void handleArchive(document);
                    }}
                    className="text-error-600 hover:bg-error-50 dark:text-error-300 dark:hover:bg-error-950/30 block w-full rounded px-3 py-2 text-left text-xs"
                  >
                    Xóa khỏi kho
                  </button>
                </>
              )}
            </div>,
            window.document.body,
          )}
      </div>
    );
  };

  const renderAssignmentStatus = (document: DocumentLibraryItem) => (
    <span
      role="img"
      aria-label={document.isAssigned ? "Đã gán vào mẫu Fit" : "Chưa gán vào mẫu Fit"}
      title={document.isAssigned ? "Đã gán vào mẫu Fit" : "Chưa gán vào mẫu Fit"}
      className={
        document.isAssigned
          ? "text-success-600 dark:text-success-400 inline-flex shrink-0"
          : "inline-flex shrink-0 text-gray-400 dark:text-gray-500"
      }
    >
      {document.isAssigned ? (
        <BadgeCheck aria-hidden="true" className="h-4 w-4" />
      ) : (
        <CircleDashed aria-hidden="true" className="h-4 w-4" />
      )}
    </span>
  );

  const showDocumentList = Boolean(folderId);
  const uploadProgressBanner = uploading ? (
    <div
      role="status"
      aria-live="polite"
      className="border-brand-100 bg-brand-50/50 dark:border-brand-900/50 dark:bg-brand-950/10 rounded-xl border px-4 py-3"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
            <LoaderCircle
              aria-hidden="true"
              className="text-brand-600 h-4 w-4 shrink-0 animate-spin"
            />
            {uploadProgress.phase === "refreshing"
              ? "Đang cập nhật kho tài liệu"
              : `Đang tải tài liệu (${Math.min(uploadProgress.done + 1, uploadProgress.total)}/${uploadProgress.total})`}
          </div>
          {uploadProgress.currentFileName && uploadProgress.phase !== "refreshing" && (
            <p className="mt-1 truncate pl-6 text-xs text-gray-500">
              {uploadProgress.phase === "preparing"
                ? "Đang chuẩn bị: "
                : uploadProgress.phase === "confirming"
                  ? "Đang lưu vào kho: "
                  : "Đang tải lên: "}
              {uploadProgress.currentFileName}
            </p>
          )}
        </div>
        <span className="text-brand-700 dark:text-brand-300 shrink-0 text-sm font-semibold">
          {visibleUploadProgress}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Tiến trình tải tài liệu lên"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={visibleUploadProgress}
        className="bg-brand-100 mt-2 h-2 overflow-hidden rounded-full dark:bg-gray-800"
      >
        <div
          className="bg-brand-600 h-full rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${visibleUploadProgress}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between gap-3 text-[11px] text-gray-500">
        <span>
          {uploadProgress.done}/{uploadProgress.total} tệp đã xử lý
          {uploadProgress.failures > 0 && ` · ${uploadProgress.failures} lỗi`}
        </span>
        {uploadProgress.totalBytes > 0 && (
          <span>
            Đã xử lý {formatBytes(uploadProgress.processedBytes + uploadProgress.currentBytes)}
            {` / ${formatBytes(uploadProgress.totalBytes)}`}
          </span>
        )}
      </div>
    </div>
  ) : null;
  const documentListPanel = (
    folderRows: ReactNode | null = null,
    folderCards: ReactNode | null = null,
  ) =>
    showDocumentList ? (
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-t border-gray-100 dark:border-gray-800">
        {canManage && Boolean(folderId) && (
          <input
            ref={versionInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.gif"
            className="hidden"
            onChange={(event) => void handleVersionFile(event.target.files?.[0])}
          />
        )}

        {selectedDocuments.length > 0 && (
          <div
            role="toolbar"
            aria-label="Thao tác tài liệu đã chọn"
            className="border-brand-100 bg-brand-50/70 dark:border-brand-900/50 dark:bg-brand-950/20 flex flex-wrap items-center gap-3 border-b px-4 py-2.5 text-sm"
          >
            <span className="text-brand-800 dark:text-brand-200 font-medium">
              Đã chọn {selectedDocuments.length} tài liệu
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Tối đa 100 tài liệu mỗi lần
            </span>
            <div className="ml-auto flex items-center gap-2">
              <div ref={selectedActionsRef} className="relative">
                <Button
                  size="xs"
                  aria-haspopup="menu"
                  aria-expanded={selectedActionsOpen}
                  disabled={bulkActionPending}
                  onClick={() => setSelectedActionsOpen((open) => !open)}
                >
                  Thao tác chung
                  <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
                </Button>
                {selectedActionsOpen && (
                  <div
                    role="menu"
                    className="absolute top-full right-0 z-20 mt-1 w-64 rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
                  >
                    {canAssignDocuments && (
                      <button
                        type="button"
                        role="menuitem"
                        disabled={bulkActionPending}
                        onClick={() => {
                          setSelectedActionsOpen(false);
                          openAssignmentDialog(selectedDocuments, true);
                        }}
                        className="text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/30 flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs disabled:opacity-50"
                      >
                        <Link2 aria-hidden="true" className="h-3.5 w-3.5" />
                        Gán {selectedDocuments.length} tài liệu vào mẫu Fit
                      </button>
                    )}
                    {canManage && (
                      <button
                        type="button"
                        role="menuitem"
                        disabled={bulkActionPending}
                        onClick={() => void handleBulkArchive()}
                        className="text-error-600 hover:bg-error-50 dark:text-error-300 dark:hover:bg-error-950/30 flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs disabled:opacity-50"
                      >
                        <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                        Xóa {selectedDocuments.length} tài liệu khỏi kho
                      </button>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  clearDocumentSelection();
                }}
                className="text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Bỏ chọn
              </button>
            </div>
          </div>
        )}

        {documentsQuery.isLoading ? (
          <div className="p-12 text-center text-sm text-gray-500">Đang tải tài liệu...</div>
        ) : documentsQuery.isError ? (
          <div className="text-error-600 p-12 text-center text-sm">Không tải được tài liệu.</div>
        ) : totalDocumentCount === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            Không có tài liệu phù hợp với bộ lọc.
          </div>
        ) : activeDisplayMode === "list" ? (
          <div className="min-w-0 flex-1 overflow-x-auto">
            <table
              aria-label="Tài liệu trong kho"
              className="w-full min-w-[720px] table-fixed border-collapse text-left text-xs"
            >
              <colgroup>
                <col className="w-10" />
                <col />
                <col className="w-24" />
                <col className="w-24" />
                <col className="w-40" />
                <col className="w-24" />
                <col className="w-20" />
              </colgroup>
              <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800/70 dark:text-gray-300">
                <tr>
                  <th className="w-10 px-4 py-3 font-medium">
                    <input
                      type="checkbox"
                      aria-label="Chọn tất cả tài liệu trên trang"
                      checked={allVisibleSelected}
                      onChange={toggleVisibleSelection}
                      className="text-brand-600 focus:ring-brand-500 rounded border-gray-300"
                    />
                  </th>
                  <th className="min-w-48 px-3 py-3 font-medium">Tên</th>
                  <th className="w-24 px-3 py-3 font-medium">Loại</th>
                  <th className="w-24 px-3 py-3 font-medium">Dung lượng</th>
                  <th className="w-40 px-3 py-3 font-medium">Ngày cập nhật</th>
                  <th className="w-24 px-3 py-3 font-medium">Version</th>
                  <th className="w-20 px-3 py-3 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {folderRows}
                {visibleDocuments.map((document) => {
                  const key = `${document.documentId}:${document.folderId}`;
                  const meta = getFileMeta(document.fileName);
                  const menuIsOpen = openFileMenu?.key === key;
                  return (
                    <tr
                      key={key}
                      data-file-menu-open={menuIsOpen ? "true" : undefined}
                      className={`group transition-colors ${
                        menuIsOpen
                          ? "bg-brand-50/70 ring-brand-400 dark:bg-brand-950/30 ring-2 ring-inset"
                          : "hover:bg-gray-50/80 dark:hover:bg-gray-800/40"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Chọn ${document.fileName}`}
                          checked={selectedDocumentKeys.has(key)}
                          onChange={() => toggleDocumentSelection(document)}
                          className="text-brand-600 focus:ring-brand-500 rounded border-gray-300"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <FileTypeIcon fileName={document.fileName} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  void openFile(document.documentId, document.versionId)
                                }
                                title={document.fileName}
                                aria-label={document.fileName}
                                className="hover:text-brand-600 dark:hover:text-brand-300 block min-w-0 flex-1 truncate text-left font-semibold text-gray-800 dark:text-gray-100"
                              >
                                {document.fileName}
                              </button>
                              {renderAssignmentStatus(document)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-md px-2 py-1 text-[10px] font-medium ${meta.chipClass}`}
                        >
                          {meta.extension ? meta.extension.toUpperCase() : meta.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
                        {formatBytes(document.byteSize)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
                        {formatDateOnly(document.uploadedAt)}
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">
                        v{document.versionNo}
                      </td>
                      <td className="px-3 py-2">{renderFileActions(document)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid flex-1 content-start gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {folderCards}
            {visibleDocuments.map((document) => {
              const key = `${document.documentId}:${document.folderId}`;
              return (
                <article
                  key={key}
                  className={`rounded-xl border p-3 transition-colors ${
                    selectedDocumentKeys.has(key)
                      ? "border-brand-300 bg-brand-50/40 dark:border-brand-800 dark:bg-brand-950/20"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
                  } ${openFileMenu?.key === key ? "ring-brand-400 ring-2 ring-inset" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <input
                      type="checkbox"
                      aria-label={`Chọn ${document.fileName}`}
                      checked={selectedDocumentKeys.has(key)}
                      onChange={() => toggleDocumentSelection(document)}
                      className="text-brand-600 focus:ring-brand-500 mt-1 rounded border-gray-300"
                    />
                    {renderFileActions(document)}
                  </div>
                  <button
                    type="button"
                    onClick={() => void openFile(document.documentId, document.versionId)}
                    className="mt-2 flex w-full items-center gap-3 text-left"
                  >
                    <FileTypeIcon fileName={document.fileName} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-1">
                        <span
                          title={document.fileName}
                          className="block min-w-0 truncate text-sm font-semibold text-gray-800 dark:text-gray-100"
                        >
                          {document.fileName}
                        </span>
                        {renderAssignmentStatus(document)}
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        v{document.versionNo} · {formatBytes(document.byteSize)}
                      </span>
                    </span>
                  </button>
                  <div className="mt-3 flex min-w-0 items-center justify-between gap-3 border-t border-gray-100 pt-2 text-xs text-gray-500 dark:border-gray-800">
                    <span className="min-w-0 truncate">{document.folderName}</span>
                    <time className="shrink-0 text-right whitespace-nowrap">
                      {formatDate(document.uploadedAt)}
                    </time>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 text-xs text-gray-500 dark:border-gray-800">
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              aria-label="Trang trước"
              disabled={visiblePage <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            </button>
            <span className="bg-brand-600 min-w-8 rounded-lg px-2.5 py-2 text-center font-semibold text-white">
              {visiblePage}
            </span>
            <span className="text-gray-400">/ {pageCount}</span>
            <button
              type="button"
              aria-label="Trang sau"
              disabled={visiblePage >= pageCount}
              onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
              className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </button>
            <select
              aria-label="Số tài liệu mỗi trang"
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="ml-2 h-9 rounded-lg border border-gray-200 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
              <option value={100}>100 / trang</option>
            </select>
          </div>
        </footer>
      </section>
    ) : null;

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Quản lý Mẫu Fit" },
          { label: "Kho tài liệu" },
        ]}
        title="Kho tài liệu"
      />

      <div className="space-y-4">
        <main className="min-w-0 space-y-4">
          {uploadProgressBanner}

          {canManage && Boolean(folderId) && (
            <input
              ref={uploadInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.gif"
              className="hidden"
              onChange={(event) => void handleUploadFiles(event.target.files)}
            />
          )}
          <DocumentFoldersView
            path={folderPath}
            search={search}
            onSearchChange={setSearch}
            showAssignmentFilter={Boolean(folderId)}
            assignmentFilter={activeFilter}
            onAssignmentFilterChange={toggleFilter}
            displayMode={folderDisplayMode}
            onDisplayModeChange={setFolderDisplayMode}
            canManage={canManage}
            canUpload={canManage && Boolean(folderId)}
            uploading={uploading}
            uploadButtonLabel={
              uploading ? `Đang tải ${uploadProgress.done}/${uploadProgress.total}` : "Tải tài liệu"
            }
            onUploadClick={() => uploadInputRef.current?.click()}
            onOpenFolder={openFolder}
            onSelectPath={(path) => {
              setFolderPath(path);
              setSelectedFolder(path.at(-1) ?? null);
            }}
            onOpenRoot={() => {
              setFolderPath([]);
              setSelectedFolder(null);
            }}
            onBack={goToParentFolder}
            onCreate={handleCreateFolder}
            onRename={(folder) =>
              setFolderDialog({ mode: "rename", folder, name: folder.folderName })
            }
            onDelete={setDeletingFolder}
            mergeContents={
              !documentsQuery.isLoading && !documentsQuery.isError && visibleDocuments.length > 0
            }
            renderDocumentPanel={
              folderId
                ? (folderRows, folderCards) => documentListPanel(folderRows, folderCards)
                : undefined
            }
          />
        </main>
      </div>

      <Modal
        open={Boolean(assignmentDocuments)}
        title="Gán tài liệu vào mẫu Fit"
        subtitle={
          assignmentDocuments?.length === 1
            ? assignmentDocuments[0].fileName
            : `${assignmentDocuments?.length ?? 0} tài liệu được chọn`
        }
        size="lg"
        closeDisabled={isAssigningDocument}
        onClose={closeAssignmentDialog}
        footer={
          <>
            <Button
              variant="outline"
              disabled={isAssigningDocument}
              onClick={closeAssignmentDialog}
            >
              Hủy
            </Button>
            <Button
              loading={isAssigningDocument}
              disabled={!selectedStyleId}
              onClick={() => void handleAssignDocument()}
            >
              {assignmentDocuments?.length && assignmentDocuments.length > 1
                ? `Gán ${assignmentDocuments.length} tài liệu`
                : "Gán tài liệu"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {assignmentDocuments && assignmentDocuments.length > 1 && (
            <div
              aria-label="Tài liệu được chọn để gán"
              className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300"
            >
              {assignmentDocuments.slice(0, 3).map((document) => (
                <p key={document.documentId} className="truncate">
                  {document.fileName}
                </p>
              ))}
              {assignmentDocuments.length > 3 && (
                <p className="mt-1 text-gray-500">
                  Và {assignmentDocuments.length - 3} tài liệu khác
                </p>
              )}
            </div>
          )}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Tìm mẫu Fit
            </span>
            <input
              aria-label="Tìm mẫu Fit"
              value={assignmentSearch}
              onChange={(event) => {
                setAssignmentSearch(event.target.value);
                setAssignmentPage(1);
                setSelectedStyleId(null);
              }}
              placeholder="Nhập mã hoặc tên mẫu Fit..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </label>

          <div className="max-h-[45vh] divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-700">
            {stylePickerQuery.isLoading ? (
              <p className="p-8 text-center text-sm text-gray-500">Đang tải danh sách mẫu Fit...</p>
            ) : stylePickerQuery.isError ? (
              <div className="p-8 text-center text-sm text-gray-500">
                <p>Không tải được danh sách mẫu Fit.</p>
                <button
                  type="button"
                  onClick={() => void stylePickerQuery.refetch()}
                  className="text-brand-600 dark:text-brand-300 mt-2 font-medium hover:underline"
                >
                  Thử lại
                </button>
              </div>
            ) : (stylePickerQuery.data?.data.length ?? 0) === 0 ? (
              <p className="p-8 text-center text-sm text-gray-500">Không tìm thấy mẫu Fit.</p>
            ) : (
              stylePickerQuery.data?.data.map((style: Style) => (
                <label
                  key={style.id}
                  className={`flex cursor-pointer items-center gap-3 p-4 ${
                    selectedStyleId === style.id
                      ? "bg-brand-50 dark:bg-brand-950/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="document-assignment-style"
                    value={style.id}
                    checked={selectedStyleId === style.id}
                    onChange={() => setSelectedStyleId(style.id)}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {style.styleCode}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-gray-500">
                      {style.styleName}
                    </span>
                  </span>
                </label>
              ))
            )}
          </div>

          {(stylePickerQuery.data?.meta.totalPages ?? 1) > 1 && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Trang {stylePickerQuery.data?.meta.page} / {stylePickerQuery.data?.meta.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={assignmentPage <= 1 || stylePickerQuery.isFetching}
                  onClick={() => setAssignmentPage((page) => Math.max(1, page - 1))}
                  className="rounded-md border border-gray-200 px-3 py-1.5 disabled:opacity-40 dark:border-gray-700"
                >
                  Trước
                </button>
                <button
                  type="button"
                  disabled={
                    assignmentPage >= (stylePickerQuery.data?.meta.totalPages ?? 1) ||
                    stylePickerQuery.isFetching
                  }
                  onClick={() => setAssignmentPage((page) => page + 1)}
                  className="rounded-md border border-gray-200 px-3 py-1.5 disabled:opacity-40 dark:border-gray-700"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={Boolean(folderDialog)}
        title="Đổi tên thư mục"
        subtitle="Tên thư mục được hiển thị trong kho tài liệu"
        closeDisabled={savingFolder}
        onClose={() => setFolderDialog(null)}
        footer={
          <>
            <Button variant="outline" disabled={savingFolder} onClick={() => setFolderDialog(null)}>
              Hủy
            </Button>
            <Button
              loading={savingFolder}
              type="submit"
              form="document-folder-form"
              disabled={!folderDialog?.name.trim()}
            >
              Lưu thay đổi
            </Button>
          </>
        }
      >
        <form
          id="document-folder-form"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSaveFolder();
          }}
        >
          <label
            htmlFor="document-folder-name"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Tên thư mục
          </label>
          <input
            id="document-folder-name"
            autoFocus
            value={folderDialog?.name ?? ""}
            onChange={(event) =>
              setFolderDialog((current) =>
                current ? { ...current, name: event.target.value } : current,
              )
            }
            maxLength={255}
            placeholder="Nhập tên thư mục"
            className="focus:border-brand-400 focus:ring-brand-500/15 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(archiveConfirmation)}
        title="Xóa tài liệu khỏi kho?"
        description={
          archiveConfirmation?.documents.length === 1 ? (
            <>
              Bạn có chắc muốn xóa tài liệu{" "}
              <strong className="break-all text-gray-900 dark:text-white">
                {archiveConfirmation.documents[0].fileName}
              </strong>{" "}
              khỏi kho? Tài liệu sẽ được lưu trữ.
            </>
          ) : (
            <>
              Bạn có chắc muốn xóa <strong>{archiveConfirmation?.documents.length ?? 0}</strong> tài
              liệu đã chọn khỏi kho? Các tài liệu sẽ được lưu trữ.
            </>
          )
        }
        confirmLabel={`Xóa ${archiveConfirmation?.documents.length ?? 0} tài liệu`}
        variant="danger"
        isSubmitting={bulkActionPending}
        onConfirm={() => void confirmArchiveDocuments()}
        onClose={() => {
          if (!bulkActionPending) setArchiveConfirmation(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingFolder)}
        title={
          deletingFolder?.hasChildren
            ? "Không thể xóa thư mục"
            : deletingFolder?.documentCount
              ? "Xóa thư mục và tài liệu?"
              : "Xóa thư mục?"
        }
        description={
          deletingFolder?.hasChildren ? (
            <>
              Thư mục <strong>{deletingFolder.folderName}</strong>
              {deletingFolder.documentCount > 0 && (
                <>
                  {" "}
                  đang chứa <strong>{deletingFolder.documentCount} tài liệu</strong> và có thư mục
                  con. Hãy xóa hoặc di chuyển thư mục con trước khi xóa thư mục này.
                </>
              )}
              {deletingFolder.documentCount === 0 && (
                <> đang có thư mục con. Hãy xóa hoặc di chuyển thư mục con trước khi xóa.</>
              )}
            </>
          ) : deletingFolder && deletingFolder.documentCount > 0 ? (
            <>
              Thư mục <strong>{deletingFolder.folderName}</strong> đang chứa{" "}
              <strong>{deletingFolder.documentCount} tài liệu</strong>. Nếu tiếp tục, thư mục sẽ bị
              xóa; tài liệu chỉ nằm trong thư mục này sẽ được lưu trữ khỏi kho, còn file gốc vẫn
              được giữ. Tài liệu còn nằm trong thư mục khác sẽ tiếp tục ở đó.
            </>
          ) : (
            <>
              Bạn có chắc muốn xóa thư mục <strong>{deletingFolder?.folderName}</strong>? Thư mục
              này không chứa tài liệu hoặc thư mục con.
            </>
          )
        }
        confirmLabel={
          deletingFolder?.hasChildren
            ? "Xóa thư mục"
            : deletingFolder?.documentCount
              ? `Xóa thư mục và ${deletingFolder.documentCount} tài liệu`
              : "Xóa thư mục"
        }
        variant="danger"
        isSubmitting={deleteFolderPending}
        confirmDisabled={Boolean(deletingFolder?.hasChildren)}
        onConfirm={() => void handleDeleteFolder()}
        onClose={() => setDeletingFolder(null)}
      />

      {versionsDocument && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onMouseDown={(event) => event.target === event.currentTarget && setVersionsDocument(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="document-version-title"
            className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900"
          >
            <header className="flex items-start justify-between border-b border-gray-100 p-5 dark:border-gray-800">
              <div className="min-w-0">
                <h2
                  id="document-version-title"
                  className="font-semibold text-gray-900 dark:text-white"
                >
                  Lịch sử phiên bản
                </h2>
                <p className="mt-1 truncate text-sm text-gray-500">{versionsDocument.fileName}</p>
              </div>
              <button
                type="button"
                onClick={() => setVersionsDocument(null)}
                className="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Đóng
              </button>
            </header>
            <div className="max-h-[60vh] divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
              {versionsQuery.isLoading ? (
                <p className="p-6 text-center text-sm text-gray-500">Đang tải lịch sử...</p>
              ) : (
                versions.map((version: DocumentVersionItem) => (
                  <div key={version.versionId} className="flex flex-wrap items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        v{version.versionNo} · {version.fileName}
                        {version.isCurrent ? " · Hiện tại" : ""}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatBytes(version.byteSize)} · {formatDate(version.uploadedAt)}
                        {version.changeReason ? ` · ${version.changeReason}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void openFile(versionsDocument.documentId, version.versionId)}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      Mở version
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      <Toast
        open={Boolean(toast)}
        message={toast?.message ?? ""}
        variant={toast?.variant}
        closeLabel="Đóng thông báo"
        onClose={hideToast}
      />
    </div>
  );
}
