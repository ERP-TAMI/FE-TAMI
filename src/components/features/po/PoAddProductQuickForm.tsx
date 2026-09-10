import { useState, useMemo } from "react";
import { Button } from "@/components/shared";
import { useStyles } from "@/hooks/useStyles";
import { useImportFitPreview } from "@/hooks/usePurchaseOrders";
import { CheckLineIcon } from "@/icons";
import type {
  CreatePoProductInput,
  ImportFitOptions,
  PurchaseOrderDocumentItem,
  ProductColorItem,
} from "@/types/po";
import { ProductColorSizeEditor } from "@/components/features/po/ProductColorSizeEditor";

interface Props {
  isPending: boolean;
  poDocuments?: PurchaseOrderDocumentItem[];
  onClose: () => void;
  onSubmit: (input: CreatePoProductInput) => Promise<void>;
  onAttachedDocsChange?: (docIds: string[]) => void;
}

/**
 * PoAddProductQuickForm — Form thêm sản phẩm nhanh dành riêng cho split-screen.
 * Cho phép kéo thả tài liệu từ cột trái trực tiếp vào khu vực thả trong Form này.
 * Thiết kế 1 màn hình, gọn gàng, phù hợp với cột 50%.
 */
export function PoAddProductQuickForm({
  isPending,
  poDocuments = [],
  onClose,
  onSubmit,
  onAttachedDocsChange,
}: Props) {
  const [mode, setMode] = useState<"select" | "manual">("select");
  const [sourceStyleId, setSourceStyleId] = useState("");
  const [productCode, setProductCode] = useState("");
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [materialNote, setMaterialNote] = useState("");
  const [attachedDocIds, setAttachedDocIds] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [colors, setColors] = useState<ProductColorItem[]>([
    {
      id: "color-default",
      colorName: "",
      sizes: [
        { sizeLabel: "S", quantity: 0 },
        { sizeLabel: "M", quantity: 0 },
        { sizeLabel: "L", quantity: 0 },
      ],
    },
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Import options
  const [copySteps, setCopySteps] = useState(true);
  const [copySamples, setCopySamples] = useState(false);
  const [copyProductionDoc, setCopyProductionDoc] = useState(true);
  const [copyDocuments, setCopyDocuments] = useState(false);

  const { data: stylesData } = useStyles({ limit: 100 });
  const styleList = stylesData?.data || [];

  const { data: fitPreview, isLoading: isPreviewLoading } = useImportFitPreview(
    mode === "select" && sourceStyleId ? sourceStyleId : undefined,
  );

  const selectedSourceStyle = useMemo(
    () => styleList.find((s) => s.id === sourceStyleId),
    [styleList, sourceStyleId],
  );

  const handleSelectStyle = (id: string) => {
    setSourceStyleId(id);
    const found = styleList.find((s) => s.id === id);
    if (found) {
      setProductCode(found.styleCode);
      setProductName(found.styleName);
      setCategory(found.category || "");
    }
  };

  const handleReset = () => {
    setSourceStyleId("");
    setProductCode("");
    setProductName("");
    setCategory("");
    setMaterialNote("");
    setDeadline("");
    setColors([
      {
        id: "color-default",
        colorName: "",
        sizes: [
          { sizeLabel: "S", quantity: 0 },
          { sizeLabel: "M", quantity: 0 },
          { sizeLabel: "L", quantity: 0 },
        ],
      },
    ]);
    setErrorMsg(null);
    setCopySteps(true);
    setCopySamples(false);
    setCopyProductionDoc(true);
    setCopyDocuments(false);
    setAttachedDocIds([]);
    setIsDragOver(false);
    onAttachedDocsChange?.([]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const { clientX, clientY } = e;
    if (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    ) {
      return;
    }
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const docId = e.dataTransfer.getData("text/plain");
    if (!docId) return;
    if (!attachedDocIds.includes(docId)) {
      const next = [...attachedDocIds, docId];
      setAttachedDocIds(next);
      onAttachedDocsChange?.(next);
    }
  };

  const handleRemoveDoc = (docId: string) => {
    const next = attachedDocIds.filter((id) => id !== docId);
    setAttachedDocIds(next);
    onAttachedDocsChange?.(next);
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (!productCode.trim()) {
      setErrorMsg("Mã sản phẩm không được để trống.");
      return;
    }
    if (!productName.trim()) {
      setErrorMsg("Tên sản phẩm không được để trống.");
      return;
    }

    const importOptions: ImportFitOptions | undefined =
      mode === "select" && sourceStyleId
        ? { copySteps, copySamples, copyProductionDoc, copyDocuments }
        : undefined;

    const cleanColors = colors
      .filter((c) => c.colorName.trim().length > 0)
      .map((c) => ({
        id: c.id,
        colorName: c.colorName.trim(),
        colorCode: c.colorCode?.trim() || undefined,
        sizes: (c.sizes || [])
          .filter((s) => s.sizeLabel.trim().length > 0)
          .map((s) => ({
            sizeLabel: s.sizeLabel.trim().toUpperCase(),
            quantity: Number(s.quantity) || 0,
          })),
      }));

    try {
      await onSubmit({
        productCode: productCode.trim(),
        productName: productName.trim(),
        sourceStyleId: mode === "select" && sourceStyleId ? sourceStyleId : undefined,
        category: category.trim() || undefined,
        materialNote: materialNote.trim() || undefined,
        deadline: deadline || undefined,
        colors: cleanColors.length > 0 ? cleanColors : undefined,
        importOptions,
        poDocumentIds: attachedDocIds.length > 0 ? attachedDocIds : undefined,
      });
      handleClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Có lỗi xảy ra khi thêm sản phẩm.");
    }
  };

  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800/80 dark:text-white placeholder-gray-400";

  return (
    <div className="flex flex-col gap-4">
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">Thêm sản phẩm mới</h4>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            Kéo thả tài liệu từ cột trái trực tiếp vào ô thả bên dưới để gán.
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer transition-colors"
        >
          Hủy
        </button>
      </div>

      {/* ── ERROR ──────────────────────────────────────────────────────────── */}
      {errorMsg && (
        <div className="rounded-xl border border-error-200 bg-error-50 px-3 py-2 text-xs font-medium text-error-700 dark:border-error-900/40 dark:bg-error-950/40 dark:text-error-300">
          {errorMsg}
        </div>
      )}

      {/* ── MODE SWITCH ────────────────────────────────────────────────────── */}
      <div className="flex rounded-xl border border-gray-200 bg-gray-50/80 p-0.5 dark:border-gray-700 dark:bg-gray-900">
        <button
          type="button"
          onClick={() => setMode("select")}
          className={`flex-1 rounded-lg py-1.5 px-3 text-xs font-semibold transition-all cursor-pointer ${
            mode === "select"
              ? "bg-white text-brand-600 shadow-sm dark:bg-gray-800 dark:text-brand-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          Từ Style / Fit có sẵn
        </button>
        <button
          type="button"
          onClick={() => { setMode("manual"); setSourceStyleId(""); setProductCode(""); setProductName(""); setCategory(""); }}
          className={`flex-1 rounded-lg py-1.5 px-3 text-xs font-semibold transition-all cursor-pointer ${
            mode === "manual"
              ? "bg-white text-brand-600 shadow-sm dark:bg-gray-800 dark:text-brand-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          Nhập thủ công
        </button>
      </div>

      {/* ── CHỌN STYLE (nếu mode = select) ─────────────────────────────────── */}
      {mode === "select" && (
        <div className="rounded-xl border border-brand-200/70 bg-brand-50/40 p-3 space-y-3 dark:border-brand-900/40 dark:bg-brand-950/20">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Chọn Style Mẫu Fit gốc <span className="text-error-500">*</span>
            </label>
            <select
              value={sourceStyleId}
              onChange={(e) => handleSelectStyle(e.target.value)}
              className={inputCls}
            >
              <option value="">-- Chọn một Style có sẵn --</option>
              {styleList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.styleCode} — {s.styleName}
                </option>
              ))}
            </select>
          </div>

          {/* Preview + Copy options khi đã chọn style */}
          {sourceStyleId && (
            <div className="space-y-2.5">
              {isPreviewLoading && (
                <p className="text-xs text-brand-500 animate-pulse">Đang tải dữ liệu Fit...</p>
              )}

              {/* Style info summary */}
              {selectedSourceStyle && (
                <div className="flex items-center gap-2 rounded-lg bg-white/80 dark:bg-gray-800/60 border border-brand-100 dark:border-gray-700 px-3 py-2">
                  <CheckLineIcon className="h-4 w-4 text-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-gray-900 dark:text-white truncate">
                      {selectedSourceStyle.styleCode} — {selectedSourceStyle.styleName}
                    </span>
                    {selectedSourceStyle.category && (
                      <span className="text-[11px] text-gray-500">{selectedSourceStyle.category}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Fit data stats */}
              {fitPreview && (
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  {[
                    { label: "Công đoạn", value: fitPreview.operationSteps?.length || 0, key: "steps" },
                    { label: "May mẫu", value: fitPreview.sampleRounds?.length || 0, key: "samples" },
                    { label: "Tài liệu SX", value: fitPreview.productionDocument ? "✓" : "—", key: "doc" },
                    { label: "Tệp đính kèm", value: fitPreview.documents?.length || 0, key: "files" },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 py-1.5"
                    >
                      <span className="block text-sm font-extrabold text-brand-600 dark:text-brand-400">
                        {item.value}
                      </span>
                      <span className="block text-[10px] text-gray-500">{item.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Compact copy checkboxes */}
              <div className="border-t border-brand-100 dark:border-brand-900/40 pt-2">
                <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Sao chép từ Fit:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {[
                    { label: "Bảng công đoạn", checked: copySteps, set: setCopySteps },
                    { label: "Đợt may mẫu & ảnh", checked: copySamples, set: setCopySamples },
                    { label: "Tài liệu sản xuất", checked: copyProductionDoc, set: setCopyProductionDoc },
                    { label: "Tệp đính kèm Style", checked: copyDocuments, set: setCopyDocuments },
                  ].map((item) => (
                    <label key={item.label} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={(e) => item.set(e.target.checked)}
                        className="rounded text-brand-600 focus:ring-brand-500 h-3.5 w-3.5"
                      />
                      <span className="text-[11px] text-gray-700 dark:text-gray-300">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CÁC TRƯỜNG THÔNG TIN ───────────────────────────────────────────── */}
      <div className="space-y-2.5">
        {/* Mã & Tên — 2 cột */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Mã sản phẩm <span className="text-error-500">*</span>
            </label>
            <input
              type="text"
              placeholder="PROD-2026-001"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              className={`${inputCls} font-mono`}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Tên sản phẩm <span className="text-error-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Áo thun Polo Regular"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Danh mục & Hạn giao — 2 cột */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Danh mục
            </label>
            <input
              type="text"
              placeholder="Áo thun, Quần..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Hạn giao
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Ghi chú — 1 cột full */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
            Ghi chú chất liệu
          </label>
          <input
            type="text"
            placeholder="Cotton 100%, Navy..."
            value={materialNote}
            onChange={(e) => setMaterialNote(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Màu sắc & Bảng phân bổ size */}
        <div className="space-y-1 pt-1">
          <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Màu sắc &amp; Bảng size
          </label>
          <ProductColorSizeEditor
            colors={colors}
            onChange={setColors}
            allowMultipleColors={true}
          />
        </div>
      </div>

      {/* ── KHU VỰC GÁN TÀI LIỆU (KÉO THẢ TỪ CỘT TRÁI) ──────────────────────── */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`space-y-2 rounded-xl border p-3 transition-all duration-150 ${
          isDragOver
            ? "border-brand-500 bg-brand-50/60 ring-2 ring-brand-400/30 dark:border-brand-600 dark:bg-brand-950/40"
            : "border-gray-200/80 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/50"
        }`}
      >
        <div className="flex items-center justify-between pointer-events-none">
          <label className="text-xs font-semibold text-gray-800 dark:text-gray-200">
            Tài liệu gán kèm ({attachedDocIds.length})
          </label>
          <span className="text-[10px] text-gray-400">
            {isDragOver ? "Thả chuột ngay để đính kèm" : "Kéo từ cột trái thả vào đây"}
          </span>
        </div>

        {/* Danh sách tài liệu đã thả vào Form */}
        {attachedDocIds.length > 0 && (
          <div className="space-y-1.5">
            {attachedDocIds.map((docId) => {
              const doc = poDocuments.find((d) => d.documentId === docId);
              return (
                <div
                  key={docId}
                  className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 text-xs border border-emerald-200/80 shadow-2xs dark:bg-gray-800 dark:border-gray-700"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 pointer-events-none">
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold">
                      ✓
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-gray-800 dark:text-gray-200">
                        {doc?.title || doc?.fileName || doc?.documentCode || `Tài liệu #${docId.slice(0, 8)}`}
                      </span>
                      {doc?.purpose && (
                        <span className="text-[9px] font-mono uppercase text-gray-400">
                          {doc.purpose}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDoc(docId)}
                    className="ml-2 rounded p-1 text-gray-400 hover:bg-error-50 hover:text-error-600 transition-colors cursor-pointer"
                    title="Gỡ tài liệu"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Drop Zone Box - Khóa chiều cao h-20 để không bị layout shift gây nhấp nháy */}
        <div
          className={`h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-2 text-center select-none transition-colors duration-150 pointer-events-none ${
            isDragOver
              ? "border-brand-500 bg-brand-100/70 text-brand-700 dark:bg-brand-950/60 dark:border-brand-400 dark:text-brand-300 shadow-inner"
              : "border-gray-300 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-400"
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-1">
            <svg
              className={`h-4 w-4 transition-colors ${
                isDragOver ? "text-brand-600 dark:text-brand-400" : "text-gray-400 dark:text-gray-500"
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {isDragOver ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              )}
            </svg>
            <span
              className={`text-xs transition-colors font-semibold ${
                isDragOver ? "text-brand-700 dark:text-brand-300" : "text-gray-600 dark:text-gray-300"
              }`}
            >
              {isDragOver ? "Thả để gán tài liệu vào sản phẩm!" : "Thả tài liệu vào đây"}
            </span>
            <span
              className={`text-[10px] transition-colors ${
                isDragOver ? "text-brand-600 dark:text-brand-400 font-medium" : "text-gray-400"
              }`}
            >
              {isDragOver
                ? "Sẵn sàng liên kết khi tạo sản phẩm"
                : "Kéo từ cột trái sang để đính kèm tệp cho sản phẩm này"}
            </span>
          </div>
        </div>
      </div>

      {/* ── ACTION BUTTONS ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-800 pt-3">
        <button
          type="button"
          onClick={handleClose}
          className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer transition-colors"
        >
          ← Quay lại danh sách
        </button>
        <Button size="sm" type="button" onClick={() => void handleSubmit()} disabled={isPending}>
          {isPending
            ? "Đang tạo..."
            : mode === "select" && sourceStyleId
            ? "Import từ Fit vào PO"
            : "+ Tạo sản phẩm"}
        </Button>
      </div>
    </div>
  );
}
