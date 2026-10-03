import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, ChevronRight, Folder } from "lucide-react";
import { documentsLibraryApi } from "@/api/documents-library.api";
import { Button, Modal } from "@/components/shared";
import type { DocumentFolderItem } from "@/types/document-library";

type MoveDocumentsDialogProps = {
  open: boolean;
  documentCount: number;
  moving: boolean;
  onClose: () => void;
  onMove: (targetFolderId: string) => void;
};

export function MoveDocumentsDialog({
  open,
  documentCount,
  moving,
  onClose,
  onMove,
}: MoveDocumentsDialogProps) {
  const [path, setPath] = useState<DocumentFolderItem[]>([]);
  const [selectedPath, setSelectedPath] = useState<DocumentFolderItem[]>([]);
  const currentFolder = path.at(-1) ?? null;
  const foldersQuery = useQuery({
    queryKey: ["document-library", "move-destinations", currentFolder?.id ?? "root"],
    queryFn: () => documentsLibraryApi.listFolders({ parentId: currentFolder?.id }),
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setPath([]);
      setSelectedPath([]);
    }
  }, [open]);

  const close = () => {
    if (!moving) onClose();
  };

  return (
    <Modal
      open={open}
      title={`Di chuyển ${documentCount === 1 ? "tài liệu" : `${documentCount} tài liệu`}`}
      subtitle="Chọn thư mục đích"
      size="md"
      closeDisabled={moving}
      onClose={close}
      footer={
        <>
          <Button variant="outline" disabled={moving} onClick={close}>Hủy</Button>
          <Button
            loading={moving}
            disabled={!selectedPath.length}
            onClick={() => onMove(selectedPath.at(-1)!.id)}
          >
            <Folder aria-hidden="true" className="mr-2 h-4 w-4" />
            Di chuyển vào đây
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <nav aria-label="Đường dẫn thư mục đích" className="flex min-w-0 items-center gap-1 overflow-x-auto text-sm">
          <button type="button" onClick={() => setPath([])} className="shrink-0 rounded px-2 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">Kho tài liệu</button>
          {path.map((folder, index) => <span key={folder.id} className="flex shrink-0 items-center gap-1">
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 text-gray-400" />
            <button type="button" onClick={() => setPath(path.slice(0, index + 1))} className={`max-w-32 truncate rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 ${index === path.length - 1 ? "font-semibold text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300"}`}>{folder.folderName}</button>
          </span>)}
        </nav>

        {path.length > 0 && <button type="button" onClick={() => setPath(path.slice(0, -1))} className="flex items-center gap-2 rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Thư mục cha</button>}

        <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
          {foldersQuery.isLoading ? <p className="p-8 text-center text-sm text-gray-500">Đang tải thư mục...</p> : foldersQuery.isError ? (
            <div className="p-8 text-center text-sm text-gray-500">Không tải được thư mục. <button type="button" onClick={() => void foldersQuery.refetch()} className="text-brand-600 hover:underline">Thử lại</button></div>
          ) : (foldersQuery.data ?? []).length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">Không có thư mục con ở đây.</p>
          ) : (foldersQuery.data ?? []).map((folder) => {
            const selected = selectedPath.at(-1)?.id === folder.id;
            return <div key={folder.id} className={`flex items-center border-b border-gray-100 last:border-b-0 dark:border-gray-800 ${selected ? "bg-brand-50/70 dark:bg-brand-950/20" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"}`}>
              <button type="button" onClick={() => setSelectedPath([...path, folder])} aria-pressed={selected} className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left">
                <Folder aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-500" />
                <span className="min-w-0 flex-1 truncate text-sm text-gray-800 dark:text-gray-100">{folder.folderName}</span>
                {selected && <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-600" />}
              </button>
              {folder.hasChildren && <button type="button" aria-label={`Mở thư mục ${folder.folderName}`} onClick={() => setPath([...path, folder])} className="mr-2 rounded p-2 text-gray-400 hover:bg-white hover:text-gray-700 dark:hover:bg-gray-700"><ChevronRight aria-hidden="true" className="h-4 w-4" /></button>}
            </div>;
          })}
        </div>

        <p className="min-h-5 text-xs text-gray-500">
          {selectedPath.length ? `Đích đến: ${selectedPath.map((folder) => folder.folderName).join(" / ")}` : "Chọn một folder trong danh sách. Mũi tên sẽ mở folder để chọn tầng sâu hơn."}
        </p>
      </div>
    </Modal>
  );
}
