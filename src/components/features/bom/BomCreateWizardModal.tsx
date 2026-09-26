import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "@/components/shared/Modal";
import { SearchableSelect } from "@/components/shared/SearchableSelect";
import { useCreateBom, useMultiPoBoms } from "@/hooks/useBoms";
import { useStyles } from "@/hooks/useStyles";
import { usePurchaseOrders, useMultiPoProducts } from "@/hooks/usePurchaseOrders";
import { useToast } from "@/hooks/useToast";
import { getApiError, isConflictError } from "@/lib/apiError";
import type { BomType } from "@/types/bom";
import {
  Shirt,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Search,
  Package,
  X,
  ChevronDown,
  ChevronRight,
  Info,
  ListFilter,
  Pencil,
  Check,
  Calendar,
  Clock,
  FileText,
} from "lucide-react";

interface WizardProduct {
  id: string;
  productCode?: string;
  productName?: string;
  structureImageUrl?: string;
  colors?: Array<string | { colorName?: string }>;
  sizes?: string[];
  totalQuantity?: number;
}

interface BomCreateWizardModalProps {
  open: boolean;
  onClose: () => void;
}

type WizardStep = 1 | 2 | 3;

export function BomCreateWizardModal({ open, onClose }: BomCreateWizardModalProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const createBomMutation = useCreateBom();

  // Wizard step state
  const [step, setStep] = useState<WizardStep>(1);

  // Form selections - default is PO BOM as requested
  const [bomType, setBomType] = useState<BomType>("po");
  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>([]);
  const [styleSearch, setStyleSearch] = useState<string>("");
  const [selectedPoIds, setSelectedPoIds] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState<string>("");
  type DeadlineMode = "common" | "per_po";
  const [deadlineMode, setDeadlineMode] = useState<DeadlineMode>("common");
  const [deadline, setDeadline] = useState<string>("");
  const [poDeadlines, setPoDeadlines] = useState<Record<string, string>>({});
  const [rdNote, setRdNote] = useState<string>("");
  const [isEditingDeadline, setIsEditingDeadline] = useState<boolean>(false);
  const [isEditingNote, setIsEditingNote] = useState<boolean>(false);

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    if (dateStr.includes("T")) {
      const [datePart, timePart] = dateStr.split("T");
      const [y, m, d] = datePart.split("-");
      const time = timePart ? timePart.slice(0, 5) : "";
      if (time && y && m && d) {
        return `${time} • ${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
      }
    }
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[0]}`;
    }
    return dateStr;
  };

  // PO search & dropdown states in Box 1
  const [poSearchQuery, setPoSearchQuery] = useState<string>("");
  const [isPoDropdownOpen, setIsPoDropdownOpen] = useState<boolean>(false);
  const poDropdownRef = useRef<HTMLDivElement>(null);
  const poSearchInputRef = useRef<HTMLInputElement>(null);

  // Track user-toggled PO accordions (explicitly expanded or collapsed)
  const [userToggledPoIds, setUserToggledPoIds] = useState<Record<string, boolean>>({});
  const [onlyAvailableFilter, setOnlyAvailableFilter] = useState<boolean>(false);

  // Error state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Close PO dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (poDropdownRef.current && !poDropdownRef.current.contains(event.target as Node)) {
        setIsPoDropdownOpen(false);
      }
    }
    if (isPoDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPoDropdownOpen]);

  // Query Styles for FIT BOM
  const { data: stylesData, isLoading: isLoadingStyles } = useStyles({
    limit: 100,
  });

  const allStyles = useMemo(() => stylesData?.data ?? [], [stylesData]);

  const filteredStyles = useMemo(() => {
    const q = styleSearch.trim().toLowerCase();
    if (!q) return allStyles;
    return allStyles.filter(
      (s) =>
        s.styleCode.toLowerCase().includes(q) ||
        (s.styleName && s.styleName.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q)),
    );
  }, [allStyles, styleSearch]);

  const selectedStyles = useMemo(() => {
    return allStyles.filter((s) => selectedStyleIds.includes(s.id));
  }, [allStyles, selectedStyleIds]);

  const selectedStyleId = selectedStyleIds[0] || "";

  const toggleStyle = (styleId: string) => {
    setSelectedStyleIds((prev) =>
      prev.includes(styleId) ? prev.filter((id) => id !== styleId) : [...prev, styleId],
    );
  };

  const handleSelectAllStyles = () => {
    if (
      selectedStyleIds.length === filteredStyles.length &&
      filteredStyles.length > 0
    ) {
      setSelectedStyleIds([]);
    } else {
      setSelectedStyleIds(filteredStyles.map((s) => s.id));
    }
  };

  const styleOptions = useMemo(() => {
    return allStyles.map((s) => ({
      value: s.id,
      label: s.styleCode,
      sublabel: s.styleName,
    }));
  }, [allStyles]);

  // Query Purchase Orders for PO BOM
  const { data: posData, isLoading: isLoadingPos } = usePurchaseOrders({
    limit: 100,
  });

  const allPos = useMemo(() => posData?.items ?? [], [posData]);

  // Filtered POs in Box 1 dropdown
  const filteredPosInDropdown = useMemo(() => {
    const q = poSearchQuery.trim().toLowerCase();
    if (!q) return allPos;
    return allPos.filter(
      (po) =>
        po.poCode.toLowerCase().includes(q) ||
        (po.customerNameSnapshot && po.customerNameSnapshot.toLowerCase().includes(q)),
    );
  }, [allPos, poSearchQuery]);

  // Query Products of all selected POs in parallel
  const poProductsQueries = useMultiPoProducts(selectedPoIds, { limit: 100 });

  // Query existing BOMs of all selected POs in parallel to filter out products that already have a BOM
  const poBomsQueries = useMultiPoBoms(selectedPoIds);

  const isLoadingProductsOrBoms = useMemo(() => {
    return (
      poProductsQueries.some((q) => q.isLoading) ||
      poBomsQueries.some((q) => q.isLoading)
    );
  }, [poProductsQueries, poBomsQueries]);

  // Group products by PO with strict filtering (no products that already have BOMs)
  const poGroups = useMemo(() => {
    return selectedPoIds.map((poId, idx) => {
      const po = allPos.find((p) => p.id === poId);
      const productsData = poProductsQueries[idx]?.data;
      const bomsData = poBomsQueries[idx]?.data;

      // Extract existing product IDs that already have a BOM for this PO
      const existingBomProductIds = new Set<string>();
      const list =
        (bomsData as { data?: Array<{ product?: { id?: string }; purchaseOrderProductId?: string }> })?.data ||
        (bomsData as { items?: Array<{ product?: { id?: string }; purchaseOrderProductId?: string }> })?.items ||
        [];
      if (Array.isArray(list)) {
        for (const item of list) {
          if (item.product?.id) existingBomProductIds.add(item.product.id);
          if (item.purchaseOrderProductId) existingBomProductIds.add(item.purchaseOrderProductId);
        }
      }

      const allProducts: WizardProduct[] =
        (productsData as { items?: WizardProduct[] })?.items ??
        (productsData as { data?: WizardProduct[] })?.data ??
        [];
      // Available products: ONLY products that DO NOT have a BOM yet
      const availableProducts = allProducts.filter((p: WizardProduct) => !existingBomProductIds.has(p.id));

      const q = productSearch.trim().toLowerCase();
      const filteredProducts = q
        ? availableProducts.filter(
            (p: WizardProduct) =>
              p.productCode?.toLowerCase().includes(q) ||
              p.productName?.toLowerCase().includes(q),
          )
        : availableProducts;

      return {
        poId,
        po,
        allProducts,
        availableProducts,
        filteredProducts,
        hasBomsCount: existingBomProductIds.size,
      };
    });
  }, [selectedPoIds, allPos, poProductsQueries, poBomsQueries, productSearch]);

  const visiblePoGroups = useMemo(() => {
    if (!onlyAvailableFilter) return poGroups;
    return poGroups.filter((g) => g.availableProducts.length > 0);
  }, [poGroups, onlyAvailableFilter]);

  const totalAvailableProducts = useMemo(() => {
    return poGroups.reduce((acc, g) => acc + g.availableProducts.length, 0);
  }, [poGroups]);

  const allAvailableProductIds = useMemo(() => {
    return poGroups.flatMap((g) => g.availableProducts.map((p) => p.id));
  }, [poGroups]);

  const totalAllProducts = useMemo(() => {
    return poGroups.reduce((acc, g) => acc + g.allProducts.length, 0);
  }, [poGroups]);

  // Toggle single PO selection
  const togglePo = (poId: string) => {
    setSelectedPoIds((prev) => {
      if (prev.includes(poId)) {
        // Remove PO and clean up its products from selectedProductIds
        const group = poGroups.find((g) => g.poId === poId);
        if (group) {
          const removeIds = new Set(group.allProducts.map((p) => p.id));
          setSelectedProductIds((curr) => curr.filter((id) => !removeIds.has(id)));
        }
        return prev.filter((id) => id !== poId);
      } else {
        return [...prev, poId];
      }
    });
  };

  // Toggle select/deselect all POs
  const toggleSelectAllPos = () => {
    if (selectedPoIds.length === allPos.length && selectedPoIds.length > 0) {
      setSelectedPoIds([]);
      setSelectedProductIds([]);
    } else {
      setSelectedPoIds(allPos.map((po) => po.id));
    }
  };

  // Toggle accordion expand/collapse
  const toggleExpandPo = (poId: string, currentExpanded: boolean) => {
    setUserToggledPoIds((prev) => ({
      ...prev,
      [poId]: !currentExpanded,
    }));
  };

  // Toggle single product selection
  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id],
    );
  };

  // Global select/deselect all available products across all selected POs
  const handleSelectAllProducts = () => {
    if (
      selectedProductIds.length === allAvailableProductIds.length &&
      allAvailableProductIds.length > 0
    ) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(allAvailableProductIds);
    }
  };

  // Group select/deselect all available products for a specific PO
  const togglePoGroupProducts = (groupProductIds: string[]) => {
    const isAllSelected = groupProductIds.every((id) => selectedProductIds.includes(id));
    if (isAllSelected) {
      setSelectedProductIds((prev) => prev.filter((id) => !groupProductIds.includes(id)));
    } else {
      setSelectedProductIds((prev) => Array.from(new Set([...prev, ...groupProductIds])));
    }
  };

  // Selected Products with PO info for review in Step 3
  const selectedProductsWithDetails = useMemo(() => {
    const list: { product: WizardProduct; poCode: string; poCustomer?: string; poId: string }[] = [];
    for (const g of poGroups) {
      for (const p of g.allProducts) {
        if (selectedProductIds.includes(p.id)) {
          list.push({
            product: p,
            poCode: g.po?.poCode || g.poId,
            poCustomer: g.po?.customerNameSnapshot,
            poId: g.poId,
          });
        }
      }
    }
    return list;
  }, [poGroups, selectedProductIds]);

  const resetForm = () => {
    setStep(1);
    setBomType("po");
    setSelectedStyleIds([]);
    setStyleSearch("");
    setSelectedPoIds([]);
    setSelectedProductIds([]);
    setProductSearch("");
    setPoSearchQuery("");
    setIsPoDropdownOpen(false);
    setUserToggledPoIds({});
    setOnlyAvailableFilter(false);
    setDeadlineMode("common");
    setDeadline("");
    setPoDeadlines({});
    setRdNote("");
    setIsEditingDeadline(false);
    setIsEditingNote(false);
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleNext = () => {
    setErrorMessage(null);
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (bomType === "fit" && selectedStyleIds.length === 0) {
        setErrorMessage("Vui lòng chọn Mẫu Fit.");
        return;
      }
      if (bomType === "po") {
        if (selectedPoIds.length === 0) {
          setErrorMessage("Vui lòng chọn Đơn hàng PO.");
          return;
        }
        if (selectedProductIds.length === 0) {
          setErrorMessage("Vui lòng chọn ít nhất một sản phẩm thuộc đơn hàng PO.");
          return;
        }
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    if (step > 1) {
      setStep((prev) => (prev - 1) as WizardStep);
    }
  };

  const handleSubmit = async () => {
    setErrorMessage(null);

    try {
      if (bomType === "fit") {
        if (selectedStyleIds.length === 0) {
          setErrorMessage("Vui lòng chọn ít nhất một Mẫu Fit.");
          return;
        }

        if (selectedStyleIds.length === 1) {
          const created = await createBomMutation.mutateAsync({
            type: "fit",
            styleId: selectedStyleIds[0],
            deadline: deadline || undefined,
            rdNote: rdNote.trim() || undefined,
          });

          showToast(`Đã tạo BOM ${created.bomCode} thành công.`);
          handleClose();
          navigate(`/bom/${created.id}`);
        } else {
          const failedIds: string[] = [];
          const succeededCodes: string[] = [];
          const failures: string[] = [];
          for (const styleId of selectedStyleIds) {
            const styleCode = selectedStyles.find((style) => style.id === styleId)?.styleCode || styleId;
            try {
              const created = await createBomMutation.mutateAsync({
                type: "fit",
                styleId,
                deadline: deadline || undefined,
                rdNote: rdNote.trim() || undefined,
              });
              succeededCodes.push(`${styleCode} → ${created.bomCode}`);
            } catch (err: unknown) {
              failedIds.push(styleId);
              failures.push(`${styleCode}: ${getApiError(err, "Không thể tạo BOM").message}`);
            }
          }

          if (failures.length > 0) {
            setSelectedStyleIds(failedIds);
            setErrorMessage(
              `Đã tạo ${succeededCodes.length}/${selectedStyleIds.length} BOM.\n${succeededCodes.length ? `Thành công: ${succeededCodes.join("; ")}\n` : ""}Thất bại: ${failures.join("; ")}\nChỉ còn giữ các mục thất bại để bạn có thể thử lại.`,
            );
            return;
          }

          showToast(
            `Đã tạo thành công ${succeededCodes.length} bảng BOM cho các Mẫu Fit.`,
          );
          handleClose();
        }
      } else {
        if (selectedProductIds.length === 0) {
          setErrorMessage("Vui lòng chọn ít nhất một sản phẩm.");
          return;
        }

        // Create BOMs for all selected products across all selected POs
        const failedIds: string[] = [];
        const succeededCodes: string[] = [];
        const succeededIds: string[] = [];
        const failures: string[] = [];
        for (const productId of selectedProductIds) {
            const item = selectedProductsWithDetails.find((d) => d.product.id === productId);
            const poId = item?.poId || selectedPoIds[0];
            const productDeadline =
              deadlineMode === "per_po" && poId && poDeadlines[poId]
                ? poDeadlines[poId]
                : deadline || undefined;

            const productCode = item?.product.productCode || productId;
            try {
              const created = await createBomMutation.mutateAsync({
                type: "po",
                purchaseOrderProductId: productId,
                deadline: productDeadline,
                rdNote: rdNote.trim() || undefined,
              });
              succeededCodes.push(`${productCode} → ${created.bomCode}`);
              succeededIds.push(created.id);
            } catch (err: unknown) {
              failedIds.push(productId);
              failures.push(`${productCode}: ${getApiError(err, "Không thể tạo BOM").message}`);
            }
        }

        if (failures.length > 0) {
          setSelectedProductIds(failedIds);
          setErrorMessage(
            `Đã tạo ${succeededCodes.length}/${selectedProductIds.length} BOM.\n${succeededCodes.length ? `Thành công: ${succeededCodes.join("; ")}\n` : ""}Thất bại: ${failures.join("; ")}\nChỉ còn giữ các mục thất bại để bạn có thể thử lại.`,
          );
          return;
        }

        if (selectedProductIds.length === 1) {
          const codeSeparator = succeededCodes[0].indexOf(" → ");
          showToast(`Đã tạo BOM ${succeededCodes[0].slice(codeSeparator + 3)} thành công.`);
          handleClose();
          navigate(`/bom/${succeededIds[0]}`);
        } else {
          showToast(
            `Đã tạo thành công ${succeededCodes.length} bảng BOM cho ${selectedPoIds.length} đơn hàng PO.`,
          );
          handleClose();
        }
      }
    } catch (err: unknown) {
      if (isConflictError(err)) {
        if (bomType === "fit") {
          setErrorMessage("Mẫu Fit này đã có BOM. Mỗi Style chỉ có tối đa 1 Fit BOM.");
        } else {
          setErrorMessage("Một hoặc nhiều sản phẩm đã có BOM trong hệ thống.");
        }
      } else {
        const parsedError = getApiError(err, "Có lỗi xảy ra khi tạo BOM. Vui lòng thử lại.");
        setErrorMessage(parsedError.message);
      }
    }
  };

  return (
    <Modal
      open={open}
      title={step === 3 ? "Xác nhận tạo BOM" : "Tạo mới Định mức Nguyên phụ liệu (BOM)"}
      subtitle={step === 3 ? "Vui lòng kiểm tra lại thông tin trước khi tạo." : undefined}
      size="lg"
      onClose={handleClose}
      closeDisabled={createBomMutation.isPending}
      closeOnClickOutside={false}
      footer={
        <div className="flex w-full items-center justify-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={createBomMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={createBomMutation.isPending}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Hủy
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={
                  (step === 2 &&
                    bomType === "po" &&
                    selectedPoIds.length > 0 &&
                    totalAvailableProducts === 0) ||
                  (step === 2 &&
                    bomType === "fit" &&
                    allStyles.length > 0 &&
                    filteredStyles.length === 0 &&
                    selectedStyleIds.length === 0)
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-600 disabled:opacity-50"
              >
                Tiếp tục
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={createBomMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-600 disabled:opacity-50"
              >
                {createBomMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tạo BOM...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 stroke-[2.5]" />
                    {bomType === "po" && selectedProductIds.length > 1
                      ? `Xác nhận tạo ${selectedProductIds.length} BOM`
                      : bomType === "fit" && selectedStyles.length > 1
                        ? `Xác nhận tạo ${selectedStyles.length} BOM`
                        : "Xác nhận tạo BOM"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Modern Stepper matching Mockup */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 text-xs dark:border-gray-800">
          <div
            onClick={() => step > 1 && setStep(1)}
            className={`flex items-center gap-2 ${step > 1 ? "cursor-pointer hover:opacity-80" : ""}`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all ${
                step >= 1
                  ? "bg-brand-500 text-white shadow-xs"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              1
            </span>
            <span
              className={
                step >= 1
                  ? "font-bold text-gray-900 dark:text-white"
                  : "font-medium text-gray-400 dark:text-gray-500"
              }
            >
              Chọn loại BOM
            </span>
          </div>

          <div
            className={`mx-3 h-0.5 flex-1 transition-colors ${
              step >= 2 ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-800"
            }`}
          />

          <div
            onClick={() => step > 2 && setStep(2)}
            className={`flex items-center gap-2 ${step > 2 ? "cursor-pointer hover:opacity-80" : ""}`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all ${
                step >= 2
                  ? "bg-brand-500 text-white shadow-xs"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              2
            </span>
            <span
              className={
                step >= 2
                  ? "font-bold text-gray-900 dark:text-white"
                  : "font-medium text-gray-400 dark:text-gray-500"
              }
            >
              Chọn đối tượng
            </span>
          </div>

          <div
            className={`mx-3 h-0.5 flex-1 transition-colors ${
              step >= 3 ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-800"
            }`}
          />

          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all ${
                step >= 3
                  ? "bg-brand-500 text-white shadow-xs"
                  : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
              }`}
            >
              3
            </span>
            <span
              className={
                step >= 3
                  ? "font-bold text-gray-900 dark:text-white"
                  : "font-medium text-gray-400 dark:text-gray-500"
              }
            >
              Xác nhận
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-start gap-2 whitespace-pre-line rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Select BOM Type (PO BOM is default) */}
        {step === 1 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Vui lòng chọn loại Định mức BOM cần thiết lập (Mặc định: PO BOM):
            </p>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {/* Option PO BOM (Default & Primary) */}
              <button
                type="button"
                onClick={() => setBomType("po")}
                className={`flex flex-col items-start gap-2.5 rounded-2xl border p-4 text-left transition-all ${
                  bomType === "po"
                    ? "border-brand-500 bg-brand-50/60 shadow-xs ring-2 ring-brand-500/20 dark:bg-brand-950/30"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      PO BOM (Sản phẩm Đơn hàng)
                    </h4>
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
                      Mặc định
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Áp dụng theo từng sản phẩm của đơn hàng PO. Hỗ trợ chọn nhiều PO và nhiều sản phẩm cùng lúc.
                  </p>
                </div>
              </button>

              {/* Option FIT BOM */}
              <button
                type="button"
                onClick={() => setBomType("fit")}
                className={`flex flex-col items-start gap-2.5 rounded-2xl border p-4 text-left transition-all ${
                  bomType === "fit"
                    ? "border-[#6370A0] bg-[#EEF2FF]/60 shadow-xs ring-2 ring-[#6370A0]/20 dark:bg-slate-800/60"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#6370A0] dark:bg-slate-700">
                  <Shirt className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    FIT BOM (Mẫu Fit)
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Áp dụng cho mẫu chuẩn kỹ thuật (Style). Mỗi Style chỉ có tối đa 1 bảng Fit BOM.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Select Owner (FIT BOM) - Multi-Style Selection similar to PO Product */}
        {step === 2 && bomType === "fit" && (
          <div className="flex flex-col gap-3.5">
            <div className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
              {/* Box Header */}
              <div className="mb-2.5 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                    1
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Chọn Mẫu Fit (Style) <span className="text-rose-500">*</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Tìm kiếm và chọn các mẫu Fit chuẩn kỹ thuật để tạo BOM.
                    </p>
                  </div>
                </div>

                {allStyles.length > 1 && (
                  <button
                    type="button"
                    onClick={handleSelectAllStyles}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400 shrink-0"
                  >
                    {selectedStyleIds.length === filteredStyles.length && filteredStyles.length > 0
                      ? "Bỏ chọn tất cả"
                      : `Chọn tất cả (${filteredStyles.length})`}
                  </button>
                )}
              </div>

              {/* Quick Select & Test Compatibility */}
              <div className="mb-3">
                <p className="mb-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Tìm kiếm theo mã Style hoặc tên Style chuẩn:
                </p>
                <SearchableSelect
                  value={selectedStyleId}
                  onChange={(val) => {
                    if (val) {
                      setSelectedStyleIds((prev) =>
                        prev.includes(val) ? prev : [...prev, val],
                      );
                    }
                  }}
                  options={styleOptions}
                  placeholder="-- Chọn Mẫu Fit (Style) --"
                  searchPlaceholder="Gõ mã Style hoặc tên Style..."
                  disabled={isLoadingStyles}
                />
              </div>

              {/* Search & Selection Counter */}
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={styleSearch}
                    onChange={(e) => setStyleSearch(e.target.value)}
                    placeholder="Lọc danh sách mẫu Fit bên dưới..."
                    className="w-full rounded-xl border border-gray-250 bg-white py-1.5 pl-9 pr-8 text-xs text-gray-800 placeholder:text-gray-400 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200"
                  />
                  {styleSearch && (
                    <button
                      type="button"
                      onClick={() => setStyleSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 shrink-0">
                  <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    Đã chọn {selectedStyleIds.length} / {allStyles.length} mẫu Fit
                  </span>
                </div>
              </div>

              {/* List of Style Cards with Checkboxes */}
              <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
                {isLoadingStyles ? (
                  <div className="flex items-center justify-center p-8 text-xs text-gray-400">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-brand-500" />
                    Đang tải danh sách mẫu Fit...
                  </div>
                ) : filteredStyles.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-400 dark:border-gray-800">
                    {styleSearch
                      ? `Không tìm thấy mẫu Fit nào khớp với từ khóa "${styleSearch}".`
                      : "Chưa có dữ liệu Mẫu Fit."}
                  </div>
                ) : (
                  filteredStyles.map((style) => {
                    const isSelected = selectedStyleIds.includes(style.id);
                    return (
                      <div
                        key={style.id}
                        onClick={() => toggleStyle(style.id)}
                        className={`flex cursor-pointer items-center justify-between rounded-xl p-2.5 transition-all ${
                          isSelected
                            ? "border-2 border-brand-500 bg-brand-50/50 shadow-xs ring-1 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-950/30"
                            : "border border-gray-200/90 bg-white hover:border-gray-300 hover:bg-gray-50/70 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleStyle(style.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4.5 w-4.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                            aria-label={`Chọn mẫu ${style.styleCode}`}
                          />

                          {/* Style Thumbnail */}
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200/80 bg-gray-100/80 dark:border-gray-700 dark:bg-gray-800">
                            <Shirt className="h-5 w-5 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
                          </div>

                          {/* Style Code & Details */}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                                {style.styleCode}
                              </span>
                              {style.styleName && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {style.styleName}
                                  </span>
                                </>
                              )}
                            </div>
                            {style.category && (
                              <div className="mt-1 flex items-center gap-1">
                                <span className="rounded-md border border-gray-200/70 bg-gray-100/90 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                  {style.category}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Informational footer note */}
              <div className="mt-3 flex items-center gap-2 pt-2 border-t border-gray-100 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <Info className="h-4 w-4 shrink-0 text-gray-400" />
                <span>
                  Mỗi Mẫu Fit được chọn sẽ được tạo một bảng FIT BOM riêng làm tiêu chuẩn kỹ thuật.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Select Owner (PO BOM) - Matches Mockup 100% */}
        {step === 2 && bomType === "po" && (
          <div className="flex flex-col gap-3.5">
            {/* BOX 1: Chọn Đơn hàng PO */}
            <div className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
              {/* Box 1 Header */}
              <div className="mb-2.5 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                    1
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Chọn Đơn hàng PO <span className="text-rose-500">*</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Tìm kiếm và chọn đơn hàng PO để tạo BOM.
                    </p>
                  </div>
                </div>

                {allPos.length > 1 && (
                  <button
                    type="button"
                    onClick={toggleSelectAllPos}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400 shrink-0"
                  >
                    {selectedPoIds.length === allPos.length
                      ? "Bỏ chọn toàn bộ PO"
                      : `Chọn toàn bộ PO (${allPos.length})`}
                  </button>
                )}
              </div>

              {/* Box 1 PO Search & Dropdown Picker */}
              <div ref={poDropdownRef} className="relative">
                <div
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-gray-250 bg-white px-3.5 py-2 text-xs text-gray-800 shadow-xs focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200"
                  onClick={() => {
                    setIsPoDropdownOpen((prev) => !prev);
                    poSearchInputRef.current?.focus();
                  }}
                >
                  <div className="flex flex-1 items-center gap-2">
                    <Search className="h-4 w-4 shrink-0 text-gray-400" />
                    {/* Screen reader text ensures test compatibility with -- Chọn Đơn hàng PO -- */}
                    <span className="sr-only">-- Chọn Đơn hàng PO --</span>
                    <input
                      ref={poSearchInputRef}
                      type="text"
                      value={poSearchQuery}
                      onChange={(e) => {
                        setPoSearchQuery(e.target.value);
                        setIsPoDropdownOpen(true);
                      }}
                      onFocus={() => setIsPoDropdownOpen(true)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPoDropdownOpen(true);
                      }}
                      placeholder="Tìm kiếm đơn hàng PO (mã PO, tên đối tác...)"
                      aria-label="-- Chọn Đơn hàng PO --"
                      className="w-full bg-transparent text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none dark:text-gray-200"
                      disabled={isLoadingPos}
                    />
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
                      isPoDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {/* PO Dropdown Popover */}
                {isPoDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                    {isLoadingPos ? (
                      <div className="flex items-center justify-center p-4 text-xs text-gray-400">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-brand-500" />
                        Đang tải danh sách đơn hàng...
                      </div>
                    ) : filteredPosInDropdown.length === 0 ? (
                      <div className="p-3 text-center text-xs text-gray-400">
                        Không tìm thấy đơn hàng PO nào phù hợp.
                      </div>
                    ) : (
                      filteredPosInDropdown.map((po) => {
                        const isSelected = selectedPoIds.includes(po.id);
                        return (
                          <div
                            key={po.id}
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => togglePo(po.id)}
                            className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors ${
                              isSelected
                                ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                                : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/60"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => togglePo(po.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                aria-label={`Chọn PO ${po.poCode}`}
                              />
                              <div>
                                <span className="font-mono font-bold">{po.poCode}</span>
                                {po.customerNameSnapshot && (
                                  <span className="ml-1.5 text-gray-500 dark:text-gray-400">
                                    • {po.customerNameSnapshot}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                                ✓ Đã chọn
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Box 1 Selected Chips */}
              {selectedPoIds.length > 0 && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-2 dark:border-gray-800">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Đã chọn ({selectedPoIds.length})
                  </span>
                  {selectedPoIds.map((id) => {
                    const po = allPos.find((p) => p.id === id);
                    const code = po?.poCode || id;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200/80 bg-blue-50/80 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300"
                      >
                        <span>{code}</span>
                        <button
                          type="button"
                          onClick={() => togglePo(id)}
                          className="rounded-full p-0.5 text-blue-500 hover:bg-blue-200/60 hover:text-blue-800 dark:hover:bg-blue-900 dark:hover:text-blue-200"
                          aria-label={`Bỏ chọn PO ${code}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* BOX 2: Chọn sản phẩm chưa có BOM (Luôn hiển thị ổn định theo Mockup) */}
            <div className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
              {/* Box 2 Header & Toolbar */}
              <div className="mb-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                    2
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        Chọn sản phẩm chưa có BOM <span className="text-rose-500">*</span>
                      </h3>
                      {selectedPoIds.length > 0 && (
                        <span className="rounded-full border border-blue-200/80 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300">
                          Đã chọn {selectedProductIds.length} / {totalAvailableProducts}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Chọn sản phẩm thuộc các đơn hàng đã chọn và chưa có BOM.
                    </p>
                  </div>
                </div>

                {/* Right Toolbar: Search & Filter (Only when POs are selected) */}
                {selectedPoIds.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="relative w-40 sm:w-48">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Tìm sản phẩm..."
                        className="w-full rounded-xl border border-gray-200/90 bg-white py-1.5 pl-7 pr-2.5 text-xs text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setOnlyAvailableFilter((prev) => !prev)}
                      className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        onlyAvailableFilter
                          ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-950/40 dark:text-brand-300"
                          : "border-gray-200/90 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                      title={onlyAvailableFilter ? "Hiện tất cả PO" : "Chỉ hiện PO có sản phẩm khả dụng"}
                    >
                      <ListFilter className="h-3.5 w-3.5" />
                      <span>Lọc</span>
                    </button>

                    {totalAvailableProducts > 0 && (
                      <button
                        type="button"
                        onClick={handleSelectAllProducts}
                        className="ml-1 shrink-0 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400"
                      >
                        {selectedProductIds.length === totalAvailableProducts
                          ? "Bỏ chọn tất cả"
                          : `Chọn tất cả (${totalAvailableProducts})`}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Box 2 Content Area */}
              {selectedPoIds.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200/90 bg-gray-50/50 py-7 px-4 text-center dark:border-gray-800 dark:bg-gray-800/20">
                  <Package className="mb-2 h-7 w-7 text-gray-300 dark:text-gray-600 stroke-[1.5]" />
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Chưa có đơn hàng nào được chọn
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                    Vui lòng tìm kiếm và chọn ít nhất một đơn hàng PO ở trên để hiển thị danh sách sản phẩm.
                  </p>
                </div>
              ) : isLoadingProductsOrBoms ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-200/80 bg-gray-50/50 p-6 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-900">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                  <span>Đang kiểm tra danh sách sản phẩm và trạng thái BOM...</span>
                </div>
              ) : totalAllProducts === 0 ? (
                <div className="rounded-xl border border-gray-200/80 bg-gray-50/50 p-4 text-center text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-900">
                  Các đơn hàng PO được chọn hiện chưa có sản phẩm nào.
                </div>
              ) : totalAvailableProducts === 0 ? (
                <div className="rounded-xl border border-blue-200/80 bg-blue-50/60 p-4 text-xs dark:border-blue-900/40 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2 font-semibold text-blue-800 dark:text-blue-300">
                    <Package className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span>Tất cả sản phẩm đã có bảng BOM</span>
                  </div>
                  <p className="mt-1 text-blue-700/80 dark:text-blue-300/80">
                    Toàn bộ {totalAllProducts} sản phẩm thuộc các đơn hàng PO đã chọn đều đã được tạo bảng BOM. Không còn sản phẩm nào cần thiết lập mới.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {/* Accordion List for each PO */}
                  <div className="max-h-60 sm:max-h-68 space-y-2 overflow-y-auto pr-1">
                    {visiblePoGroups.map((group) => {
                      const groupAvail = group.availableProducts;
                      const groupFiltered = group.filteredProducts;
                      const isExpanded =
                        userToggledPoIds[group.poId] !== undefined
                          ? userToggledPoIds[group.poId]
                          : groupAvail.length > 0;
                      const isAllGroupSelected =
                        groupAvail.length > 0 &&
                        groupAvail.every((p) => selectedProductIds.includes(p.id));

                      return (
                        <div
                          key={group.poId}
                          className="overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-2xs dark:border-gray-800 dark:bg-gray-900/60"
                        >
                          {/* Accordion PO Header */}
                          <div
                            onClick={() => toggleExpandPo(group.poId, isExpanded)}
                            className="flex cursor-pointer items-center justify-between px-3.5 py-2.5 transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/60"
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400 shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                              )}
                              <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                                {group.po?.poCode || group.poId}
                              </span>
                              {group.po?.customerNameSnapshot && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {group.po.customerNameSnapshot}
                                  </span>
                                </>
                              )}
                              <span className="text-gray-400">•</span>
                              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                {groupAvail.length} sản phẩm khả dụng
                              </span>
                            </div>

                            {groupAvail.length > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePoGroupProducts(groupAvail.map((p) => p.id));
                                }}
                                className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400 shrink-0"
                              >
                                {isAllGroupSelected
                                  ? "Bỏ chọn PO này"
                                  : `Chọn hết (${groupAvail.length})`}
                              </button>
                            )}
                          </div>

                          {/* Accordion Body (When expanded) */}
                          {isExpanded && (
                            <div className="border-t border-gray-100 bg-gray-50/40 p-2 dark:border-gray-800/80 dark:bg-gray-950/20">
                              {groupAvail.length === 0 ? (
                                <p className="py-2 text-center text-xs italic text-gray-400">
                                  Tất cả {group.allProducts.length} sản phẩm của đơn hàng này đã có bảng BOM.
                                </p>
                              ) : groupFiltered.length === 0 ? (
                                <p className="py-2 text-center text-xs text-gray-400">
                                  Không có sản phẩm nào khớp với từ khóa "{productSearch}"
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {groupFiltered.map((product: WizardProduct) => {
                                    const isSelected = selectedProductIds.includes(product.id);
                                    return (
                                      <div
                                        key={product.id}
                                        onClick={() => toggleProduct(product.id)}
                                        className={`flex cursor-pointer items-center justify-between rounded-xl p-2.5 transition-all ${
                                          isSelected
                                            ? "border-2 border-brand-500 bg-brand-50/50 shadow-xs ring-1 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-950/30"
                                            : "border border-gray-200/90 bg-white hover:border-gray-300 hover:bg-gray-50/70 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
                                        }`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleProduct(product.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-4.5 w-4.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                            aria-label={`Chọn sản phẩm ${product.productCode}`}
                                          />

                                          {/* Product Thumbnail */}
                                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200/80 bg-gray-100/80 dark:border-gray-700 dark:bg-gray-800">
                                            {product.structureImageUrl ? (
                                              <img
                                                src={product.structureImageUrl}
                                                alt={product.productCode}
                                                className="h-full w-full object-cover"
                                              />
                                            ) : (
                                              <Shirt className="h-5 w-5 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
                                            )}
                                          </div>

                                          {/* Product Code & Details */}
                                          <div>
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                                                {product.productCode}
                                              </span>
                                              {product.productName && (
                                                <>
                                                  <span className="text-gray-400">•</span>
                                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                                    {product.productName}
                                                  </span>
                                                </>
                                              )}
                                            </div>
                                            {product.colors && product.colors.length > 0 && (
                                              <div className="mt-1 flex flex-wrap items-center gap-1">
                                                {product.colors.map((c: string | { colorName?: string }, idx: number) => {
                                                  const name =
                                                    typeof c === "string" ? c : c.colorName;
                                                  return (
                                                    <span
                                                      key={idx}
                                                      className="rounded-md border border-gray-200/70 bg-gray-100/90 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                                    >
                                                      {name}
                                                    </span>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {product.totalQuantity !== undefined && (
                                          <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                                            <span>SL: </span>
                                            <span className="font-bold text-gray-900 dark:text-white text-sm">
                                              {Number(product.totalQuantity).toLocaleString()}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Informational footer note */}
                  <div className="flex items-center gap-2 pt-1 text-xs text-gray-500 dark:text-gray-400">
                    <Info className="h-4 w-4 shrink-0 text-gray-400" />
                    <span>
                      Chỉ hiển thị sản phẩm chưa có BOM. Mỗi sản phẩm sẽ tạo một bảng BOM riêng với màu sắc và kích cỡ tương ứng.
                    </span>
                    <span className="sr-only">
                      * Mỗi sản phẩm được chọn sẽ được tạo một bảng BOM riêng (dùng chung cho mọi màu sắc và kích cỡ).
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Review & Confirmation matching Mockup */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            {/* Backward-compatibility sr-only elements for automated tests */}
            <span className="sr-only">Thông tin bảng BOM sắp tạo:</span>
            <span className="sr-only">
              {bomType === "fit" ? "FIT BOM (Mẫu Fit)" : "PO BOM (Sản phẩm PO)"}
            </span>

            {/* Modern 5-Row Confirmation Card matching Mockup */}
            <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-2xs divide-y divide-gray-100 dark:border-gray-800 dark:bg-gray-900/60 dark:divide-gray-800/80">
              {/* Row 1: Loại BOM */}
              <div className="flex items-center justify-between px-5 py-4 gap-4 transition-colors hover:bg-gray-50/40 dark:hover:bg-gray-800/20">
                <div className="w-32 sm:w-44 shrink-0 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Loại BOM
                </div>

                <div className="flex flex-1 items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand-600 dark:bg-blue-950/50 dark:text-brand-400">
                    <Package className="h-6 w-6 stroke-[1.75]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                      {bomType === "fit" ? "FIT BOM" : "PO BOM"}
                    </h4>
                    <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {bomType === "fit"
                        ? "Tạo định mức cho mẫu chuẩn kỹ thuật (Style)"
                        : "Tạo định mức cho sản phẩm PO"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gray-100/90 hover:bg-gray-200/90 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Pencil className="h-3.5 w-3.5 text-gray-500" />
                  Thay đổi
                </button>
              </div>

              {/* Row 2: Đơn hàng PO (hoặc Mẫu Fit) */}
              <div className="flex items-center justify-between px-5 py-4 gap-4 transition-colors hover:bg-gray-50/40 dark:hover:bg-gray-800/20">
                <div className="w-32 sm:w-44 shrink-0 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {bomType === "fit" ? "Mẫu Fit (Style)" : "Đơn hàng PO"}
                </div>

                <div className="flex flex-1 items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-gray-800 dark:text-gray-400">
                    {bomType === "fit" ? (
                      <Shirt className="h-5 w-5 stroke-[1.75]" />
                    ) : (
                      <FileText className="h-5 w-5 stroke-[1.75]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    {bomType === "fit" ? (
                      selectedStyles.length === 1 ? (
                        <>
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                            {selectedStyles[0]?.styleCode || "—"}
                          </h4>
                          <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {selectedStyles[0]?.styleName || "Mẫu Fit chuẩn kỹ thuật"}
                          </p>
                        </>
                      ) : (
                        <>
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                            {selectedStyles.length} mẫu Fit
                          </h4>
                          <p
                            className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400 truncate"
                            title={selectedStyles.map((s) => s.styleCode).join(", ")}
                          >
                            {selectedStyles.map((s) => s.styleCode).join(", ")}
                          </p>
                        </>
                      )
                    ) : (
                      <>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                          {selectedPoIds.length} đơn hàng
                        </h4>
                        <p
                          className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400 truncate"
                          title={selectedPoIds
                            .map((id) => allPos.find((p) => p.id === id)?.poCode || id)
                            .join(", ")}
                        >
                          {selectedPoIds
                            .map((id) => allPos.find((p) => p.id === id)?.poCode || id)
                            .join(", ")}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gray-100/90 hover:bg-gray-200/90 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Pencil className="h-3.5 w-3.5 text-gray-500" />
                  Thay đổi
                </button>
              </div>

              {/* Row 3: Sản phẩm tạo BOM */}
              <div className="flex items-center justify-between px-5 py-4 gap-4 transition-colors hover:bg-gray-50/40 dark:hover:bg-gray-800/20">
                <div className="w-32 sm:w-44 shrink-0 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {bomType === "fit" ? "Mẫu Fit tạo BOM" : "Sản phẩm tạo BOM"}
                </div>

                <div className="flex flex-1 items-center gap-3 min-w-0">
                  {bomType === "fit" ? (
                    selectedStyles.length === 1 ? (
                      <>
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200/80 bg-gray-100/80 dark:border-gray-700 dark:bg-gray-800">
                          <Shirt className="h-5 w-5 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                            {selectedStyles[0]?.styleCode || "—"}
                          </h4>
                          <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {selectedStyles[0]?.styleName || "Bảng FIT BOM"}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200/80 bg-gray-100/80 dark:border-gray-700 dark:bg-gray-800">
                          <Shirt className="h-5 w-5 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
                          <span className="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 text-[9px] font-bold text-white">
                            {selectedStyles.length}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                            {selectedStyles.length} mẫu Fit (sẽ tạo {selectedStyles.length} bảng BOM)
                          </h4>
                          <p
                            className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400 truncate"
                            title={selectedStyles.map((s) => s.styleCode).join(", ")}
                          >
                            {selectedStyles.map((s) => s.styleCode).join(", ")}
                          </p>
                        </div>
                      </>
                    )
                  ) : selectedProductsWithDetails.length === 1 ? (
                    <>
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200/80 bg-gray-100/80 dark:border-gray-700 dark:bg-gray-800">
                        {selectedProductsWithDetails[0].product.structureImageUrl ? (
                          <img
                            src={selectedProductsWithDetails[0].product.structureImageUrl}
                            alt={selectedProductsWithDetails[0].product.productCode}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Shirt className="h-5 w-5 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                          {selectedProductsWithDetails[0].product.productCode}
                        </h4>
                        <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {selectedProductsWithDetails[0].product.productName || "Sản phẩm PO"}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200/80 bg-gray-100/80 dark:border-gray-700 dark:bg-gray-800">
                        {selectedProductsWithDetails[0]?.product.structureImageUrl ? (
                          <img
                            src={selectedProductsWithDetails[0].product.structureImageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Shirt className="h-5 w-5 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
                        )}
                        <span className="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 text-[9px] font-bold text-white">
                          {selectedProductsWithDetails.length}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                          {selectedProductsWithDetails.length} sản phẩm (sẽ tạo {selectedProductsWithDetails.length} bảng BOM)
                        </h4>
                        <p
                          className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400 truncate"
                          title={selectedProductsWithDetails
                            .map((p) => p.product.productCode)
                            .join(", ")}
                        >
                          {selectedProductsWithDetails
                            .map((p) => p.product.productCode)
                            .join(", ")}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gray-100/90 hover:bg-gray-200/90 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Pencil className="h-3.5 w-3.5 text-gray-500" />
                  Thay đổi
                </button>
              </div>

              {/* Row 4: Hạn hoàn thành (Hỗ trợ giờ & Chế độ hạn chung / theo từng đơn hàng) */}
              <div className="flex flex-col px-5 py-4 gap-3.5 transition-colors hover:bg-gray-50/40 dark:hover:bg-gray-800/20">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="w-32 sm:w-44 shrink-0">
                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Hạn hoàn thành
                    </div>
                    <div className="mt-0.5 text-[11px] text-gray-400">
                      Ngày & giờ hoàn thành BOM
                    </div>
                  </div>

                  {/* Mode switch for multi-PO */}
                  {bomType === "po" && selectedPoIds.length > 1 && (
                    <div className="flex items-center rounded-xl bg-gray-100 p-0.5 text-xs dark:bg-gray-800">
                      <button
                        type="button"
                        onClick={() => setDeadlineMode("common")}
                        className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                          deadlineMode === "common"
                            ? "bg-white text-brand-600 shadow-2xs dark:bg-gray-700 dark:text-white"
                            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        }`}
                      >
                        Deadline chung
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeadlineMode("per_po");
                          setIsEditingDeadline(true);
                        }}
                        className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                          deadlineMode === "per_po"
                            ? "bg-white text-brand-600 shadow-2xs dark:bg-gray-700 dark:text-white"
                            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        }`}
                      >
                        Từng đơn hàng ({selectedPoIds.length})
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsEditingDeadline(!isEditingDeadline)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      isEditingDeadline
                        ? "bg-brand-500 text-white hover:bg-brand-600"
                        : "bg-gray-100/90 hover:bg-gray-200/90 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {isEditingDeadline ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Xong
                      </>
                    ) : (
                      <>
                        <Pencil className="h-3.5 w-3.5 text-gray-500" />
                        {deadline || Object.keys(poDeadlines).length > 0 ? "Thay đổi" : "Thêm"}
                      </>
                    )}
                  </button>
                </div>

                {/* Common Deadline View / Edit */}
                {deadlineMode === "common" ? (
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-gray-800 dark:text-gray-400">
                      <Calendar className="h-5 w-5 stroke-[1.75]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      {isEditingDeadline ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="date"
                            value={deadline ? deadline.split("T")[0] : ""}
                            onChange={(e) => {
                              const date = e.target.value;
                              if (!date) {
                                setDeadline("");
                              } else {
                                const time = deadline.includes("T") ? deadline.split("T")[1].slice(0, 5) : "17:00";
                                setDeadline(`${date}T${time}`);
                              }
                            }}
                            className="rounded-xl border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-900 shadow-2xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            autoFocus
                          />
                          <div className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-2 py-1 shadow-2xs dark:border-gray-700 dark:bg-gray-800">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            <input
                              type="time"
                              value={deadline.includes("T") ? deadline.split("T")[1].slice(0, 5) : "17:00"}
                              onChange={(e) => {
                                const time = e.target.value;
                                const date = deadline ? deadline.split("T")[0] : new Date().toISOString().split("T")[0];
                                setDeadline(`${date}T${time}`);
                              }}
                              className="bg-transparent text-xs text-gray-900 focus:outline-none dark:text-white"
                            />
                          </div>

                          {/* Quick time presets */}
                          <div className="flex items-center gap-1">
                            {["12:00", "17:00", "23:59"].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  const date = deadline ? deadline.split("T")[0] : new Date().toISOString().split("T")[0];
                                  setDeadline(`${date}T${preset}`);
                                }}
                                className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                              >
                                {preset}
                              </button>
                            ))}
                          </div>

                          {deadline && (
                            <button
                              type="button"
                              onClick={() => setDeadline("")}
                              className="text-[11px] text-rose-500 hover:text-rose-600 underline ml-1"
                            >
                              Xóa hạn
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-900 dark:text-white">
                            {formatDisplayDate(deadline)}
                          </span>
                          {deadline && selectedPoIds.length > 1 && (
                            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-brand-600 dark:bg-blue-950/40 dark:text-brand-300">
                              Áp dụng chung cho tất cả PO
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Per-PO Deadlines */
                  <div className="space-y-2 pt-0.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                      <span>Thiết lập ngày và giờ đến hạn riêng cho từng đơn hàng PO:</span>
                      {deadline && isEditingDeadline && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated: Record<string, string> = {};
                            for (const id of selectedPoIds) {
                              updated[id] = deadline;
                            }
                            setPoDeadlines(updated);
                          }}
                          className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
                        >
                          Sao chép hạn chung ({formatDisplayDate(deadline)}) cho tất cả PO
                        </button>
                      )}
                    </div>

                    <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                      {selectedPoIds.map((poId) => {
                        const po = allPos.find((p) => p.id === poId);
                        const currentVal = poDeadlines[poId] || "";
                        const datePart = currentVal ? currentVal.split("T")[0] : "";
                        const timePart = currentVal.includes("T") ? currentVal.split("T")[1].slice(0, 5) : "17:00";

                        return (
                          <div
                            key={poId}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200/80 bg-gray-50/50 px-3 py-2 dark:border-gray-800 dark:bg-gray-800/40"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                                {po?.poCode || poId}
                              </span>
                              {po?.customerNameSnapshot && (
                                <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                                  • {po.customerNameSnapshot}
                                </span>
                              )}
                            </div>

                            {isEditingDeadline ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <input
                                  type="date"
                                  value={datePart}
                                  onChange={(e) => {
                                    const date = e.target.value;
                                    if (!date) {
                                      setPoDeadlines((prev) => {
                                        const next = { ...prev };
                                        delete next[poId];
                                        return next;
                                      });
                                    } else {
                                      setPoDeadlines((prev) => ({
                                        ...prev,
                                        [poId]: `${date}T${timePart}`,
                                      }));
                                    }
                                  }}
                                  className="rounded-lg border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-900 shadow-2xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                                <div className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-1.5 py-0.5 shadow-2xs dark:border-gray-700 dark:bg-gray-800">
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  <input
                                    type="time"
                                    value={timePart}
                                    onChange={(e) => {
                                      const time = e.target.value;
                                      const date = datePart || new Date().toISOString().split("T")[0];
                                      setPoDeadlines((prev) => ({
                                        ...prev,
                                        [poId]: `${date}T${time}`,
                                      }));
                                    }}
                                    className="bg-transparent text-xs text-gray-900 focus:outline-none dark:text-white"
                                  />
                                </div>
                                {currentVal && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPoDeadlines((prev) => {
                                        const next = { ...prev };
                                        delete next[poId];
                                        return next;
                                      });
                                    }}
                                    className="text-[11px] text-rose-500 hover:text-rose-600 underline"
                                  >
                                    Xóa
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs font-semibold text-gray-900 dark:text-white">
                                {formatDisplayDate(currentVal)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Row 5: Ghi chú */}
              <div className="flex items-center justify-between px-5 py-4 gap-4 transition-colors hover:bg-gray-50/40 dark:hover:bg-gray-800/20">
                <div className="w-32 sm:w-44 shrink-0 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Ghi chú
                </div>

                <div className="flex flex-1 items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-gray-800 dark:text-gray-400">
                    <FileText className="h-5 w-5 stroke-[1.75]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {isEditingNote ? (
                      <textarea
                        value={rdNote}
                        onChange={(e) => setRdNote(e.target.value)}
                        placeholder="Nhập ghi chú kỹ thuật cho BOM..."
                        rows={2}
                        className="w-full rounded-lg border border-gray-300 bg-white p-2 text-xs text-gray-900 shadow-2xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        autoFocus
                      />
                    ) : (
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {rdNote.trim() ? rdNote : "—"}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingNote(!isEditingNote)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isEditingNote
                      ? "bg-brand-500 text-white hover:bg-brand-600"
                      : "bg-gray-100/90 hover:bg-gray-200/90 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {isEditingNote ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Xong
                    </>
                  ) : (
                    <>
                      <Pencil className="h-3.5 w-3.5 text-gray-500" />
                      {rdNote.trim() ? "Thay đổi" : "Thêm"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
