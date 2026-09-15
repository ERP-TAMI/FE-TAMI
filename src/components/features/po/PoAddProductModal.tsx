import { useState, useMemo, useRef } from "react";
import { Modal, Button, SearchableSelect } from "@/components/shared";
import { CheckLineIcon, DocsIcon, FileIcon } from "@/icons";
import { useInfiniteStyles } from "@/hooks/useStyles";
import { useImportFitPreview } from "@/hooks/usePurchaseOrders";
import type {
  CreatePoProductInput,
  ImportFitOptions,
  PurchaseOrderDocumentItem,
  ProductColorItem,
} from "@/types/po";
import type { Style } from "@/types/style";
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

  // Mã/Tên/Danh mục có 2 bộ giá trị riêng cho từng chế độ — chọn Style tự
  // điền vào bộ của "select", gõ tay dùng bộ của "manual". Nhờ vậy chuyển
  // qua lại giữa 2 tab không bị "rò" giá trị của bên này sang bên kia, mà
  // mỗi bên vẫn giữ nguyên dữ liệu riêng khi quay lại.
  const [selectFields, setSelectFields] = useState({
    productCode: "",
    productName: "",
    category: "",
  });
  const [manualFields, setManualFields] = useState({
    productCode: "",
    productName: "",
    category: "",
  });
  const activeFields = mode === "select" ? selectFields : manualFields;
  const setActiveFields = mode === "select" ? setSelectFields : setManualFields;
  const productCode = activeFields.productCode;
  const productName = activeFields.productName;
  const category = activeFields.category;
  const setProductCode = (value: string) =>
    setActiveFields((f) => ({ ...f, productCode: value }));
  const setProductName = (value: string) =>
    setActiveFields((f) => ({ ...f, productName: value }));
  const setCategory = (value: string) =>
    setActiveFields((f) => ({ ...f, category: value }));

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
  const [fieldErrors, setFieldErrors] = useState<{
    productCode?: string;
    productName?: string;
    colors?: string;
  }>({});
  const productCodeInputRef = useRef<HTMLInputElement>(null);
  const productNameInputRef = useRef<HTMLInputElement>(null);
  const colorsCardRef = useRef<HTMLDivElement>(null);

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

  // Danh mục Style có thể lên tới hàng trăm/ngàn dòng — tải theo trang qua
  // ô tìm kiếm (SearchableSelect ở chế độ async) thay vì fetch hết một lần.
  const [styleSearch, setStyleSearch] = useState("");
  const {
    data: stylesPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isStylesLoading,
  } = useInfiniteStyles(styleSearch);
  const styleList = useMemo(
    () => stylesPages?.pages.flatMap((p) => p.data) ?? [],
    [stylesPages],
  );

  // Fetch preview data when sourceStyleId is selected
  const { data: fitPreview, isLoading: isPreviewLoading } = useImportFitPreview(
    mode === "select" && sourceStyleId ? sourceStyleId : undefined,
  );

  // Lưu riêng Style đã chọn (không chỉ dựa vào styleList): người dùng có thể
  // gõ tìm kiếm khác đi sau khi đã chọn, lúc đó Style đã chọn không còn nằm
  // trong trang kết quả hiện tại — nhưng phần tóm tắt vẫn phải hiển thị đúng.
  const [selectedSourceStyle, setSelectedSourceStyle] = useState<Style | null>(null);

  // Style đã chọn phải luôn có mặt trong danh sách hiển thị, kể cả khi nó
  // không nằm trong kết quả tìm kiếm hiện tại — nếu không, nút chọn sẽ hiện
  // lại placeholder dù đã chọn Style, chỉ vì người dùng gõ tìm kiếm khác đi.
  const styleOptions = useMemo(() => {
    const opts = styleList.map((s) => ({
      value: s.id,
      label: `${s.styleCode} - ${s.styleName}`,
      sublabel: s.category || undefined,
    }));
    if (selectedSourceStyle && !styleList.some((s) => s.id === selectedSourceStyle.id)) {
      opts.unshift({
        value: selectedSourceStyle.id,
        label: `${selectedSourceStyle.styleCode} - ${selectedSourceStyle.styleName}`,
        sublabel: selectedSourceStyle.category || undefined,
      });
    }
    return opts;
  }, [styleList, selectedSourceStyle]);

  const handleSelectStyle = (id: string) => {
    setSourceStyleId(id);
    const found = styleList.find((s) => s.id === id);
    if (found) {
      setSelectedSourceStyle(found);
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
    setMode("select");
    setSourceStyleId("");
    setSelectedSourceStyle(null);
    setStyleSearch("");
    setSelectFields({ productCode: "", productName: "", category: "" });
    setManualFields({ productCode: "", productName: "", category: "" });
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
    setFieldErrors({});
    setErrorMsg(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const validateStep1 = (): boolean => {
    setErrorMsg(null);

    const errors: typeof fieldErrors = {};
    if (!productCode.trim()) errors.productCode = "Mã sản phẩm không được để trống.";
    if (!productName.trim()) errors.productName = "Tên sản phẩm không được để trống.";

    const namedColors = colors.filter((c) => c.colorName.trim().length > 0);
    if (namedColors.length === 0) {
      errors.colors = "Vui lòng nhập ít nhất một màu sắc sản phẩm.";
    } else {
      const hasQuantity = namedColors.some((c) =>
        (c.sizes || []).some((s) => Number(s.quantity) > 0),
      );
      if (!hasQuantity) {
        errors.colors = "Vui lòng nhập số lượng (pcs) cho ít nhất một size — tổng sản lượng đang là 0.";
      }
    }

    setFieldErrors(errors);

    if (errors.productCode) {
      productCodeInputRef.current?.focus();
    } else if (errors.productName) {
      productNameInputRef.current?.focus();
    } else if (errors.colors) {
      colorsCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    return Object.keys(errors).length === 0;
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
      <div className="space-y-5">
        {/* Stepper Navigation: 3 Giai đoạn, cùng kiểu với PoCreateModal */}
        <div className="grid grid-cols-1 gap-2.5 border-b border-gray-200 pb-5 sm:grid-cols-3 dark:border-gray-800">
          {/* Step 1 */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-3 rounded-2xl p-3.5 text-left transition-all cursor-pointer border ${
              currentStep === 1
                ? "bg-brand-50/90 border-brand-300 text-brand-700 shadow-sm dark:bg-brand-950/50 dark:border-brand-700 dark:text-brand-300"
                : "bg-gray-50 border-gray-200/80 hover:bg-gray-100 hover:border-gray-300 text-gray-700 dark:bg-gray-800/60 dark:border-gray-800 dark:hover:bg-gray-800 dark:text-gray-300"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all ${
                currentStep === 1
                  ? "bg-brand-600 text-white shadow-sm"
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
              <div className="text-sm font-bold">Thông tin sản phẩm</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                Mã, tên SP, liên kết Mẫu Fit
              </div>
            </div>
          </button>

          {/* Step 2 */}
          <button
            type="button"
            onClick={handleNextToStep2}
            className={`flex items-center gap-3 rounded-2xl p-3.5 text-left transition-all cursor-pointer border ${
              currentStep === 2
                ? "bg-brand-50/90 border-brand-300 text-brand-700 shadow-sm dark:bg-brand-950/50 dark:border-brand-700 dark:text-brand-300"
                : "bg-gray-50 border-gray-200/80 hover:bg-gray-100 hover:border-gray-300 text-gray-700 dark:bg-gray-800/60 dark:border-gray-800 dark:hover:bg-gray-800 dark:text-gray-300"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all ${
                currentStep === 2
                  ? "bg-brand-600 text-white shadow-sm"
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
              <div className="text-sm font-bold">Gán tài liệu</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
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
            className={`flex items-center gap-3 rounded-2xl p-3.5 text-left transition-all cursor-pointer border ${
              currentStep === 3
                ? "bg-brand-50/90 border-brand-300 text-brand-700 shadow-sm dark:bg-brand-950/50 dark:border-brand-700 dark:text-brand-300"
                : "bg-gray-50 border-gray-200/80 hover:bg-gray-100 hover:border-gray-300 text-gray-700 dark:bg-gray-800/60 dark:border-gray-800 dark:hover:bg-gray-800 dark:text-gray-300"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all ${
                currentStep === 3
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              3
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold">Xác nhận</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                Kiểm tra & tạo sản phẩm
              </div>
            </div>
          </button>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="rounded-xl border border-error-200 bg-error-50 p-3.5 text-sm font-medium text-error-700 dark:border-error-900/40 dark:bg-error-950/30 dark:text-error-300">
            {errorMsg}
          </div>
        )}

        {/* ========================================================================= */}
        {/* GIAI ĐOẠN 1: THÔNG TIN SẢN PHẨM                                           */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-5">
            {/* Chọn nguồn tạo sản phẩm — 2 thẻ radio rõ ràng, không phải tab menu */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMode("select")}
                aria-pressed={mode === "select"}
                className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                  mode === "select"
                    ? "border-brand-400 bg-brand-50/70 shadow-xs dark:border-brand-600 dark:bg-brand-950/30"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800/60"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    mode === "select"
                      ? "border-brand-600"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {mode === "select" && (
                    <span className="h-2 w-2 rounded-full bg-brand-600" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-gray-900 dark:text-white">
                    Chọn từ Mẫu Fit có sẵn
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Khuyên dùng, kế thừa dữ liệu Fit
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode("manual")}
                aria-pressed={mode === "manual"}
                className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                  mode === "manual"
                    ? "border-brand-400 bg-brand-50/70 shadow-xs dark:border-brand-600 dark:bg-brand-950/30"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800/60"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    mode === "manual"
                      ? "border-brand-600"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {mode === "manual" && (
                    <span className="h-2 w-2 rounded-full bg-brand-600" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-gray-900 dark:text-white">
                    Nhập thủ công sản phẩm mới
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Tạo độc lập, không kế thừa dữ liệu
                  </span>
                </span>
              </button>
            </div>

            {/* If mode === select: Pick Source Style & View preview — card trắng riêng, rõ ràng như PoCreateModal */}
            {mode === "select" && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/60">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3.5">
                  Mẫu Fit nguồn
                </h3>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                    Chọn Mẫu Fit gốc <span className="text-error-500">*</span>
                  </label>
                  <SearchableSelect
                    value={sourceStyleId}
                    onChange={handleSelectStyle}
                    placeholder="-- Chọn một Mẫu Fit có sẵn --"
                    searchPlaceholder="Gõ mã hoặc tên để tìm..."
                    emptyMessage="Không tìm thấy Mẫu Fit phù hợp."
                    options={styleOptions}
                    async
                    onSearchChange={setStyleSearch}
                    isLoading={isStylesLoading}
                    isFetchingMore={isFetchingNextPage}
                    hasMore={Boolean(hasNextPage)}
                    onLoadMore={() => void fetchNextPage()}
                  />
                </div>

                {sourceStyleId && (
                  <div className="mt-4 space-y-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        Xem trước dữ liệu Fit sẽ import
                      </span>
                      {isPreviewLoading && (
                        <span className="text-xs font-medium text-brand-600 dark:text-brand-400 animate-pulse">
                          Đang phân tích cấu trúc dữ liệu Fit...
                        </span>
                      )}
                    </div>

                    {fitPreview && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
                          <span className="text-xl font-extrabold text-brand-600 dark:text-brand-400">
                            {fitPreview.operationSteps?.length || 0}
                          </span>
                          <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                            Bảng công đoạn
                          </span>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
                          <span className="text-xl font-extrabold text-brand-600 dark:text-brand-400">
                            {fitPreview.sampleRounds?.length || 0}
                          </span>
                          <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                            Đợt may mẫu
                          </span>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
                          <span className="text-xl font-extrabold text-brand-600 dark:text-brand-400">
                            {fitPreview.productionDocument ? "Có" : "Không"}
                          </span>
                          <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                            Tài liệu SX tiếng Việt
                          </span>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
                          <span className="text-xl font-extrabold text-brand-600 dark:text-brand-400">
                            {fitPreview.documents?.length || 0}
                          </span>
                          <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                            Tệp tài liệu từ Fit
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Selection Checkboxes for Style components — mỗi mục 1 hàng có viền riêng biệt */}
                    <div>
                      <span className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        Chọn dữ liệu cần sao chép:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <label
                          className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm cursor-pointer transition-colors ${
                            copySteps
                              ? "border-brand-300 bg-brand-50/60 text-gray-900 dark:border-brand-700 dark:bg-brand-950/30 dark:text-gray-100"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800/60"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={copySteps}
                            onChange={(e) => setCopySteps(e.target.checked)}
                            className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4 shrink-0"
                          />
                          <span className="font-medium">
                            Bảng công đoạn{" "}
                            <span className="text-gray-400 font-mono">
                              ({fitPreview?.operationSteps?.length || 0})
                            </span>
                          </span>
                        </label>

                        <label
                          className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm cursor-pointer transition-colors ${
                            copySamples
                              ? "border-brand-300 bg-brand-50/60 text-gray-900 dark:border-brand-700 dark:bg-brand-950/30 dark:text-gray-100"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800/60"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={copySamples}
                            onChange={(e) => setCopySamples(e.target.checked)}
                            className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4 shrink-0"
                          />
                          <span className="font-medium">
                            Đợt may mẫu & ảnh{" "}
                            <span className="text-gray-400 font-mono">
                              ({fitPreview?.sampleRounds?.length || 0})
                            </span>
                          </span>
                        </label>

                        <label
                          className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm cursor-pointer transition-colors ${
                            copyProductionDoc
                              ? "border-brand-300 bg-brand-50/60 text-gray-900 dark:border-brand-700 dark:bg-brand-950/30 dark:text-gray-100"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800/60"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={copyProductionDoc}
                            onChange={(e) => setCopyProductionDoc(e.target.checked)}
                            className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4 shrink-0"
                          />
                          <span className="font-medium">Tài liệu SX tiếng Việt</span>
                        </label>

                        <label
                          className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm cursor-pointer transition-colors ${
                            copyDocuments
                              ? "border-brand-300 bg-brand-50/60 text-gray-900 dark:border-brand-700 dark:bg-brand-950/30 dark:text-gray-100"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800/60"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={copyDocuments}
                            onChange={(e) => setCopyDocuments(e.target.checked)}
                            className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4 shrink-0"
                          />
                          <span className="font-medium">
                            Tài liệu đính kèm Mẫu Fit{" "}
                            <span className="text-gray-400 font-mono">
                              ({fitPreview?.documents?.length || 0})
                            </span>
                          </span>
                        </label>
                      </div>
                      <p className="mt-2.5 text-xs text-gray-500 dark:text-gray-400">
                        Dữ liệu được sao chép thành bản riêng của sản phẩm — sửa hoặc xóa sau này sẽ không ảnh hưởng Mẫu Fit nguồn.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Thông tin cơ bản — card trắng riêng, tách khỏi phần chọn Style */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/60">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3.5">
                Thông tin cơ bản
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Mã sản phẩm trong PO <span className="text-error-500">*</span>
                      </label>
                      {mode === "select" && (
                        <span className="text-xs text-gray-400">
                          (Độc lập, có thể chỉnh sửa)
                        </span>
                      )}
                    </div>
                    <input
                      ref={productCodeInputRef}
                      type="text"
                      placeholder="VD: PROD-2026-001"
                      value={productCode}
                      onChange={(e) => {
                        setProductCode(e.target.value);
                        if (fieldErrors.productCode) setFieldErrors((prev) => ({ ...prev, productCode: undefined }));
                      }}
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-sm font-mono text-gray-900 outline-none transition focus:ring-2 dark:bg-gray-800 dark:text-white ${
                        fieldErrors.productCode
                          ? "border-error-400 focus:border-error-500 focus:ring-error-500/20 dark:border-error-500"
                          : "border-gray-250 focus:border-brand-500 focus:ring-brand-500/20 dark:border-gray-800"
                      }`}
                    />
                    {fieldErrors.productCode && (
                      <p className="mt-1.5 text-xs font-medium text-error-600 dark:text-error-400">
                        {fieldErrors.productCode}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                      Tên sản phẩm <span className="text-error-500">*</span>
                    </label>
                    <input
                      ref={productNameInputRef}
                      type="text"
                      placeholder="VD: Áo thun Polo Regular"
                      value={productName}
                      onChange={(e) => {
                        setProductName(e.target.value);
                        if (fieldErrors.productName) setFieldErrors((prev) => ({ ...prev, productName: undefined }));
                      }}
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 dark:bg-gray-800 dark:text-white ${
                        fieldErrors.productName
                          ? "border-error-400 focus:border-error-500 focus:ring-error-500/20 dark:border-error-500"
                          : "border-gray-250 focus:border-brand-500 focus:ring-brand-500/20 dark:border-gray-800"
                      }`}
                    />
                    {fieldErrors.productName && (
                      <p className="mt-1.5 text-xs font-medium text-error-600 dark:text-error-400">
                        {fieldErrors.productName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                      Danh mục / Dòng sản phẩm
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Áo thun, Quần Khaki..."
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-gray-250 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                      Ghi chú chất liệu / Màu sắc
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Cotton 100%, Navy..."
                      value={materialNote}
                      onChange={(e) => setMaterialNote(e.target.value)}
                      className="w-full rounded-xl border border-gray-250 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="sm:w-1/2 sm:pr-2">
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                    Hạn giao (Deadline)
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker?.();
                      } catch {
                        /* ignore when unsupported */
                      }
                    }}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-xl border border-gray-250 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Màu sắc & Bảng phân bổ size breakdown — card trắng riêng */}
            <div
              ref={colorsCardRef}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/60"
            >
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3.5">
                Màu sắc &amp; Số lượng <span className="text-error-500">*</span>
              </h3>
              <ProductColorSizeEditor
                colors={colors}
                onChange={(next) => {
                  setColors(next);
                  if (fieldErrors.colors) setFieldErrors((prev) => ({ ...prev, colors: undefined }));
                }}
                allowMultipleColors={true}
                showValidationErrors={Boolean(fieldErrors.colors)}
              />
            </div>

            {/* Step 1 Footer */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" size="md" onClick={handleClose}>
                Hủy
              </Button>
              <Button size="md" type="button" onClick={handleNextToStep2}>
                Tiếp tục: Gán tài liệu →
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* GIAI ĐOẠN 2: GÁN TÀI LIỆU                                                 */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/60">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Gán tài liệu từ kho PO vào sản phẩm
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Tài liệu là không bắt buộc. Bạn có thể chọn ngay hoặc bổ sung sau.
                  </p>
                </div>
                <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-bold text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
                  Đã chọn: {selectedPoDocIds.length} / {poDocuments.length}
                </span>
              </div>

              {poDocuments.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-gray-200 p-8 text-center dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                  <DocsIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                    Đơn hàng PO hiện chưa có tài liệu nào trong kho.
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Bạn có thể bấm "Tiếp tục" để sang bước xác nhận tạo sản phẩm.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {/* Search & Filter Bar */}
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-250 bg-white px-3.5 py-2.5 dark:border-gray-800 dark:bg-gray-800">
                      <input
                        type="text"
                        placeholder="Tìm tài liệu theo tên hoặc mục đích..."
                        value={docSearch}
                        onChange={(e) => setDocSearch(e.target.value)}
                        className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none dark:text-white"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleSelectAllDocs}
                        className="text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 cursor-pointer"
                      >
                        Chọn tất cả
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={handleDeselectAllDocs}
                        className="text-sm font-semibold text-gray-600 hover:text-gray-800 dark:text-gray-400 cursor-pointer"
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
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                          docFilterPurpose === "ALL"
                            ? "bg-brand-600 text-white shadow-xs"
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
                            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                              docFilterPurpose === purp
                                ? "bg-brand-600 text-white shadow-xs"
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
                    className={`rounded-xl border p-3 transition-all ${
                      isDragOverDropzone
                        ? "border-2 border-brand-500 bg-brand-50/70 dark:bg-brand-950/40"
                        : "border-gray-200 bg-gray-50/40 dark:border-gray-800 dark:bg-gray-800/30"
                    }`}
                  >
                    {filteredPoDocs.length === 0 ? (
                      <p className="p-4 text-center text-sm text-gray-400 italic">
                        Không tìm thấy tài liệu phù hợp với bộ lọc.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                        {filteredPoDocs.map((doc) => {
                          const isChecked = selectedPoDocIds.includes(doc.documentId);
                          return (
                            <label
                              key={doc.documentId}
                              className={`flex items-center justify-between p-2.5 rounded-lg border text-sm cursor-pointer transition-all select-none ${
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
                              <span className="text-xs text-gray-400 uppercase shrink-0 font-mono">
                                {doc.purpose}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    <p className="mt-2 text-xs text-gray-400 text-center italic">
                      * Có thể kéo thả tệp tài liệu từ danh sách bên trái thả trực tiếp vào ô này.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2 Footer */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="md" onClick={() => setCurrentStep(1)}>
                ← Quay lại: Thông tin sản phẩm
              </Button>
              <Button size="md" type="button" onClick={handleNextToStep3}>
                Tiếp tục: Xác nhận →
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* GIAI ĐOẠN 3: XÁC NHẬN & HOÀN TẤT                                          */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/60">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Xác nhận thông tin sản phẩm sẽ thêm vào PO
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Vui lòng kiểm tra lại thông số trước khi tiến hành khởi tạo bản ghi độc lập.
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Product Basics */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/60">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Thông tin cơ bản
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 cursor-pointer"
                  >
                    Sửa
                  </button>
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500 dark:text-gray-400">Mã sản phẩm</dt>
                    <dd className="font-mono font-bold text-brand-600 dark:text-brand-400 truncate">
                      {productCode}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500 dark:text-gray-400">Tên sản phẩm</dt>
                    <dd className="font-semibold text-gray-900 dark:text-white truncate">
                      {productName}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500 dark:text-gray-400">Danh mục</dt>
                    <dd className="text-gray-700 dark:text-gray-300">{category || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500 dark:text-gray-400">Hạn giao</dt>
                    <dd className="text-gray-700 dark:text-gray-300">
                      {deadline || "Chưa thiết lập"}
                    </dd>
                  </div>
                  {materialNote && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500 dark:text-gray-400">Chất liệu / Màu</dt>
                      <dd className="text-gray-700 dark:text-gray-300 truncate max-w-[60%]">
                        {materialNote}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Card 2: Colors & quantity */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/60">
                <span className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                  Màu sắc &amp; Tổng sản lượng ({calcTotalFromColors(colors).toLocaleString("vi-VN")} pcs)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {colors.filter((c) => c.colorName.trim()).length === 0 ? (
                    <span className="text-sm text-gray-400 italic">Chưa đặt tên màu</span>
                  ) : (
                    colors
                      .filter((c) => c.colorName.trim())
                      .map((c) => (
                        <span
                          key={c.id || c.colorName}
                          className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-2.5 py-1 text-sm font-semibold text-brand-700 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300"
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

              {/* Card 3: Source & cloned data */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/60 sm:col-span-2">
                <span className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                  Liên kết Mẫu Fit nguồn
                </span>
                {mode === "select" && sourceStyleId ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-brand-100 px-2 py-1 text-xs font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                        {selectedSourceStyle?.styleCode || "Fit Style"}
                      </span>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {selectedSourceStyle?.styleName}
                      </span>
                    </div>

                    <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <dt className="text-gray-500 dark:text-gray-400">Bảng công đoạn</dt>
                        <dd className={copySteps ? "font-semibold text-emerald-600" : "text-gray-400"}>
                          {copySteps ? `Sao chép (${fitPreview?.operationSteps?.length || 0})` : "Bỏ qua"}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-gray-500 dark:text-gray-400">Đợt may mẫu & ảnh</dt>
                        <dd className={copySamples ? "font-semibold text-emerald-600" : "text-gray-400"}>
                          {copySamples ? `Sao chép (${fitPreview?.sampleRounds?.length || 0})` : "Bỏ qua"}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-gray-500 dark:text-gray-400">Tài liệu SX tiếng Việt</dt>
                        <dd className={copyProductionDoc ? "font-semibold text-emerald-600" : "text-gray-400"}>
                          {copyProductionDoc ? "Sao chép" : "Bỏ qua"}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-gray-500 dark:text-gray-400">Tài liệu đính kèm Mẫu Fit</dt>
                        <dd className={copyDocuments ? "font-semibold text-emerald-600" : "text-gray-400"}>
                          {copyDocuments ? `Sao chép (${fitPreview?.documents?.length || 0})` : "Bỏ qua"}
                        </dd>
                      </div>
                    </dl>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Mục được đánh dấu "Sao chép" sẽ trở thành bản riêng của sản phẩm — Mẫu Fit nguồn không bị ảnh hưởng.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    Tạo sản phẩm độc lập (Không kế thừa dữ liệu từ Fit).
                  </p>
                )}
              </div>
            </div>

            {/* Tài liệu PO gán kèm */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/60">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Tài liệu PO gán kèm ({selectedPoDocIds.length})
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 cursor-pointer"
                >
                  Thay đổi
                </button>
              </div>

              {selectedPoDocIds.length === 0 ? (
                <p className="text-sm text-gray-400 italic">
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
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        <FileIcon className="h-3.5 w-3.5 text-gray-400" />
                        <span className="font-medium max-w-[150px] truncate">
                          {doc.title || doc.fileName || doc.documentCode}
                        </span>
                        <span className="uppercase font-mono text-gray-400 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                          {doc.purpose}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 3 Footer */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="md" onClick={() => setCurrentStep(2)} disabled={isPending}>
                ← Quay lại: Gán tài liệu
              </Button>
              <Button size="md" type="button" onClick={() => handleSubmit()} disabled={isPending}>
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
