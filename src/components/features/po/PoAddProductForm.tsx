import { useState, useMemo } from "react";
import { Button } from "@/components/shared";
import { useStyles } from "@/hooks/useStyles";
import { useImportFitPreview } from "@/hooks/usePurchaseOrders";
import { CheckLineIcon, DocsIcon, FileIcon } from "@/icons";
import type {
  CreatePoProductInput,
  ImportFitOptions,
  PurchaseOrderDocumentItem,
} from "@/types/po";

interface Props {
  isPending: boolean;
  poDocuments?: PurchaseOrderDocumentItem[];
  onClose: () => void;
  onSubmit: (input: CreatePoProductInput) => Promise<void>;
  cancelLabel?: string;
}

/**
 * PoAddProductForm — Form thêm sản phẩm 3 bước dùng chung.
 * Có thể render inline (split-screen) hoặc trong Modal wrapper.
 */
export function PoAddProductForm({
  isPending,
  poDocuments = [],
  onClose,
  onSubmit,
  cancelLabel = "Hủy",
}: Props) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<"select" | "manual">("select");
  const [sourceStyleId, setSourceStyleId] = useState("");
  const [productCode, setProductCode] = useState("");
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [materialNote, setMaterialNote] = useState("");
  const [deadline, setDeadline] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [copySteps, setCopySteps] = useState(true);
  const [copySamples, setCopySamples] = useState(true);
  const [copyProductionDoc, setCopyProductionDoc] = useState(true);
  const [copyDocuments, setCopyDocuments] = useState(true);

  const [selectedPoDocIds, setSelectedPoDocIds] = useState<string[]>([]);
  const [docSearch, setDocSearch] = useState("");
  const [docFilterPurpose, setDocFilterPurpose] = useState<string>("ALL");
  const [isDragOverDropzone, setIsDragOverDropzone] = useState(false);

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

  const togglePoDoc = (docId: string) => {
    setSelectedPoDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId],
    );
  };

  const filteredPoDocs = useMemo(() => {
    return poDocuments.filter((doc) => {
      const titleMatch = (doc.title || doc.fileName || doc.documentCode || "")
        .toLowerCase()
        .includes(docSearch.toLowerCase());
      const purposeMatch = docFilterPurpose === "ALL" ? true : doc.purpose === docFilterPurpose;
      return titleMatch && purposeMatch;
    });
  }, [poDocuments, docSearch, docFilterPurpose]);

  const availablePurposes = useMemo(() => {
    const set = new Set<string>();
    poDocuments.forEach((doc) => { if (doc.purpose) set.add(doc.purpose); });
    return Array.from(set);
  }, [poDocuments]);

  const handleReset = () => {
    setCurrentStep(1);
    setSourceStyleId(""); setProductCode(""); setProductName(""); setCategory("");
    setMaterialNote(""); setDeadline(""); setCopySteps(true); setCopySamples(true);
    setCopyProductionDoc(true); setCopyDocuments(true); setSelectedPoDocIds([]);
    setDocSearch(""); setDocFilterPurpose("ALL"); setErrorMsg(null);
  };

  const handleClose = () => { handleReset(); onClose(); };

  const validateStep1 = (): boolean => {
    setErrorMsg(null);
    if (!productCode.trim()) { setErrorMsg("Mã sản phẩm không được để trống."); return false; }
    if (!productName.trim()) { setErrorMsg("Tên sản phẩm không được để trống."); return false; }
    return true;
  };

  const handleNextToStep2 = () => { if (validateStep1()) setCurrentStep(2); };
  const handleNextToStep3 = () => { if (validateStep1()) setCurrentStep(3); };

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (!validateStep1()) { setCurrentStep(1); return; }
    const importOptions: ImportFitOptions | undefined =
      mode === "select" && sourceStyleId
        ? { copySteps, copySamples, copyProductionDoc, copyDocuments }
        : undefined;
    try {
      await onSubmit({
        productCode: productCode.trim(),
        productName: productName.trim(),
        sourceStyleId: mode === "select" && sourceStyleId ? sourceStyleId : undefined,
        category: category.trim() || undefined,
        materialNote: materialNote.trim() || undefined,
        deadline: deadline || undefined,
        importOptions,
        poDocumentIds: selectedPoDocIds.length > 0 ? selectedPoDocIds : undefined,
      });
      handleClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Có lỗi xảy ra khi thêm sản phẩm.");
    }
  };

  const stepBase = "flex items-center gap-2 rounded-xl p-2.5 text-left transition-all cursor-pointer border";
  const stepActive = "bg-brand-50/90 border-brand-300 text-brand-700 shadow-2xs dark:bg-brand-950/50 dark:border-brand-700 dark:text-brand-300";
  const stepInactive = "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600 dark:bg-gray-800/60 dark:border-gray-800 dark:text-gray-400";
  const dotBase = "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold";
  const dotActive = "bg-brand-600 text-white";
  const dotDone = "bg-emerald-500 text-white";
  const dotIdle = "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
  const inputCls = "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white";

  return (
    <div className="space-y-4">
      {/* Stepper */}
      <div className="grid grid-cols-3 gap-2">
        <button type="button" onClick={() => setCurrentStep(1)} className={`${stepBase} ${currentStep === 1 ? stepActive : stepInactive}`}>
          <div className={`${dotBase} ${currentStep === 1 ? dotActive : (productCode.trim() && productName.trim()) ? dotDone : dotIdle}`}>
            {productCode.trim() && productName.trim() && currentStep !== 1 ? <CheckLineIcon className="h-3.5 w-3.5" /> : "1"}
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wide truncate">Thông tin SP</div>
        </button>

        <button type="button" onClick={handleNextToStep2} className={`${stepBase} ${currentStep === 2 ? stepActive : stepInactive}`}>
          <div className={`${dotBase} ${currentStep === 2 ? dotActive : currentStep === 3 ? dotDone : dotIdle}`}>
            {currentStep === 3 ? <CheckLineIcon className="h-3.5 w-3.5" /> : "2"}
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wide truncate">
            Gán tài liệu{selectedPoDocIds.length > 0 && <span className="text-brand-600 ml-1">({selectedPoDocIds.length})</span>}
          </div>
        </button>

        <button type="button" onClick={handleNextToStep3} className={`${stepBase} ${currentStep === 3 ? stepActive : stepInactive}`}>
          <div className={`${dotBase} ${currentStep === 3 ? dotActive : dotIdle}`}>3</div>
          <div className="text-[11px] font-bold uppercase tracking-wide truncate">Xác nhận</div>
        </button>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="rounded-xl border border-error-200 bg-error-50 p-3 text-xs font-medium text-error-700 dark:border-error-900/40 dark:bg-error-950/40 dark:text-error-300">
          {errorMsg}
        </div>
      )}

      {/* ── BƯỚC 1 ───────────────────────────────────────────────────────────── */}
      {currentStep === 1 && (
        <div className="space-y-3">
          <div className="flex rounded-lg border border-gray-200 bg-gray-50/80 p-0.5 dark:border-gray-800 dark:bg-gray-900">
            {(["select", "manual"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); if (m === "manual") setSourceStyleId(""); }}
                className={`flex-1 rounded-md py-1.5 px-2 text-xs font-semibold transition cursor-pointer ${
                  mode === m ? "bg-white text-brand-600 shadow-2xs dark:bg-gray-800 dark:text-brand-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                {m === "select" ? "Từ Style / Fit có sẵn" : "Nhập thủ công"}
              </button>
            ))}
          </div>

          {mode === "select" && (
            <div className="space-y-2 rounded-xl border border-brand-200/80 bg-brand-50/30 p-3 dark:border-brand-900/40 dark:bg-brand-950/20">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Chọn Style Mẫu Fit gốc <span className="text-error-500">*</span>
              </label>
              <select
                value={sourceStyleId}
                onChange={(e) => handleSelectStyle(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none transition focus:border-brand-500 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
              >
                <option value="">-- Chọn một Style có sẵn --</option>
                {styleList.map((s) => (
                  <option key={s.id} value={s.id}>{s.styleCode} - {s.styleName} {s.category ? `(${s.category})` : ""}</option>
                ))}
              </select>

              {sourceStyleId && (
                <div className="space-y-2 pt-1">
                  {isPreviewLoading && <span className="text-xs text-brand-600 animate-pulse">Đang phân tích dữ liệu Fit...</span>}
                  {fitPreview && (
                    <div className="grid grid-cols-4 gap-1 text-center">
                      {[
                        { label: "Công đoạn", value: fitPreview.operationSteps?.length || 0 },
                        { label: "May mẫu", value: fitPreview.sampleRounds?.length || 0 },
                        { label: "Tài liệu SX", value: fitPreview.productionDocument ? "Có" : "Không" },
                        { label: "Tệp đính kèm", value: fitPreview.documents?.length || 0 },
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg bg-white p-1.5 shadow-2xs dark:bg-gray-800 border border-brand-100 dark:border-gray-700">
                          <span className="text-sm font-extrabold text-brand-600 dark:text-brand-400">{item.value}</span>
                          <span className="block text-[10px] text-gray-500">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="pt-1.5 border-t border-brand-200/60 dark:border-brand-900/40">
                    <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Chọn thành phần sao chép:</p>
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      {[
                        { label: `Bảng công đoạn (${fitPreview?.operationSteps?.length || 0})`, checked: copySteps, set: setCopySteps },
                        { label: `Đợt may mẫu & ảnh (${fitPreview?.sampleRounds?.length || 0})`, checked: copySamples, set: setCopySamples },
                        { label: "Tài liệu sản xuất tiếng Việt", checked: copyProductionDoc, set: setCopyProductionDoc },
                        { label: `Tài liệu đính kèm Style (${fitPreview?.documents?.length || 0})`, checked: copyDocuments, set: setCopyDocuments },
                      ].map((item) => (
                        <label key={item.label} className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                          <input type="checkbox" checked={item.checked} onChange={(e) => item.set(e.target.checked)} className="rounded text-brand-600 h-3.5 w-3.5" />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Mã sản phẩm <span className="text-error-500">*</span></label>
              <input type="text" placeholder="PROD-2026-001" value={productCode} onChange={(e) => setProductCode(e.target.value)} className={`${inputCls} font-mono`} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Tên sản phẩm <span className="text-error-500">*</span></label>
              <input type="text" placeholder="Áo thun Polo Regular" value={productName} onChange={(e) => setProductName(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Danh mục</label>
              <input type="text" placeholder="Áo thun, Quần..." value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Hạn giao</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Ghi chú chất liệu / Màu sắc</label>
            <input type="text" placeholder="Cotton 100%, Navy..." value={materialNote} onChange={(e) => setMaterialNote(e.target.value)} className={inputCls} />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
            <Button variant="outline" size="sm" onClick={handleClose}>{cancelLabel}</Button>
            <Button size="sm" type="button" onClick={handleNextToStep2}>Gán tài liệu →</Button>
          </div>
        </div>
      )}

      {/* ── BƯỚC 2 ───────────────────────────────────────────────────────────── */}
      {currentStep === 2 && (
        <div className="space-y-3">
          <div className="rounded-xl border border-brand-200 bg-brand-50/40 px-3 py-2 dark:border-brand-900/40 dark:bg-brand-950/20 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Gán tài liệu từ kho PO <span className="text-gray-400">(Không bắt buộc)</span></p>
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
              {selectedPoDocIds.length} / {poDocuments.length}
            </span>
          </div>

          {poDocuments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center dark:border-gray-800 bg-gray-50/50">
              <DocsIcon className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-300">PO hiện chưa có tài liệu nào.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="text" placeholder="Tìm tài liệu..." value={docSearch} onChange={(e) => setDocSearch(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-800 dark:text-white" />
                <div className="flex items-center gap-1.5 text-xs shrink-0">
                  <button type="button" onClick={() => setSelectedPoDocIds(poDocuments.map((d) => d.documentId))} className="font-semibold text-brand-600 hover:text-brand-700 cursor-pointer">Tất cả</button>
                  <span className="text-gray-300">|</span>
                  <button type="button" onClick={() => setSelectedPoDocIds([])} className="text-gray-500 hover:text-gray-700 cursor-pointer">Bỏ</button>
                </div>
              </div>

              {availablePurposes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {["ALL", ...availablePurposes].map((purp) => (
                    <button key={purp} type="button" onClick={() => setDocFilterPurpose(purp)}
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition cursor-pointer ${
                        docFilterPurpose === purp ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                      }`}>
                      {purp === "ALL" ? `Tất cả (${poDocuments.length})` : `${purp} (${poDocuments.filter((d) => d.purpose === purp).length})`}
                    </button>
                  ))}
                </div>
              )}

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOverDropzone(true); }}
                onDragLeave={() => setIsDragOverDropzone(false)}
                onDrop={(e) => {
                  e.preventDefault(); setIsDragOverDropzone(false);
                  const docId = e.dataTransfer.getData("text/plain");
                  if (docId && !selectedPoDocIds.includes(docId)) setSelectedPoDocIds((prev) => [...prev, docId]);
                }}
                className={`rounded-xl border p-2 transition-all ${isDragOverDropzone ? "border-2 border-brand-500 bg-brand-50/70 dark:bg-brand-950/40" : "border-gray-200 bg-gray-50/40 dark:border-gray-800 dark:bg-gray-800/30"}`}
              >
                {filteredPoDocs.length === 0 ? (
                  <p className="p-4 text-center text-xs text-gray-400 italic">Không tìm thấy tài liệu phù hợp.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-1.5 max-h-[180px] overflow-y-auto pr-1">
                    {filteredPoDocs.map((doc) => {
                      const isChecked = selectedPoDocIds.includes(doc.documentId);
                      return (
                        <label key={doc.documentId} className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all select-none ${
                          isChecked ? "border-brand-400 bg-brand-50 text-brand-900 dark:border-brand-700 dark:bg-brand-950/50 font-medium" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100/70 dark:border-gray-700 dark:bg-gray-800"
                        }`}>
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <input type="checkbox" checked={isChecked} onChange={() => togglePoDoc(doc.documentId)} className="rounded text-brand-600 h-3.5 w-3.5 shrink-0 cursor-pointer" />
                            <FileIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{doc.title || doc.fileName || doc.documentCode}</span>
                          </div>
                          <span className="text-[10px] text-gray-400 uppercase shrink-0 font-mono">{doc.purpose}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                <p className="mt-1.5 text-[10px] text-gray-400 text-center italic">Kéo thả tài liệu từ cột trái vào đây để gán nhanh.</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
            <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)}>← Quay lại</Button>
            <Button size="sm" type="button" onClick={handleNextToStep3}>Xác nhận →</Button>
          </div>
        </div>
      )}

      {/* ── BƯỚC 3 ───────────────────────────────────────────────────────────── */}
      {currentStep === 3 && (
        <div className="space-y-3">
          <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-3 dark:border-brand-900/40 dark:bg-brand-950/30">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Xác nhận thông tin sẽ thêm vào PO</h4>
          </div>

          <div className="space-y-2 text-xs">
            <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-1.5 dark:border-gray-800 dark:bg-gray-800/60">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Thông tin cơ bản</span>
              {[
                { label: "Mã SP", value: <span className="font-mono font-bold text-brand-600">{productCode}</span> },
                { label: "Tên SP", value: <span className="font-medium text-gray-900 dark:text-white">{productName}</span> },
                { label: "Danh mục", value: <span className="text-gray-700 dark:text-gray-300">{category || "—"}</span> },
                { label: "Hạn giao", value: <span className="text-gray-700 dark:text-gray-300">{deadline || "Chưa thiết lập"}</span> },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-gray-500">{row.label}:</span>{row.value}
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-800/60">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Mẫu Fit nguồn</span>
              {mode === "select" && sourceStyleId ? (
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">{selectedSourceStyle?.styleCode}</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium truncate">{selectedSourceStyle?.styleName}</span>
                </div>
              ) : (
                <p className="text-gray-400 italic">Tạo độc lập (không kế thừa từ Fit).</p>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-800/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Tài liệu PO gán kèm ({selectedPoDocIds.length})</span>
                <button type="button" onClick={() => setCurrentStep(2)} className="text-[11px] text-brand-600 hover:underline cursor-pointer">Thay đổi</button>
              </div>
              {selectedPoDocIds.length === 0 ? (
                <p className="text-gray-400 italic">Không gán tài liệu nào.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {selectedPoDocIds.map((did) => {
                    const doc = poDocuments.find((d) => d.documentId === did);
                    if (!doc) return null;
                    return (
                      <div key={did} className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        <FileIcon className="h-3 w-3 text-gray-400" />
                        <span className="font-medium max-w-[120px] truncate">{doc.title || doc.fileName || doc.documentCode}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
            <Button variant="outline" size="sm" onClick={() => setCurrentStep(2)} disabled={isPending}>← Quay lại</Button>
            <Button size="sm" type="button" onClick={() => void handleSubmit()} disabled={isPending}>
              {isPending ? "Đang xử lý..." : mode === "select" && sourceStyleId ? "Xác nhận Import vào PO" : "+ Thêm vào PO"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
