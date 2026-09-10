import { useState, useMemo } from "react";
import { Modal, Button } from "@/components/shared";
import { CheckLineIcon, DocsIcon, FileIcon } from "@/icons";
import { useStyles } from "@/hooks/useStyles";
import { useImportFitPreview } from "@/hooks/usePurchaseOrders";
import type {
  CreatePoProductInput,
  ImportFitOptions,
  PurchaseOrderDocumentItem,
  ProductColorItem,
} from "@/types/po";
import { ProductColorSizeEditor, calcTotalFromColors } from "@/components/features/po/ProductColorSizeEditor";

interface Props {
  isOpen: boolean;
  isPending: boolean;
  poDocuments?: PurchaseOrderDocumentItem[];
  onClose: () => void;
  onSubmit: (input: CreatePoProductInput) => Promise<void>;
}

export function PoAddProductModal({
  isOpen,
  isPending,
  poDocuments = [],
  onClose,
  onSubmit,
}: Props) {
  // Giai đoạn tạo sản phẩm: 1 = Thông tin chung, 2 = Gán tài liệu, 3 = Xác nhận & tạo
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Giai đoạn 1: Thông tin sản phẩm
  const [mode, setMode] = useState<"select" | "manual">("select");
  const [sourceStyleId, setSourceStyleId] = useState("");
  const [productCode, setProductCode] = useState("");
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [materialNote, setMaterialNote] = useState("");
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

  // Import options from Style
  const [copySteps, setCopySteps] = useState(true);
  const [copySamples, setCopySamples] = useState(true);
  const [copyProductionDoc, setCopyProductionDoc] = useState(true);
  const [copyDocuments, setCopyDocuments] = useState(true);

  // Giai đoạn 2: Gán tài liệu từ kho PO
  const [selectedPoDocIds, setSelectedPoDocIds] = useState<string[]>([]);
  const [docSearch, setDocSearch] = useState("");
  const [docFilterPurpose, setDocFilterPurpose] = useState<string>("ALL");
  const [isDragOverDropzone, setIsDragOverDropzone] = useState(false);

  const { data: stylesData } = useStyles({ limit: 100 });
  const styleList = useMemo(() => stylesData?.data || [], [stylesData?.data]);

  // Fetch preview data when sourceStyleId is selected
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

  const handleSelectAllDocs = () => {
    const allIds = poDocuments.map((d) => d.documentId);
    setSelectedPoDocIds(allIds);
  };

  const handleDeselectAllDocs = () => {
    setSelectedPoDocIds([]);
  };

  // Filtered poDocuments based on search & purpose tab
  const filteredPoDocs = useMemo(() => {
    return poDocuments.filter((doc) => {
      const titleMatch =
        (doc.title || doc.fileName || doc.documentCode || "")
          .toLowerCase()
          .includes(docSearch.toLowerCase());
      const purposeMatch =
        docFilterPurpose === "ALL" ? true : doc.purpose === docFilterPurpose;
      return titleMatch && purposeMatch;
    });
  }, [poDocuments, docSearch, docFilterPurpose]);

  // Unique list of purposes in current PO documents
  const availablePurposes = useMemo(() => {
    const set = new Set<string>();
    poDocuments.forEach((doc) => {
      if (doc.purpose) set.add(doc.purpose);
    });
    return Array.from(set);
  }, [poDocuments]);

  const handleReset = () => {
    setCurrentStep(1);
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
    setCopySteps(true);
    setCopySamples(true);
    setCopyProductionDoc(true);
    setCopyDocuments(true);
    setSelectedPoDocIds([]);
    setDocSearch("");
    setDocFilterPurpose("ALL");
    setErrorMsg(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const validateStep1 = (): boolean => {
    setErrorMsg(null);
    if (!productCode.trim()) {
      setErrorMsg("Mã sản phẩm không được để trống.");
      return false;
    }
    if (!productName.trim()) {
      setErrorMsg("Tên sản phẩm không được để trống.");
      return false;
    }
    return true;
  };

  const handleNextToStep2 = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleNextToStep3 = () => {
    if (validateStep1()) {
      setCurrentStep(3);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }

    const importOptions: ImportFitOptions | undefined =
      mode === "select" && sourceStyleId
        ? {
            copySteps,
            copySamples,
            copyProductionDoc,
            copyDocuments,
          }
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
        poDocumentIds: selectedPoDocIds.length > 0 ? selectedPoDocIds : undefined,
      });
      handleClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Có lỗi xảy ra khi thêm sản phẩm.");
      }
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Thêm sản phẩm vào đơn hàng PO"
      size="xl"
    >
      <div className="space-y-4">
        {/* Stepper Navigation: 3 Giai đoạn (Cân đối, vừa vặn không tràn khung) */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {/* Step 1 */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-3 rounded-xl p-3 text-left transition-all cursor-pointer border ${
              currentStep === 1
                ? "bg-brand-50/90 border-brand-300 text-brand-700 shadow-2xs dark:bg-brand-950/50 dark:border-brand-700 dark:text-brand-300"
                : "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600 dark:bg-gray-800/60 dark:border-gray-800 dark:text-gray-400"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                currentStep === 1
                  ? "bg-brand-600 text-white shadow-2xs"
                  : productCode.trim() && productName.trim()
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {productCode.trim() && productName.trim() && currentStep !== 1 ? (
                <CheckLineIcon className="h-3.5 w-3.5" />
              ) : (
                "1"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold uppercase tracking-wider">Thông tin sản phẩm</div>
              <div className="text-[11px] opacity-75 truncate">
                Mã, tên SP, liên kết Style
              </div>
            </div>
          </button>

          {/* Step 2 */}
          <button
            type="button"
            onClick={handleNextToStep2}
            className={`flex items-center gap-3 rounded-xl p-3 text-left transition-all cursor-pointer border ${
              currentStep === 2
                ? "bg-brand-50/90 border-brand-300 text-brand-700 shadow-2xs dark:bg-brand-950/50 dark:border-brand-700 dark:text-brand-300"
                : "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600 dark:bg-gray-800/60 dark:border-gray-800 dark:text-gray-400"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                currentStep === 2
                  ? "bg-brand-600 text-white shadow-2xs"
                  : currentStep === 3
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {currentStep === 3 ? (
                <CheckLineIcon className="h-3.5 w-3.5" />
              ) : (
                "2"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold uppercase tracking-wider">Gán tài liệu</div>
              <div className="text-[11px] opacity-75 truncate">
                {selectedPoDocIds.length > 0
                  ? `Đã chọn ${selectedPoDocIds.length} tệp`
                  : "Không bắt buộc"}
              </div>
            </div>
          </button>

          {/* Step 3 */}
          <button
            type="button"
            onClick={handleNextToStep3}
            className={`flex items-center gap-3 rounded-xl p-3 text-left transition-all cursor-pointer border ${
              currentStep === 3
                ? "bg-brand-50/90 border-brand-300 text-brand-700 shadow-2xs dark:bg-brand-950/50 dark:border-brand-700 dark:text-brand-300"
                : "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600 dark:bg-gray-800/60 dark:border-gray-800 dark:text-gray-400"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                currentStep === 3
                  ? "bg-brand-600 text-white shadow-2xs"
                  : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              3
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold uppercase tracking-wider">Xác nhận</div>
              <div className="text-[11px] opacity-75 truncate">
                Kiểm tra & tạo sản phẩm
              </div>
            </div>
          </button>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="rounded-xl border border-error-200 bg-error-50 p-3 text-theme-xs font-medium text-error-700 dark:border-error-900/40 dark:bg-error-950/40 dark:text-error-300">
            {errorMsg}
          </div>
        )}

        {/* ========================================================================= */}
        {/* GIAI ĐOẠN 1: THÔNG TIN SẢN PHẨM                                           */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-3.5">
            {/* Tab switch mode */}
            <div className="flex rounded-lg border border-gray-200 bg-gray-50/80 p-0.5 dark:border-gray-800 dark:bg-gray-900">
              <button
                type="button"
                onClick={() => setMode("select")}
                className={`flex-1 rounded-md py-1.5 px-3 text-theme-xs font-semibold transition cursor-pointer ${
                  mode === "select"
                    ? "bg-white text-brand-600 shadow-2xs dark:bg-gray-800 dark:text-brand-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                Chọn từ Style / Fit có sẵn (Khuyên dùng)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("manual");
                  setSourceStyleId("");
                }}
                className={`flex-1 rounded-md py-1.5 px-3 text-theme-xs font-semibold transition cursor-pointer ${
                  mode === "manual"
                    ? "bg-white text-brand-600 shadow-2xs dark:bg-gray-800 dark:text-brand-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                Nhập thủ công sản phẩm mới
              </button>
            </div>

            {/* If mode === select: Pick Source Style & View preview */}
            {mode === "select" && (
              <div className="space-y-2.5 rounded-xl border border-brand-200/80 bg-brand-50/30 p-3 dark:border-brand-900/40 dark:bg-brand-950/20">
                <div>
                  <label className="block text-theme-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Chọn Style Mẫu Fit gốc <span className="text-error-500">*</span>
                  </label>
                  <select
                    value={sourceStyleId}
                    onChange={(e) => handleSelectStyle(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-theme-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">-- Chọn một Style có sẵn từ danh mục Fit --</option>
                    {styleList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.styleCode} - {s.styleName} {s.category ? `(${s.category})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {sourceStyleId && (
                  <div className="space-y-2 pt-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-theme-xs font-bold text-brand-900 dark:text-brand-300 uppercase tracking-wide">
                        Xem trước dữ liệu Fit sẽ import
                      </span>
                      {isPreviewLoading && (
                        <span className="text-theme-xs text-brand-600 animate-pulse">
                          Đang phân tích cấu trúc dữ liệu Fit...
                        </span>
                      )}
                    </div>

                    {fitPreview && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="rounded-lg bg-white p-2 shadow-2xs dark:bg-gray-800 border border-brand-100 dark:border-gray-700">
                          <span className="text-lg font-extrabold text-brand-600 dark:text-brand-400">
                            {fitPreview.operationSteps?.length || 0}
                          </span>
                          <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                            Bảng công đoạn
                          </span>
                        </div>

                        <div className="rounded-lg bg-white p-2 shadow-2xs dark:bg-gray-800 border border-brand-100 dark:border-gray-700">
                          <span className="text-lg font-extrabold text-brand-600 dark:text-brand-400">
                            {fitPreview.sampleRounds?.length || 0}
                          </span>
                          <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                            Đợt may mẫu
                          </span>
                        </div>

                        <div className="rounded-lg bg-white p-2 shadow-2xs dark:bg-gray-800 border border-brand-100 dark:border-gray-700">
                          <span className="text-lg font-extrabold text-brand-600 dark:text-brand-400">
                            {fitPreview.productionDocument ? "Có" : "Không"}
                          </span>
                          <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                            Tài liệu SX tiếng Việt
                          </span>
                        </div>

                        <div className="rounded-lg bg-white p-2 shadow-2xs dark:bg-gray-800 border border-brand-100 dark:border-gray-700">
                          <span className="text-lg font-extrabold text-brand-600 dark:text-brand-400">
                            {fitPreview.documents?.length || 0}
                          </span>
                          <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                            Tệp tài liệu từ Fit
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Selection Checkboxes for Style components */}
                    <div className="pt-2 border-t border-brand-200/60 dark:border-brand-900/40">
                      <span className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                        Chọn các thành phần từ Style vào sản phẩm:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-theme-xs">
                        <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={copySteps}
                            onChange={(e) => setCopySteps(e.target.checked)}
                            className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                          />
                          <span>
                            Bảng công đoạn{" "}
                            <span className="text-gray-400 font-mono">
                              ({fitPreview?.operationSteps?.length || 0})
                            </span>
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={copySamples}
                            onChange={(e) => setCopySamples(e.target.checked)}
                            className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                          />
                          <span>
                            Đợt may mẫu & ảnh{" "}
                            <span className="text-gray-400 font-mono">
                              ({fitPreview?.sampleRounds?.length || 0})
                            </span>
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={copyProductionDoc}
                            onChange={(e) => setCopyProductionDoc(e.target.checked)}
                            className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                          />
                          <span>Tài liệu sản xuất tiếng Việt</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={copyDocuments}
                            onChange={(e) => setCopyDocuments(e.target.checked)}
                            className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                          />
                          <span>
                            Tài liệu đính kèm của Style{" "}
                            <span className="text-gray-400 font-mono">
                              ({fitPreview?.documents?.length || 0})
                            </span>
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-theme-xs font-semibold text-gray-700 dark:text-gray-300">
                    Mã sản phẩm trong PO <span className="text-error-500">*</span>
                  </label>
                  {mode === "select" && (
                    <span className="text-[10px] text-gray-400">
                      (Độc lập, có thể chỉnh sửa)
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="VD: PROD-2026-001"
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-theme-sm font-mono text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-theme-xs font-semibold text-gray-700 dark:text-gray-300">
                  Tên sản phẩm <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Áo thun Polo Regular"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-theme-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-theme-xs font-semibold text-gray-700 dark:text-gray-300">
                  Danh mục / Dòng sản phẩm
                </label>
                <input
                  type="text"
                  placeholder="VD: Áo thun, Quần Khaki..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-theme-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-theme-xs font-semibold text-gray-700 dark:text-gray-300">
                  Ghi chú chất liệu / Màu sắc
                </label>
                <input
                  type="text"
                  placeholder="VD: Cotton 100%, Navy..."
                  value={materialNote}
                  onChange={(e) => setMaterialNote(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-theme-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-theme-xs font-semibold text-gray-700 dark:text-gray-300">
                Hạn giao (Deadline)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-theme-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Màu sắc & Bảng phân bổ size breakdown */}
            <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-800">
              <label className="block text-theme-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Màu sắc &amp; Bảng Size sản xuất
              </label>
              <ProductColorSizeEditor
                colors={colors}
                onChange={setColors}
                allowMultipleColors={true}
              />
            </div>

            {/* Step 1 Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
              <Button variant="outline" size="sm" onClick={handleClose}>
                Hủy
              </Button>
              <Button size="sm" type="button" onClick={handleNextToStep2}>
                Tiếp tục: Gán tài liệu →
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* GIAI ĐOẠN 2: GÁN TÀI LIỆU                                                 */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-3">
            <div className="rounded-xl border border-brand-200 bg-brand-50/40 px-3.5 py-2.5 dark:border-brand-900/40 dark:bg-brand-950/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-theme-sm font-bold text-gray-900 dark:text-white">
                    Gán tài liệu từ kho PO vào sản phẩm
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Tài liệu là không bắt buộc. Bạn có thể chọn ngay hoặc bổ sung sau.
                  </p>
                </div>
                <span className="rounded-full bg-brand-100 px-3 py-0.5 text-theme-xs font-bold text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
                  Đã chọn: {selectedPoDocIds.length} / {poDocuments.length}
                </span>
              </div>
            </div>

            {poDocuments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                <DocsIcon className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-theme-xs font-medium text-gray-600 dark:text-gray-300">
                  Đơn hàng PO hiện chưa có tài liệu nào trong kho.
                </p>
                <p className="mt-1 text-[11px] text-gray-400">
                  Bạn có thể bấm "Tiếp tục" để sang bước xác nhận tạo sản phẩm.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Search & Filter Bar */}
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 dark:border-gray-800 dark:bg-gray-800">
                    <input
                      type="text"
                      placeholder="Tìm tài liệu theo tên hoặc mục đích..."
                      value={docSearch}
                      onChange={(e) => setDocSearch(e.target.value)}
                      className="w-full bg-transparent text-theme-xs text-gray-900 placeholder-gray-400 outline-none dark:text-white"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllDocs}
                      className="text-theme-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 cursor-pointer"
                    >
                      Chọn tất cả
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllDocs}
                      className="text-theme-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 cursor-pointer"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>

                {/* Purpose Pills Filter */}
                {availablePurposes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDocFilterPurpose("ALL")}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                        docFilterPurpose === "ALL"
                          ? "bg-brand-600 text-white shadow-2xs"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      Tất cả ({poDocuments.length})
                    </button>
                    {availablePurposes.map((purp) => {
                      const count = poDocuments.filter((d) => d.purpose === purp).length;
                      return (
                        <button
                          key={purp}
                          type="button"
                          onClick={() => setDocFilterPurpose(purp)}
                          className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                            docFilterPurpose === purp
                              ? "bg-brand-600 text-white shadow-2xs"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {purp} ({count})
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Dropzone Container - Chiều cao kiểm soát tối ưu, không vượt màn hình */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOverDropzone(true);
                  }}
                  onDragLeave={() => setIsDragOverDropzone(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOverDropzone(false);
                    const docId = e.dataTransfer.getData("text/plain");
                    if (docId && !selectedPoDocIds.includes(docId)) {
                      setSelectedPoDocIds((prev) => [...prev, docId]);
                    }
                  }}
                  className={`rounded-xl border p-2.5 transition-all ${
                    isDragOverDropzone
                      ? "border-2 border-brand-500 bg-brand-50/70 dark:bg-brand-950/40"
                      : "border-gray-200 bg-gray-50/40 dark:border-gray-800 dark:bg-gray-800/30"
                  }`}
                >
                  {filteredPoDocs.length === 0 ? (
                    <p className="p-4 text-center text-theme-xs text-gray-400 italic">
                      Không tìm thấy tài liệu phù hợp với bộ lọc.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                      {filteredPoDocs.map((doc) => {
                        const isChecked = selectedPoDocIds.includes(doc.documentId);
                        return (
                          <label
                            key={doc.documentId}
                            className={`flex items-center justify-between p-2 rounded-lg border text-theme-xs cursor-pointer transition-all select-none ${
                              isChecked
                                ? "border-brand-400 bg-brand-50 text-brand-900 dark:border-brand-700 dark:bg-brand-950/50 dark:text-brand-200 font-medium"
                                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100/70 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePoDoc(doc.documentId)}
                                className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4 shrink-0 cursor-pointer"
                              />
                              <FileIcon className="h-4 w-4 text-gray-400 shrink-0" />
                              <span className="truncate">
                                {doc.title || doc.fileName || doc.documentCode}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 uppercase shrink-0 font-mono">
                              {doc.purpose}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  <p className="mt-1.5 text-[10px] text-gray-400 text-center italic">
                    * Có thể kéo thả tệp tài liệu từ danh sách bên trái thả trực tiếp vào ô này.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2 Footer */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
              <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)}>
                ← Quay lại: Thông tin sản phẩm
              </Button>
              <Button size="sm" type="button" onClick={handleNextToStep3}>
                Tiếp tục: Xác nhận →
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* GIAI ĐOẠN 3: XÁC NHẬN & HOÀN TẤT                                          */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-3.5">
            <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-3 dark:border-brand-900/40 dark:bg-brand-950/30">
              <h4 className="text-theme-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                Xác nhận thông tin sản phẩm sẽ thêm vào PO
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Vui lòng kiểm tra lại thông số trước khi tiến hành khởi tạo bản ghi độc lập.
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-theme-xs">
              {/* Card 1: Product Basics */}
              <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-1.5 dark:border-gray-800 dark:bg-gray-800/60 shadow-2xs">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Thông tin cơ bản
                </span>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mã sản phẩm:</span>
                    <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
                      {productCode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tên sản phẩm:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {productName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Danh mục:</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {category || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hạn giao:</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {deadline || "Chưa thiết lập"}
                    </span>
                  </div>
                  {materialNote && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Chất liệu / Màu:</span>
                      <span className="text-gray-700 dark:text-gray-300 truncate max-w-[160px]">
                        {materialNote}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Source & Cloned data */}
              <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-1.5 dark:border-gray-800 dark:bg-gray-800/60 shadow-2xs">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Màu sắc &amp; Tổng sản lượng ({calcTotalFromColors(colors).toLocaleString("vi-VN")} pcs)
                </span>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    {colors.filter((c) => c.colorName.trim()).length === 0 ? (
                      <span className="text-gray-400 italic text-xs">Chưa đặt tên màu</span>
                    ) : (
                      colors
                        .filter((c) => c.colorName.trim())
                        .map((c) => (
                          <span
                            key={c.id || c.colorName}
                            className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300"
                          >
                            <span>{c.colorName}</span>
                            <span className="text-gray-400">·</span>
                            <span className="font-mono">
                              {(c.sizes || []).reduce((s, x) => s + (Number(x.quantity) || 0), 0)} pcs
                            </span>
                          </span>
                        ))
                    )}
                  </div>
                </div>
              </div>

              {/* Card 3: Source & Cloned data */}
              <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-1.5 dark:border-gray-800 dark:bg-gray-800/60 shadow-2xs">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Liên kết Mẫu Fit nguồn
                </span>
                {mode === "select" && sourceStyleId ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                        {selectedSourceStyle?.styleCode || "Fit Style"}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 font-medium truncate">
                        {selectedSourceStyle?.styleName}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-500 space-y-1 pt-1 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <span>Bảng công đoạn:</span>
                        <span className={copySteps ? "text-emerald-600 font-semibold" : "text-gray-400"}>
                          {copySteps ? `Sao chép (${fitPreview?.operationSteps?.length || 0})` : "Bỏ qua"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Đợt may mẫu & ảnh:</span>
                        <span className={copySamples ? "text-emerald-600 font-semibold" : "text-gray-400"}>
                          {copySamples ? `Sao chép (${fitPreview?.sampleRounds?.length || 0})` : "Bỏ qua"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Tài liệu SX tiếng Việt:</span>
                        <span className={copyProductionDoc ? "text-emerald-600 font-semibold" : "text-gray-400"}>
                          {copyProductionDoc ? "Sao chép" : "Bỏ qua"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Tài liệu đính kèm Style:</span>
                        <span className={copyDocuments ? "text-emerald-600 font-semibold" : "text-gray-400"}>
                          {copyDocuments ? `Sao chép (${fitPreview?.documents?.length || 0})` : "Bỏ qua"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 italic text-theme-xs">
                    Tạo sản phẩm độc lập (Không kế thừa dữ liệu từ Fit).
                  </p>
                )}
              </div>
            </div>

            {/* Card 3: Selected Documents from PO */}
            <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-1.5 dark:border-gray-800 dark:bg-gray-800/60 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Tài liệu PO gán kèm ({selectedPoDocIds.length})
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-theme-xs text-brand-600 hover:underline cursor-pointer"
                >
                  Thay đổi
                </button>
              </div>

              {selectedPoDocIds.length === 0 ? (
                <p className="text-[11px] text-gray-400 italic">
                  Không gán tài liệu nào từ kho PO.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {selectedPoDocIds.map((id) => {
                    const doc = poDocuments.find((d) => d.documentId === id);
                    if (!doc) return null;
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        <FileIcon className="h-3 w-3 text-gray-400" />
                        <span className="font-medium max-w-[150px] truncate">
                          {doc.title || doc.fileName || doc.documentCode}
                        </span>
                        <span className="text-[9px] uppercase font-mono text-gray-400 bg-gray-200 dark:bg-gray-700 px-1 rounded">
                          {doc.purpose}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 3 Footer */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
              <Button variant="outline" size="sm" onClick={() => setCurrentStep(2)} disabled={isPending}>
                ← Quay lại: Gán tài liệu
              </Button>
              <Button size="sm" type="button" onClick={() => handleSubmit()} disabled={isPending}>
                {isPending
                  ? "Đang xử lý tạo..."
                  : mode === "select" && sourceStyleId
                  ? "Xác nhận Import vào PO"
                  : "+ Thêm vào PO"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
