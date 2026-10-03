import { useRef, useState, type FormEvent } from "react";
import { FileText, ImagePlus, Upload, X } from "lucide-react";
import { Button, Modal } from "@/components/shared";
import { useDiscardChangesGuard } from "@/hooks/useDiscardChangesGuard";

interface Props {
  title: string;
  currentVersionNo: number;
  isPending: boolean;
  sharedWithPo?: boolean;
  onClose: () => void;
  onSave: (file: File, changeReason: string, evidence?: File) => Promise<void>;
}

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const MAX_EVIDENCE_SIZE = 5 * 1024 * 1024;

export function DocumentVersionUploadModal({ title, currentVersionNo, isPending, sharedWithPo, onClose, onSave }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [changeReason, setChangeReason] = useState("");
  const [evidence, setEvidence] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const evidenceInputRef = useRef<HTMLInputElement>(null);
  const guard = useDiscardChangesGuard(Boolean(file || changeReason.trim() || evidence), onClose);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file || !changeReason.trim() || isPending) return;
    setError(null);
    try {
      await onSave(file, changeReason.trim(), evidence || undefined);
    } catch {
      // The parent shows the API error. Keep the form open for correction or retry.
    }
  };

  return (
    <>
      <Modal
        open
        onClose={guard.requestClose}
        closeDisabled={isPending}
        closeOnClickOutside
        title={`Cập nhật phiên bản mới: v${currentVersionNo + 1}`}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex min-w-0 items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-xs dark:bg-gray-800/70">
            <FileText size={16} className="shrink-0 text-blue-600 dark:text-blue-400" />
            <span className="min-w-0 flex-1 truncate font-medium text-gray-700 dark:text-gray-200">{title}</span>
            <span className="shrink-0 text-gray-500 dark:text-gray-400">v{currentVersionNo} <span className="text-gray-400">→</span> v{currentVersionNo + 1}</span>
          </div>
          {sharedWithPo && (
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              Tài liệu dùng chung · phiên bản mới áp dụng cho PO và sản phẩm liên quan
            </p>
          )}

          <div>
            <label htmlFor="version-file" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Tệp phiên bản mới <span className="text-rose-500">*</span>
            </label>
            <input
              id="version-file"
              ref={fileInputRef}
              type="file"
              required
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="sr-only"
            />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex w-full items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left transition hover:border-blue-300 hover:bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-700 dark:hover:bg-blue-950/20">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"><Upload size={16} /></span>
              <span className="min-w-0 flex-1 truncate text-xs text-gray-600 dark:text-gray-300">{file?.name || "Chọn tệp để tải lên"}</span>
              <span className="shrink-0 text-xs font-semibold text-blue-600 dark:text-blue-400">{file ? "Đổi tệp" : "Chọn tệp"}</span>
            </button>
          </div>

          <div>
            <label htmlFor="version-reason" className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Lý do thay đổi <span className="font-bold text-rose-500">*</span>
            </label>
            <textarea
              id="version-reason"
              rows={3}
              required
              maxLength={5000}
              value={changeReason}
              onChange={(event) => setChangeReason(event.target.value)}
              placeholder="Nhập yêu cầu thay đổi..."
              className="w-full rounded-xl border border-gray-300 bg-white p-3 text-xs text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="version-evidence" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Ảnh bằng chứng <span className="font-normal text-gray-400">(tùy chọn)</span>
            </label>
            <input
              id="version-evidence"
              ref={evidenceInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) => {
                const selected = event.target.files?.[0] || null;
                if (selected && (!IMAGE_TYPES.has(selected.type) || selected.size > MAX_EVIDENCE_SIZE)) {
                  setError("Chọn ảnh PNG, JPG, WebP hoặc GIF tối đa 5 MB.");
                  setEvidence(null);
                  event.target.value = "";
                  return;
                }
                setError(null);
                setEvidence(selected);
              }}
              className="sr-only"
            />
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => evidenceInputRef.current?.click()} className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:border-blue-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
                <ImagePlus size={15} className="text-blue-600 dark:text-blue-400" />{evidence ? "Đổi ảnh" : "Tải ảnh lên"}
              </button>
              <span className="min-w-0 flex-1 truncate text-[11px] text-gray-500 dark:text-gray-400">{evidence?.name || "PNG, JPG, WebP hoặc GIF · tối đa 5 MB"}</span>
              {evidence && <button type="button" aria-label="Xóa ảnh bằng chứng" onClick={() => { setEvidence(null); if (evidenceInputRef.current) evidenceInputRef.current.value = ""; }} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-rose-600 dark:hover:bg-gray-800"><X size={15} /></button>}
            </div>
            {error && <p role="alert" className="mt-1 text-xs text-rose-600">{error}</p>}
          </div>

          <div className="flex justify-end gap-2.5 border-t border-gray-100 pt-3 dark:border-gray-800">
            <Button variant="outline" size="sm" type="button" onClick={guard.requestClose} disabled={isPending}>Hủy bỏ</Button>
            <Button size="sm" type="submit" disabled={!file || !changeReason.trim() || isPending}>
              {isPending ? "Đang lưu..." : `Xác nhận tải lên v${currentVersionNo + 1}`}
            </Button>
          </div>
        </form>
      </Modal>
      {guard.discardDialog}
    </>
  );
}
