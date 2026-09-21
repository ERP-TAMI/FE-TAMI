import { useState, useEffect } from "react";
import { X, Copy, AlertCircle } from "lucide-react";
import { bomsApi } from "@/api/boms.api";
import type { BomDetail } from "@/types/bom";

interface BomCopyFitModalProps {
  isOpen: boolean;
  styleId?: string;
  styleCode?: string;
  onClose: () => void;
  onSubmit: (sourceRevisionId: string) => Promise<void>;
}

export function BomCopyFitModal({
  isOpen,
  styleId,
  styleCode,
  onClose,
  onSubmit,
}: BomCopyFitModalProps) {
  const [fitBom, setFitBom] = useState<BomDetail | null>(null);
  const [selectedRevId, setSelectedRevId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && (styleId || styleCode)) {
      setIsLoading(true);
      setError(null);
      bomsApi
        .getBoms({
          type: "fit",
          style: styleCode,
          limit: 10,
        })
        .then(async (res) => {
          const match = res.data.find(
            (b) => b.type === "fit" && (b.style?.id === styleId || b.style?.styleCode === styleCode)
          );
          if (match) {
            const detail = await bomsApi.getBomById(match.id);
            setFitBom(detail);
            if (detail.currentRevision) {
              setSelectedRevId(detail.currentRevision.id);
            }
          } else {
            setError("Không tìm thấy Fit BOM nào tương ứng với Style này");
          }
        })
        .catch((err) => {
          setError(err?.response?.data?.message || err?.message || "Lỗi khi tìm Fit BOM");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, styleId, styleCode]);

  if (!isOpen) return null;

  const handleCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRevId) {
      setError("Vui lòng chọn phiên bản Fit BOM nguồn");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(selectedRevId);
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosErr?.response?.data?.message || axiosErr?.message || "Lỗi khi sao chép từ Fit BOM");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-gray-200/80 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
              <Copy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Sao chép từ Fit BOM
              </h3>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                Kế thừa cấu trúc danh mục và định mức từ mẫu Fit
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleCopy} className="flex flex-1 flex-col overflow-y-auto p-5">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-theme-xs text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/30 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="p-8 text-center text-theme-sm text-gray-500">
              Đang tìm kiếm Fit BOM của Style {styleCode}...
            </div>
          ) : fitBom ? (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 dark:border-brand-900/30 dark:bg-brand-950/20">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Fit BOM: {fitBom.bomCode}
                  </span>
                  <span className="rounded-md bg-white px-2 py-0.5 text-theme-xs font-bold text-brand-600 shadow-xs dark:bg-gray-800">
                    {fitBom.lines?.length || 0} vật tư
                  </span>
                </div>
                <div className="mt-1 text-theme-xs text-gray-500">
                  Style: {fitBom.style?.styleCode} - {fitBom.style?.styleName}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-theme-xs font-semibold text-gray-700 dark:text-gray-300">
                  Phiên bản Fit BOM nguồn <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedRevId}
                  onChange={(e) => setSelectedRevId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white p-3 text-theme-sm font-medium text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
                >
                  {fitBom.currentRevision && (
                    <option value={fitBom.currentRevision.id}>
                      Rev {fitBom.currentRevision.revisionNo} (Trạng thái: {fitBom.currentRevision.status})
                    </option>
                  )}
                </select>
              </div>

              <div className="text-theme-xs text-gray-500 dark:text-gray-400">
                Toàn bộ định mức tiêu hao và danh mục nguyên phụ liệu sẽ được sao chép sang PO BOM. Đơn giá sẽ được reset về 0 để bộ phận Kế toán nhập giá mới cho PO.
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-theme-xs text-gray-500">
              Không có dữ liệu Fit BOM để sao chép.
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="cursor-pointer rounded-xl border border-gray-200 px-4 py-2 text-theme-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !fitBom}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2 text-theme-sm font-semibold text-white shadow-xs hover:bg-brand-600 disabled:opacity-50"
            >
              {isSubmitting ? "Đang sao chép..." : "Xác nhận sao chép"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
