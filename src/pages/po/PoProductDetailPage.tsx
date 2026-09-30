import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { Toast, Button, Modal } from "@/components/shared";
import {
  usePurchaseOrder,
  usePoDocuments,
  usePoProductDetail,
  useProductColors,
  useProductDocuments,
  useProductOperationSteps,
  useUpdatePoProduct,
  useUpdateProductStatus,
  useSaveProductOperationSteps,
  useUnlinkProductDocument,
  useLinkProductDocument,
  useUploadProductDocument,
  useUploadProductDocumentVersion,
} from "@/hooks/usePurchaseOrders";
import { useUploadImage } from "@/hooks/useUploadImage";
import { uploadsApi } from "@/api/uploads.api";
import { useToast } from "@/hooks/useToast";
import { getApiError } from "@/lib/apiError";
import { getDeadlineInfo, deadlineValueClasses } from "@/lib/poDeadline";
import { validateImageFile } from "@/lib/validateImageFile";
import { resolveImageUrl } from "@/lib/imageUtils";
import {
  PlusIcon,
  EyeIcon,
  LockIcon,
  UnlockIcon,
  AlertHexaIcon,
  TableIcon,
  DownloadIcon,
  TrashBinIcon,
  PencilIcon,
} from "@/icons";
import { StyleImagePlaceholder } from "@/components/features/styles/StyleImagePlaceholder";
import { StyleOperationStepTable } from "@/components/features/styles/StyleOperationStepTable";
import { StyleProductionDocTab } from "@/components/features/production-docs/StyleProductionDocTab";
import { UnsavedChangesDialog } from "@/components/features/styles/UnsavedChangesDialog";
import { ProductStatusBadge } from "@/components/features/po/ProductStatusBadge";
import { ProductColorSizeEditor } from "@/components/features/po/ProductColorSizeEditor";
import { ProductVersionedFileGroup } from "@/components/features/po/ProductVersionedFileGroup";
import { PoSplitDocumentPreview } from "@/components/features/po/PoSplitDocumentPreview";
import { PoProductBomTab } from "@/components/features/po/PoProductBomTab";
import { PoProductSampleRoundsTab } from "@/components/features/po/PoProductSampleRoundsTab";
import { EntityHistoryButton } from "@/components/features/audit/EntityHistoryButton";
import { ArrowLeft } from "lucide-react";
import type {
  ProductColorItem,
  ProductDocumentItem,
  PurchaseOrderDocumentVersionItem,
} from "@/types/po";
import type { StyleOperationStepItem } from "@/api/styleOperationStepsApi";
import { createTempIdResolver } from "@/lib/tempId";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("vi-VN");
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}



export default function PoProductDetailPage({
  readOnlyManagement = false,
  managementContext = readOnlyManagement,
}: {
  readOnlyManagement?: boolean;
  managementContext?: boolean;
} = {}) {
  const { id: poId, productId, tab } = useParams<{
    id: string;
    productId: string;
    tab?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, showToast, hideToast } = useToast();
  const productPath = managementContext
    ? `/management/purchase-orders/${encodeURIComponent(poId ?? "")}/products/${encodeURIComponent(productId ?? "")}`
    : `/po/${poId ?? ""}/products/${productId ?? ""}`;
  const poDetailBasePath = managementContext
    ? `/management/purchase-orders/${encodeURIComponent(poId ?? "")}`
    : `/po/${poId ?? ""}`;
  const poDetailPath = `${poDetailBasePath}${managementContext ? location.search : ""}`;
  const productListPath = `${poDetailBasePath}/products${managementContext ? location.search : ""}`;

  const isSizesTab = tab === "sizes" || tab === "size-breakdown" || tab === "size";
  const isColorsTab = tab === "colors" || tab === "color-palette" || tab === "palette";
  const isStepsTab = tab === "operation-steps" || tab === "steps";
  const isBomTab = tab === "bom" || tab === "materials" || tab === "boms";
  const isProductionDocTab = tab === "production-doc";
  const isSamplesTab = tab === "samples";
  const isDocumentsTab = tab === "documents";
  const activeTab:
    | "general"
    | "sizes"
    | "colors"
    | "steps"
    | "bom"
    | "production_doc"
    | "samples"
    | "documents" = isSizesTab
    ? "sizes"
    : isColorsTab
    ? "colors"
    : isStepsTab
    ? "steps"
    : isBomTab
    ? "bom"
    : isProductionDocTab
    ? "production_doc"
    : isSamplesTab
    ? "samples"
    : isDocumentsTab
    ? "documents"
    : "general";

  const [isProductionDocEditing, setIsProductionDocEditing] = useState(false);
  const [isOperationStepsEditing, setIsOperationStepsEditing] = useState(false);
  const [pendingTab, setPendingTab] = useState<
    | "general"
    | "sizes"
    | "colors"
    | "steps"
    | "bom"
    | "production_doc"
    | "samples"
    | "documents"
    | null
  >(null);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Tab protection on navigation away with unsaved changes
  useEffect(() => {
    if (!isProductionDocEditing && !isOperationStepsEditing) return;

    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const link = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.download) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.href === window.location.href) return;
      event.preventDefault();
      setPendingNavigation(`${url.pathname}${url.search}${url.hash}`);
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isProductionDocEditing, isOperationStepsEditing]);

  const navigateToTab = (
    nextTab:
      | "general"
      | "sizes"
      | "colors"
      | "steps"
      | "bom"
      | "production_doc"
      | "samples"
      | "documents"
  ) => {
    if (!poId || !productId) return;
    if (nextTab === "sizes") {
      navigate(`${productPath}/sizes${managementContext ? location.search : ""}`);
    } else if (nextTab === "colors") {
      navigate(`${productPath}/colors${managementContext ? location.search : ""}`);
    } else if (nextTab === "production_doc") {
      navigate(`${productPath}/production-doc${managementContext ? location.search : ""}`);
    } else if (nextTab === "bom") {
      navigate(`${productPath}/bom${managementContext ? location.search : ""}`);
    } else if (nextTab === "steps") {
      navigate(`${productPath}/operation-steps${managementContext ? location.search : ""}`);
    } else if (nextTab === "samples") {
      navigate(`${productPath}/samples${managementContext ? location.search : ""}`);
    } else if (nextTab === "documents") {
      navigate(`${productPath}/documents${managementContext ? location.search : ""}`);
    } else {
      navigate(`${productPath}/detail${managementContext ? location.search : ""}`);
    }
  };

  const handleTabChange = (
    nextTab:
      | "general"
      | "sizes"
      | "colors"
      | "steps"
      | "bom"
      | "production_doc"
      | "samples"
      | "documents"
  ) => {
    if ((isProductionDocEditing || isOperationStepsEditing) && nextTab !== activeTab) {
      setPendingTab(nextTab);
      return;
    }
    navigateToTab(nextTab);
  };

  const handleConfirmLeaveTab = () => {
    if (pendingNavigation) {
      const nextPath = pendingNavigation;
      setPendingNavigation(null);
      navigate(nextPath);
    } else if (pendingTab) {
      navigateToTab(pendingTab);
    }
    setPendingTab(null);
  };

  const { data: po } = usePurchaseOrder(poId);
  const {
    data: product,
    isLoading,
    isError,
  } = usePoProductDetail(poId, productId);
  const isProductLocked = product?.status === "closed";
  // PO đã khóa/hủy thì mọi sản phẩm bên trong cũng chỉ đọc (BE cũng chặn).
  const isPoLocked = po?.status === "closed" || po?.status === "cancelled";
  const isReadOnly = isProductLocked || isPoLocked || readOnlyManagement;

  // Màu & size dùng ở tab Thông tin (tóm tắt) và tab Bảng size (bảng sửa).
  const { data: colorsData } = useProductColors(poId, productId, {
    enabled: activeTab === "general" || activeTab === "sizes",
  });
  const productColors = useMemo(() => colorsData?.colors ?? [], [colorsData]);
  const productTotalQuantity = colorsData?.totalQuantity ?? 0;

  // Tab Bảng màu chỉ cần ảnh purpose=color_card — lọc ngay từ BE, không kéo
  // về rồi lọc ở FE (tránh ký lại URL cho mọi phiên bản của tài liệu khác).
  const { data: colorCardDocumentsData } = useProductDocuments(poId, productId, {
    enabled: activeTab === "colors",
    purpose: "color_card",
  });
  const paletteDocuments = useMemo(
    () => colorCardDocumentsData ?? [],
    [colorCardDocumentsData],
  );

  // Tab Tài liệu đính kèm cần nhiều purpose (PO chi tiết, TechPack, Khác) nên
  // vẫn lấy trọn danh sách rồi nhóm ở FE.
  const { data: productDocumentsData } = useProductDocuments(poId, productId, {
    enabled: activeTab === "documents",
  });
  const productDocuments = useMemo(
    () => productDocumentsData ?? [],
    [productDocumentsData],
  );

  const { data: productSteps } = useProductOperationSteps(poId, productId, {
    enabled: activeTab === "steps",
  });

  const updateProductMutation = useUpdatePoProduct();
  const updateStatusMutation = useUpdateProductStatus();
  const saveStepsMutation = useSaveProductOperationSteps();
  const unlinkDocMutation = useUnlinkProductDocument();
  const linkDocMutation = useLinkProductDocument();
  const uploadProductDocMutation = useUploadProductDocument();
  const uploadVersionMutation = useUploadProductDocumentVersion();
  const uploadImage = useUploadImage();

  // Modal edit basic product info (phong cách StyleFormModal)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editProductCode, setEditProductCode] = useState("");
  const [editProductName, setEditProductName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editMaterialNote, setEditMaterialNote] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editCmBaseDays, setEditCmBaseDays] = useState(30);
  const [editColors, setEditColors] = useState<ProductColorItem[]>([]);
  const [editFieldErrors, setEditFieldErrors] = useState<{
    productCode?: string;
    productName?: string;
    colors?: string;
  }>({});
  const editProductCodeInputRef = useRef<HTMLInputElement>(null);
  const editProductNameInputRef = useRef<HTMLInputElement>(null);
  const editColorsCardRef = useRef<HTMLDivElement>(null);

  // Local state for image handling (phong cách GeneralTab)
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for PO document picker modal.
  // linkDocFilter khóa danh sách theo đúng mục đã bấm "Gán từ kho PO" —
  // trước đây cả 3 nút (PO Chi Tiết/TechPack/Khác) đều mở chung 1 danh sách
  // không lọc, nên chọn nhầm 1 file "Khác" từ nút của mục "PO Chi Tiết" thì
  // file lại tự nằm dưới "Khác" (đúng theo purpose gốc) — gây cảm giác bug UI.
  const [isLinkPoDocOpen, setIsLinkPoDocOpen] = useState(false);
  const [linkDocFilter, setLinkDocFilter] = useState<"po_detail" | "tech_pack" | "other" | null>(
    null,
  );

  const openLinkPoDocModal = (filter: "po_detail" | "tech_pack" | "other" | null) => {
    if (isReadOnly) return;
    setLinkDocFilter(filter);
    setIsLinkPoDocOpen(true);
  };

  // Kho tài liệu của PO chỉ cần khi mở modal gán tài liệu vào sản phẩm.
  const { data: poDocumentsPage } = usePoDocuments(
    poId,
    { page: 1, limit: 100 },
    { enabled: isLinkPoDocOpen },
  );
  const poStoreDocuments = poDocumentsPage?.items ?? [];

  // Local state for direct document upload modal
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [docUploadCategory, setDocUploadCategory] = useState<string>("production_doc");
  const [docUploadFile, setDocUploadFile] = useState<File | null>(null);

  // Local state for uploading new version of a document
  const [isUploadVersionOpen, setIsUploadVersionOpen] = useState(false);
  const [versionTargetInfo, setVersionTargetInfo] = useState<{
    documentId: string;
    currentVersionNo: number;
    title: string;
    purpose: string;
  } | null>(null);
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [newVersionReason, setNewVersionReason] = useState<string>("");

  // Local state for document preview modal
  const [previewDocItem, setPreviewDocItem] = useState<(ProductDocumentItem & { versionId?: string }) | null>(null);

  // Ảnh bảng màu sản phẩm (Tab 3: Bảng màu) — lưu thật qua kho tài liệu sản
  // phẩm dùng chung (purpose "color_card"), tái dùng nguyên luồng
  // presign/confirm đã có sẵn cho PO Chi Tiết/TechPack/Khác thay vì local
  // state giả (trước đây chỉ tạo blob URL tạm, F5 là mất).
  const [palettePreviewModalUrl, setPalettePreviewModalUrl] = useState<{ url: string; name: string } | null>(null);

  // Local state cho xem lịch sử tinh gọn

  useEffect(() => {
    let isMounted = true;
    const raw = product?.structureImageVersionId;
    if (!raw) {
      setImageUrl(null);
      return;
    }
    if (!uploadsApi.isRawObjectKey(raw)) {
      setImageUrl(resolveImageUrl(raw));
      return;
    }
    uploadsApi
      .getViewUrl(raw)
      .then((url) => {
        if (isMounted) setImageUrl(url);
      })
      .catch(() => {
        if (isMounted) setImageUrl(null);
      });
    return () => {
      isMounted = false;
    };
  }, [product?.structureImageVersionId]);

  // Danh sách các size duy nhất từ các màu sắc để dựng bảng ma trận
  const uniqueSizes = useMemo(() => {
    const set = new Set<string>();
    const list: string[] = [];
    productColors.forEach((c) => {
      (c.sizes || []).forEach((s) => {
        if (s.sizeLabel && !set.has(s.sizeLabel)) {
          set.add(s.sizeLabel);
          list.push(s.sizeLabel);
        }
      });
    });
    return list;
  }, [productColors]);

  // Gom nhóm các sự kiện lịch sử theo từng loại thao tác chung

  const totalBySize = useMemo(() => {
    const map: Record<string, number> = {};
    productColors.forEach((c) => {
      (c.sizes || []).forEach((s) => {
        map[s.sizeLabel] = (map[s.sizeLabel] || 0) + (Number(s.quantity) || 0);
      });
    });
    return map;
  }, [productColors]);

  const handleOpenEditModal = () => {
    if (!product || isReadOnly) return;
    setEditProductCode(product.productCode);
    setEditProductName(product.productName);
    setEditCategory(product.category || "");
    setEditMaterialNote(product.materialNote || "");
    setEditDeadline(product.deadline ? product.deadline.split("T")[0] : "");
    setEditCmBaseDays(product.as3bCmBaseDays || 30);
    setEditColors(
      productColors.length > 0
        ? JSON.parse(JSON.stringify(productColors))
        : [],
    );
    setEditFieldErrors({});
    setIsEditModalOpen(true);
  };

  const validateEditFields = (): boolean => {
    const errors: typeof editFieldErrors = {};
    if (!editProductCode.trim()) errors.productCode = "Mã sản phẩm không được để trống.";
    if (!editProductName.trim()) errors.productName = "Tên sản phẩm không được để trống.";

    const namedColors = editColors.filter((c) => c.colorName.trim().length > 0);
    if (namedColors.length === 0) {
      errors.colors = "Vui lòng nhập ít nhất một màu sắc sản phẩm.";
    } else {
      const seenNames = new Set<string>();
      for (const c of namedColors) {
        const name = c.colorName.trim();
        if (seenNames.has(name)) {
          errors.colors = `Màu "${name}" bị lặp lại — mỗi màu chỉ được khai báo một lần.`;
          break;
        }
        seenNames.add(name);
      }
      if (!errors.colors) {
        for (const c of namedColors) {
          const seenLabels = new Set<string>();
          for (const s of c.sizes || []) {
            const label = s.sizeLabel.trim().toUpperCase();
            if (!label) continue;
            if (seenLabels.has(label)) {
              errors.colors = `Size "${label}" bị lặp lại trong màu "${c.colorName.trim()}".`;
              break;
            }
            seenLabels.add(label);
          }
          if (errors.colors) break;
        }
      }
      if (!errors.colors) {
        const hasQuantity = namedColors.some((c) =>
          (c.sizes || []).some((s) => Number(s.quantity) > 0),
        );
        if (!hasQuantity) {
          errors.colors =
            "Vui lòng nhập số lượng (pcs) cho ít nhất một size — tổng sản lượng đang là 0.";
        }
      }
    }

    setEditFieldErrors(errors);
    if (errors.productCode) {
      editProductCodeInputRef.current?.focus();
    } else if (errors.productName) {
      editProductNameInputRef.current?.focus();
    } else if (errors.colors) {
      editColorsCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    return Object.keys(errors).length === 0;
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poId || !productId || isReadOnly) return;
    if (!validateEditFields()) return;

    const cleanColors = editColors
      .filter((c) => c.colorName.trim().length > 0)
      .map((c) => ({
        id: c.id,
        colorName: c.colorName.trim(),
        sizes: (c.sizes || [])
          .filter((s) => s.sizeLabel.trim().length > 0)
          .map((s) => ({
            sizeLabel: s.sizeLabel.trim().toUpperCase(),
            quantity: Number(s.quantity) || 0,
          })),
      }));

    try {
      await updateProductMutation.mutateAsync({
        id: poId,
        productId,
        input: {
          productCode: editProductCode.trim(),
          productName: editProductName.trim(),
          category: editCategory.trim() || undefined,
          materialNote: editMaterialNote.trim() || undefined,
          deadline: editDeadline || undefined,
          as3bCmBaseDays: Number(editCmBaseDays) || 30,
          colors: cleanColors,
        },
      });
      showToast("Đã cập nhật thông tin sản phẩm thành công.");
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      const apiErr = getApiError(err, "Cập nhật sản phẩm thất bại.");
      showToast(apiErr.message, "error");
    }
  };

  const handleUploadAndSaveImage = useCallback(
    async (file: File) => {
      if (!poId || !productId || isReadOnly) return;
      const validationError = validateImageFile(file);
      if (validationError) {
        showToast(validationError, "error");
        return;
      }
      try {
        const res = await uploadImage.mutateAsync({
          entityType: "purchase-order",
          entityId: productId,
          purpose: "sample_image",
          file,
        });
        setImageUrl(res.previewUrl);
        await updateProductMutation.mutateAsync({
          id: poId,
          productId,
          input: { structureImageVersionId: res.objectKey },
        });
        showToast("Đã tải và lưu ảnh sản phẩm thành công.");
      } catch (err) {
        showToast(getApiError(err, "Tải ảnh sản phẩm thất bại.").message, "error");
      }
    },
    [poId, productId, isReadOnly, uploadImage, updateProductMutation, showToast],
  );

  const clearLocalImage = useCallback(async () => {
    if (!poId || !productId || isReadOnly) return;
    try {
      setImageUrl(null);
      await updateProductMutation.mutateAsync({
        id: poId,
        productId,
        input: { structureImageVersionId: null },
      });
      showToast("Đã xóa ảnh sản phẩm.");
    } catch (err) {
      showToast(getApiError(err, "Xóa ảnh thất bại.").message, "error");
    }
  }, [poId, productId, isReadOnly, updateProductMutation, showToast]);

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (isReadOnly || activeTab !== "general") return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) void handleUploadAndSaveImage(file);
        }
      }
    },
    [activeTab, handleUploadAndSaveImage, isReadOnly],
  );

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const file = e.target.files?.[0];
    if (file) void handleUploadAndSaveImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isReadOnly) return;
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) void handleUploadAndSaveImage(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [lockReason, setLockReason] = useState("");
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");



  const handleConfirmLockProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poId || !productId || !product || isReadOnly) return;
    try {
      await updateStatusMutation.mutateAsync({
        poId,
        productId,
        status: "closed",
        reason: lockReason.trim() || "Khóa sản phẩm sau khi xử lý hoàn tất",
      });
      showToast("Đã khóa sản phẩm thành công. Dữ liệu đã chuyển sang chế độ chỉ đọc.");
      setIsLockModalOpen(false);
      setLockReason("");
    } catch (err: unknown) {
      const apiErr = getApiError(err, "Khóa sản phẩm thất bại.");
      showToast(apiErr.message, "error");
    }
  };

  const handleConfirmUnlockProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poId || !productId || !product || readOnlyManagement) return;
    try {
      await updateStatusMutation.mutateAsync({
        poId,
        productId,
        status: "draft",
        reason: unlockReason.trim() || "Mở khóa sản phẩm để tiếp tục xử lý",
      });
      showToast("Đã mở khóa sản phẩm. Trạng thái hiện tại: Đang Xử Lý.");
      setIsUnlockModalOpen(false);
      setUnlockReason("");
    } catch (err: unknown) {
      const apiErr = getApiError(err, "Mở khóa sản phẩm thất bại.");
      showToast(apiErr.message, "error");
    }
  };

  // Lưu công đoạn qua StyleOperationStepTable (áp dụng y xì Mẫu Fit)
  const handleSaveSteps = async (
    stepsData: Partial<StyleOperationStepItem>[],
    baseDays?: number,
  ) => {
    if (!poId || !productId || isReadOnly) return;
    try {
      // StyleOperationStepTable generates client-only row ids like "new-<ts>",
      // "child-<ts>-<rand>" and "group-<ts>" for rows that aren't persisted
      // yet (see addRow/addChildRowToGroup/handleGroupPick). Unlike the Style
      // operation-steps endpoint, the PO-product save endpoint does not
      // validate/remap ids server-side — it inserts/validates `id` as-is
      // against a `uuid` column, so a client-only id must never be sent
      // through. Resolve every non-UUID id (and any parentStepId pointing at
      // one) to a real UUID client-side first, keeping the parent/child link
      // intact (see src/lib/tempId.ts).
      const resolveId = createTempIdResolver();
      const cleanedSteps = (stepsData || []).map((step, orderIndex) => ({
        id: resolveId(step.id),
        stepName: step.stepName || "",
        description: step.description || undefined,
        timePerPiece: Number(step.timePerPiece) || 0,
        ssv: Number(step.ssv) || 0,
        targetTotal: Number(step.targetTotal) || 0,
        note: step.note || undefined,
        orderIndex,
        isGroup: Boolean(step.isGroup),
        stageId: step.stageId ? String(step.stageId) : undefined,
        parentStepId: resolveId(step.parentStepId),
      }));

      await saveStepsMutation.mutateAsync({
        poId,
        productId,
        input: {
          steps: cleanedSteps,
          cmBaseDays: baseDays,
        },
      });
      showToast("Đã lưu bảng quy trình công đoạn sản phẩm thành công.");
    } catch (err) {
      showToast(getApiError(err, "Lưu quy trình công đoạn thất bại.").message, "error");
      throw err;
    }
  };


  const handleUnlinkDocument = async (documentId: string) => {
    if (!poId || !productId || isReadOnly) return;
    try {
      await unlinkDocMutation.mutateAsync({ poId, productId, documentId });
      showToast("Đã gỡ liên kết tài liệu khỏi sản phẩm.");
    } catch (err: unknown) {
      const apiErr = getApiError(err, "Gỡ tài liệu thất bại.");
      showToast(apiErr.message, "error");
    }
  };

  const handleLinkExistingPoDoc = async (documentId: string) => {
    if (!poId || !productId || isReadOnly) return;
    try {
      await linkDocMutation.mutateAsync({ poId, productId, documentId });
      showToast("Đã gán tài liệu vào sản phẩm thành công.");
      setIsLinkPoDocOpen(false);
    } catch (err: unknown) {
      const apiErr = getApiError(err, "Gán tài liệu thất bại.");
      showToast(apiErr.message, "error");
    }
  };

  const handleOpenUploadDoc = (category: string) => {
    if (isReadOnly) return;
    setDocUploadCategory(category);
    setDocUploadFile(null);
    setIsUploadDocOpen(true);
  };

  const handleConfirmUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poId || !productId || !docUploadFile || isReadOnly) return;
    try {
      await uploadProductDocMutation.mutateAsync({
        poId,
        productId,
        file: docUploadFile,
        purpose: docUploadCategory,
      });
      showToast("Tải lên tài liệu thành công.");
      setIsUploadDocOpen(false);
      setDocUploadFile(null);
    } catch (err: unknown) {
      const apiErr = getApiError(err, "Tải lên tài liệu thất bại.");
      showToast(apiErr.message, "error");
    }
  };

  const handleOpenUploadVersion = (
    documentId: string,
    currentVersionNo: number,
    title: string,
    purpose: string,
  ) => {
    if (isReadOnly) return;
    setVersionTargetInfo({ documentId, currentVersionNo, title, purpose });
    setNewVersionFile(null);
    setNewVersionReason("");
    setIsUploadVersionOpen(true);
  };

  const handleConfirmUploadVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poId || !productId || !versionTargetInfo || !newVersionFile || isReadOnly) return;
    if (!newVersionReason.trim()) {
      showToast("Vui lòng nhập lý do / ghi chú thay đổi phiên bản từ khách hàng.", "error");
      return;
    }
    try {
      await uploadVersionMutation.mutateAsync({
        poId,
        productId,
        documentId: versionTargetInfo.documentId,
        file: newVersionFile,
        purpose: versionTargetInfo.purpose,
        changeReason: newVersionReason.trim(),
      });
      showToast(
        `Đã cập nhật phiên bản mới v${versionTargetInfo.currentVersionNo + 1} thành công.`,
      );
      setIsUploadVersionOpen(false);
      setNewVersionFile(null);
      setNewVersionReason("");
      setVersionTargetInfo(null);
    } catch (err: unknown) {
      const apiErr = getApiError(err, "Cập nhật phiên bản thất bại.");
      showToast(apiErr.message, "error");
    }
  };

  const handlePreviewDoc = (
    doc: ProductDocumentItem,
    version?: PurchaseOrderDocumentVersionItem,
  ) => {
    setPreviewDocItem({
      ...doc,
      fileName: version?.originalFileName || doc.fileName || doc.title,
      fileUrl: version?.fileUrl || doc.fileUrl,
      versionId: version?.id,
    });
  };

  // Loading Skeleton y xì StyleDetailPage
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse pt-2">
        <div className="h-12 w-1/3 rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="h-8 w-1/4 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-96 w-full rounded-2xl bg-gray-100 dark:bg-gray-800/60" />
      </div>
    );
  }

  // Error boundary y xì StyleDetailPage
  if (isError || !product) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-center text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
        <h3 className="font-semibold text-base">Không tìm thấy sản phẩm trong PO</h3>
        <p className="mt-1">
          Sản phẩm không tồn tại hoặc bạn không có quyền truy cập.
        </p>
        <Link
          to={productListPath}
          className="mt-4 inline-block rounded-md bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 transition-colors cursor-pointer"
        >
          Quay lại danh sách sản phẩm PO
        </Link>
      </div>
    );
  }



  // Chuyển đổi dữ liệu công đoạn cho StyleOperationStepTable
  const mappedSteps: StyleOperationStepItem[] = (productSteps || []).map(
    (step, idx) => ({
      id: String(step.id),
      stepName: step.stepName || "",
      description: step.description || "",
      timePerPiece: Number(step.timePerPiece) || 0,
      ssv: Number(step.ssv) || 0,
      targetTotal: Number(step.targetTotal) || 0,
      note: step.note || "",
      orderIndex: step.orderIndex ?? idx,
      isGroup: Boolean(step.isGroup),
      stageId: step.stageId ? String(step.stageId) : undefined,
      groupId: step.groupId ? String(step.groupId) : undefined,
      parentStepId: step.parentStepId ? String(step.parentStepId) : undefined,
    }),
  );

  // Helper nhận diện mục đích tài liệu
  const isPoDetailPurpose = (purpose?: string | null) =>
    purpose === "production_doc" || purpose === "po_original";

  const isTechPackPurpose = (purpose?: string | null) =>
    purpose === "tech_pack" || purpose === "techpack";

  const isColorCardPurpose = (purpose?: string | null) => purpose === "color_card";

  // Phân nhóm tài liệu đính kèm: PO Chi Tiết, TechPack, Khác
  // (color_card không nằm trong đây nữa — nó có query riêng ở tab Bảng màu.)
  const poDocuments = productDocuments.filter((d) =>
    isPoDetailPurpose(d.purpose),
  );
  const techPackDocuments = productDocuments.filter((d) =>
    isTechPackPurpose(d.purpose),
  );
  const otherDocuments = productDocuments.filter(
    (d) =>
      !isPoDetailPurpose(d.purpose) &&
      !isTechPackPurpose(d.purpose) &&
      !isColorCardPurpose(d.purpose),
  );

  return (
    <div className="space-y-3">
      {/* ─── 1. HÀNG TRÊN: "← Danh sách SP" bên trái, breadcrumb bên phải ──────── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          to={productListPath}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white px-3 text-xs font-semibold text-gray-600 shadow-2xs transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Danh sách sản phẩm
        </Link>
        <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Link to={managementContext ? "/management/dashboard" : "/dashboard"} className="hover:text-gray-900 dark:hover:text-white transition-colors">
            Dashboard
          </Link>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <Link to={managementContext ? "/management/purchase-orders" : "/po"} className="hover:text-gray-900 dark:hover:text-white transition-colors">
            Đơn hàng PO
          </Link>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <Link
            to={poDetailPath}
            className="font-mono hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {po?.poCode || "PO"}
          </Link>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="font-mono font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[200px] sm:max-w-none">
            {product.productCode}
          </span>
        </nav>
      </div>

      {/* ─── 2. UNIFIED PRODUCT HEADER CARD (BỐ CỤC CHUẨN GỌN GÀNG, SANG TRỌNG) ──── */}
      <div className="-mt-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Cột trái: Mã sản phẩm TO và ĐẦU TIÊN (Focus), Tên SP phụ trợ & Trạng thái */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-900 dark:text-white">
                {product.productCode}
              </h1>
              {product.productName && (
                <span className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-300">
                  {product.productName}
                </span>
              )}
              <ProductStatusBadge status={product.status} />
            </div>
          </div>

          {/* Cột phải: Nhóm nút hành động */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!readOnlyManagement && !isPoLocked &&
              (isProductLocked ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUnlockModalOpen(true)}
                  disabled={updateStatusMutation.isPending}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 flex items-center gap-1.5"
                >
                  <UnlockIcon className="w-4 h-4 shrink-0" />
                  <span>Mở khoá để xử lý tiếp</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setIsLockModalOpen(true)}
                  disabled={updateStatusMutation.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-1.5"
                >
                  <LockIcon className="w-4 h-4 shrink-0" />
                  <span>Khóa sản phẩm</span>
                </Button>
              ))}
            {!isReadOnly && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpenEditModal}
                className="flex items-center gap-1.5"
              >
                <PencilIcon className="w-3.5 h-3.5 shrink-0" />
                <span>Chỉnh sửa</span>
              </Button>
            )}
          </div>
        </div>

        {/* Lock Banner notification khi sản phẩm bị khóa */}
        {isProductLocked && !isPoLocked && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white shrink-0">
                <LockIcon className="w-3 h-3" />
              </span>
              <span>
                Sản phẩm này đã được <strong>Khoá</strong> sau khi xử lý hoàn tất. Quy trình công đoạn và các thông tin đã được chốt và chuyển sang chế độ <strong>Chỉ đọc</strong>.
              </span>
            </div>
            {!readOnlyManagement && !isPoLocked && (
              <button
                type="button"
                onClick={() => setIsUnlockModalOpen(true)}
                disabled={updateStatusMutation.isPending}
                className="text-xs font-bold text-rose-700 underline hover:text-rose-900 dark:text-rose-300 dark:hover:text-white shrink-0 cursor-pointer"
              >
                Mở khoá để tiếp tục xử lý
              </button>
            )}
          </div>
        )}
        {isPoLocked && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white shrink-0">
              <LockIcon className="w-3 h-3" />
            </span>
            <span>
              Đơn hàng PO này đã <strong>{po?.status === "cancelled" ? "Hủy" : "Khoá"}</strong>, nên toàn bộ sản phẩm bên trong chỉ ở chế độ <strong>Chỉ đọc</strong>.
            </span>
          </div>
        )}
        {readOnlyManagement && (
          <p className="rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2.5 text-xs font-medium text-brand-800 dark:border-brand-900/50 dark:bg-brand-950/40 dark:text-brand-200">
            Bạn đang xem chi tiết sản phẩm trong khu Quản lý · chỉ đọc.
          </p>
        )}
      </div>

      {/* ─── 3. THANH TABS GẠCH CHÂN RIÊNG BIỆT ──────────────────── */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pt-2 gap-2">
          <nav className="flex min-w-0 flex-nowrap items-center gap-x-6 overflow-x-auto" aria-label="Tabs">
            <button
              type="button"
              onClick={() => handleTabChange("general")}
              className={`border-b-2 py-2.5 px-1 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "general"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Thông tin sản phẩm
            </button>

            {/* TAB 2: BẢNG SIZE (SIZE + MÀU) */}
            <button
              type="button"
              onClick={() => handleTabChange("sizes")}
              className={`border-b-2 py-2.5 px-1 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "sizes"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Bảng size
            </button>

            {/* TAB 3: BẢNG MÀU (ẢNH BẢNG MÀU) */}
            <button
              type="button"
              onClick={() => handleTabChange("colors")}
              className={`border-b-2 py-2.5 px-1 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "colors"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Bảng màu
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("steps")}
              className={`border-b-2 py-2.5 px-1 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "steps"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Quy trình công đoạn
            </button>

            {/* TAB NGUYÊN PHỤ LIỆU (BOM) */}
            <button
              type="button"
              onClick={() => handleTabChange("bom")}
              className={`border-b-2 py-2.5 px-1 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "bom"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Nguyên phụ liệu
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("production_doc")}
              className={`border-b-2 py-2.5 px-1 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "production_doc"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Tài liệu sản xuất
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("samples")}
              className={`border-b-2 py-2.5 px-1 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "samples"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Đợt may mẫu
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("documents")}
              className={`border-b-2 py-2.5 px-1 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "documents"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Tài liệu đính kèm
            </button>

          </nav>
        </div>

      {/* ========================================================================= */}
      {/* TAB 1: THÔNG TIN SẢN PHẨM (Y XÌ GENERALTAB CỦA MẪU FIT)                   */}
      {/* ========================================================================= */}
      {activeTab === "general" && (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-start pt-3">
          {/* Cột trái (4 cols / ~33%): Visual Focus hình ảnh sản phẩm */}
          <div className="lg:col-span-4 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-3 shadow-xs dark:border-gray-800 dark:bg-gray-900">
              {imageUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center h-56 overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                    <img
                      src={imageUrl}
                      alt={product.productName}
                      className="max-h-56 max-w-full object-contain"
                    />
                  </div>
                  {!isReadOnly && <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      Thay ảnh
                    </button>
                    <button
                      type="button"
                      onClick={clearLocalImage}
                      className="flex-1 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 shadow-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      Xóa
                    </button>
                  </div>}
                </div>
              ) : (
                <div
                  onDrop={isReadOnly ? undefined : handleDrop}
                  onDragOver={isReadOnly ? undefined : handleDragOver}
                  onDragLeave={isReadOnly ? undefined : handleDragLeave}
                  onClick={isReadOnly ? undefined : () => fileInputRef.current?.click()}
                  className={`relative flex h-56 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                    isReadOnly
                      ? "border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/40"
                      : `cursor-pointer ${isDragging ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30" : "border-gray-200 bg-gray-50/50 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-800/40"}`
                  }`}
                >
                  <StyleImagePlaceholder className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {isReadOnly ? "Chưa có ảnh mô tả sản phẩm" : "Thêm ảnh sản phẩm"}
                  </p>
                  {!isReadOnly && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Kéo thả ảnh vào đây hoặc nhấn <strong>Ctrl + V</strong>
                  </p>}
                  {!isReadOnly && <span className="mt-3 inline-flex items-center rounded-md bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-2xs border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    PNG, JPG, WebP · tối đa 5MB
                  </span>}
                </div>
              )}
            </div>

            {!isReadOnly && <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />}
          </div>

          {/* Cột phải (8 cols / ~67%): Chi tiết thông số sản phẩm — 1 card thống
              nhất, các phần ngăn cách bằng đường kẻ thay vì nhiều khối xám
              rời rạc, để nhìn có hệ thống hơn. */}
          <div className="lg:col-span-8 space-y-4">
            <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4 p-5 sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Dòng sản phẩm
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {product.category || "—"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Hạn giao
                  </dt>
                  <dd
                    className={`mt-1 text-sm font-semibold ${deadlineValueClasses[getDeadlineInfo(product.deadline, isProductLocked ? "closed" : undefined).tone]}`}
                  >
                    {formatDate(product.deadline)}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Trạng thái
                  </dt>
                  <dd
                    className="mt-1.5"
                    title={
                      readOnlyManagement
                        ? "Khu Quản lý đang ở chế độ chỉ xem"
                        : !isProductLocked
                          ? "Đang trong quá trình xử lý dữ liệu — dùng nút \"Khóa sản phẩm\" ở trên để khoá"
                          : "Đã khóa sau khi xử lý xong, chế độ chỉ đọc"
                    }
                  >
                    <ProductStatusBadge status={product.status} />
                  </dd>
                </div>

                {product.sourceStyle && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      Mẫu Fit nguồn
                    </dt>
                    <dd className="mt-1">
                      <Link
                        to={`/styles/${product.sourceStyle.id}/detail`}
                        target="_blank"
                        className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-300 hover:underline"
                      >
                        {product.sourceStyle.styleCode} ↗
                      </Link>
                    </dd>
                  </div>
                )}

                {product.sourceStyle && product.importedAt && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      Ngày import từ Fit
                    </dt>
                    <dd
                      className="mt-1 text-sm font-semibold text-gray-900 dark:text-white"
                      title={
                        product.importedBy
                          ? `Người import: ${product.importedBy}`
                          : undefined
                      }
                    >
                      {formatDate(product.importedAt)}
                    </dd>
                  </div>
                )}
              </dl>

              {/* Liên kết nhanh sang Tab 2: Bảng size */}
              <div className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Màu sắc &amp; Kích cỡ</span>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    {productColors.length} màu · {uniqueSizes.length} size · {productTotalQuantity.toLocaleString()} pcs
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange("sizes")}
                  className="shrink-0 text-sm font-semibold text-brand-600 hover:underline cursor-pointer"
                >
                  Xem Bảng size →
                </button>
              </div>

              {/* Chất liệu & đặc điểm */}
              {product.materialNote && (
                <div className="px-5 py-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5">
                    Ghi chú chất liệu
                  </dt>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {product.materialNote}
                  </p>
                </div>
              )}
            </div>

            {/* Metadata Footer */}
            <div className="text-xs text-gray-400 dark:text-gray-500 flex flex-wrap items-center gap-3">
              <span>Tạo lúc {formatDateTime(product.createdAt)}</span>
              <span>•</span>
              <span>Cập nhật {formatDateTime(product.updatedAt)}</span>
              <EntityHistoryButton
                aggregateType="PurchaseOrderProduct"
                aggregateId={product.id}
                title="Lịch sử: Thông tin sản phẩm"
                size="xs"
                className="ml-auto !font-semibold"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BẢNG SIZE (BAO GỒM SIZE + MÀU)                                      */}
      {/* ========================================================================= */}
      {activeTab === "sizes" && (
        <div className="space-y-5 pt-3">
          {/* Header Bảng size */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Bảng phân bổ Size &amp; Phối màu sản phẩm
            </h3>

            <div className="flex items-center gap-2">
              <EntityHistoryButton
                aggregateType="PurchaseOrderProduct"
                aggregateId={product.id}
                title="Lịch sử: Bảng size"
              />
              {!isReadOnly && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenEditModal}
                  className="text-xs font-semibold text-gray-700 border-gray-200 bg-white hover:bg-gray-50 shrink-0"
                >
                  Chỉnh sửa màu &amp; size
                </Button>
              )}
            </div>
          </div>

          {/* Ma trận bảng Size + Màu */}
          {productColors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700 bg-white dark:bg-gray-900">
              <TableIcon className="w-10 h-10 mx-auto text-gray-400 mb-3" />
              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Chưa có bảng size &amp; màu sắc</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                Sản phẩm này chưa được thiết lập cơ cấu kích cỡ và phối màu sản xuất.
              </p>
              {!isReadOnly && (
                <Button
                  size="sm"
                  onClick={handleOpenEditModal}
                  className="mt-4 text-xs font-semibold"
                >
                  + Thiết lập Bảng Size &amp; Màu
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
                  <thead className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400">
                    <tr>
                      <th className="px-5 py-3.5 w-12 text-center">STT</th>
                      <th className="px-4 py-3.5">Phối màu</th>
                      {uniqueSizes.map((size) => (
                        <th key={size} className="px-3 py-3.5 text-center font-mono font-bold text-gray-800 dark:text-gray-200">
                          {size}
                        </th>
                      ))}
                      <th className="px-5 py-3.5 text-right font-bold text-brand-600 dark:text-brand-400">
                        Tổng cộng (pcs)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {productColors.map((color, idx) => {
                      const rowTotal = (color.sizes || []).reduce(
                        (sum, s) => sum + (Number(s.quantity) || 0),
                        0,
                      );
                      return (
                        <tr key={color.id || idx} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-5 py-3.5 text-center font-mono text-gray-400">{idx + 1}</td>
                          <td className="px-4 py-3.5 font-semibold text-gray-900 dark:text-white">
                            {color.colorName}
                          </td>
                          {uniqueSizes.map((size) => {
                            const sizeItem = (color.sizes || []).find((s) => s.sizeLabel === size);
                            const qty = Number(sizeItem?.quantity) || 0;
                            return (
                              <td key={size} className="px-3 py-3.5 text-center font-mono text-xs">
                                {qty > 0 ? (
                                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                                    {qty.toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-gray-300 dark:text-gray-600">0</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-5 py-3.5 text-right font-mono font-bold text-brand-600 dark:text-brand-400">
                            {rowTotal.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-200 bg-gray-50/90 font-semibold dark:border-gray-700 dark:bg-gray-800/80">
                    <tr>
                      <td colSpan={2} className="px-5 py-3.5 text-gray-900 dark:text-white uppercase text-[11px] tracking-wider">
                        Tổng cộng theo Size
                      </td>
                      {uniqueSizes.map((size) => (
                        <td key={size} className="px-3 py-3.5 text-center font-mono font-bold text-gray-900 dark:text-white">
                          {(totalBySize[size] || 0).toLocaleString()}
                        </td>
                      ))}
                      <td className="px-5 py-3.5 text-right font-mono text-sm font-extrabold text-brand-600 dark:text-brand-400">
                        {productTotalQuantity.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BẢNG MÀU (NƠI UPDATE ẢNH BẢNG MÀU DÀNH CHO PRODUCT)                 */}
      {/* ========================================================================= */}
      {activeTab === "colors" && (
        <div className="space-y-5 pt-3">
          {/* Header Bảng màu */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Bảng màu sản phẩm
            </h3>

            <div className="flex items-center gap-2">
              <EntityHistoryButton
                aggregateType="PurchaseOrderProductDocument"
                parentId={product.id}
                title="Lịch sử: Tài liệu sản phẩm"
              />
              {!isReadOnly && (
                <Button
                  size="sm"
                  onClick={() => handleOpenUploadDoc("color_card")}
                  className="text-xs font-semibold shrink-0"
                >
                  <PlusIcon className="w-4 h-4 mr-1.5" />
                  Tải ảnh bảng màu lên
                </Button>
              )}
            </div>
          </div>

          {/* Thư viện hình ảnh bảng màu đã tải lên */}
          {paletteDocuments.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Hình ảnh bảng màu đã tải lên ({paletteDocuments.length})</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {paletteDocuments.map((doc) => {
                  const imgName = doc.fileName || doc.title;
                  return (
                    <div
                      key={doc.documentId}
                      className="group relative rounded-xl border border-gray-200 bg-white overflow-hidden shadow-xs dark:border-gray-800 dark:bg-gray-900 transition-all hover:shadow-md"
                    >
                      <div className="aspect-square bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                        {doc.fileUrl ? (
                          <img
                            src={doc.fileUrl}
                            alt={imgName}
                            className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                          />
                        ) : (
                          <StyleImagePlaceholder className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                        )}
                      </div>
                      <div className="p-3 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate" title={imgName}>
                          {imgName}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{formatDateTime(doc.linkedAt)}</p>

                        <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-100 dark:border-gray-800">
                          <button
                            type="button"
                            disabled={!doc.fileUrl}
                            onClick={() =>
                              doc.fileUrl &&
                              setPalettePreviewModalUrl({ url: doc.fileUrl, name: imgName })
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                            <span>Xem</span>
                          </button>

                          {!readOnlyManagement && (
                            <a
                              href={doc.fileUrl || undefined}
                              download={imgName}
                              className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                              title="Tải về"
                            >
                              <DownloadIcon className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => handleUnlinkDocument(doc.documentId)}
                              className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Xóa ảnh"
                            >
                              <TrashBinIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs text-gray-400 italic">Chưa có ảnh bảng màu nào được tải lên.</p>
            </div>
          )}

          {/* Modal xem trước ảnh bảng màu phóng to */}
          {palettePreviewModalUrl && (
            <Modal
              open={Boolean(palettePreviewModalUrl)}
              onClose={() => setPalettePreviewModalUrl(null)}
              title={`Xem ảnh bảng màu: ${palettePreviewModalUrl.name}`}
              size="xl"
            >
              <div className="p-4 flex items-center justify-center max-h-[75vh] overflow-auto">
                <img
                  src={palettePreviewModalUrl.url}
                  alt={palettePreviewModalUrl.name}
                  className="max-h-[70vh] w-auto object-contain rounded-xl shadow-md"
                />
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: QUY TRÌNH CÔNG ĐOẠN & KIM (ÁP DỤNG TRỰC TIẾP STYLEOPERATIONSTEPTABLE)*/}
      {/* ========================================================================= */}
      {activeTab === "steps" && (
        <StyleOperationStepTable
          styleId={product.id}
          steps={mappedSteps}
          cmBaseDays={product.as3bCmBaseDays || 30}
          canEdit={!isReadOnly}
          canExport={!readOnlyManagement}
          onEditingChange={setIsOperationStepsEditing}
          onSave={handleSaveSteps}
          imageUrl={imageUrl}
          styleCode={product.productCode}
          styleName={product.productName}
          onImageChange={isReadOnly ? undefined : (file) => void handleUploadAndSaveImage(file)}
          historyAggregateType="PurchaseOrderProductOperationStep"
        />
      )}

      {/* ========================================================================= */}
      {/* TAB NGUYÊN PHỤ LIỆU (BOM) VỚI BẢNG INLINE TABLE                          */}
      {/* ========================================================================= */}
      {activeTab === "bom" && (
        <PoProductBomTab
          productId={product.id}
          productCode={product.productCode}
          productName={product.productName}
          poId={poId || ""}
          isProductLocked={isProductLocked || isPoLocked}
          readOnly={readOnlyManagement}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TÀI LIỆU SẢN XUẤT (ÁP DỤNG TRỰC TIẾP STYLEPRODUCTIONDOCTAB)       */}
      {/* ========================================================================= */}
      {activeTab === "production_doc" && (
        <StyleProductionDocTab
          poId={poId}
          productId={productId}
          styleName={product.productName}
          styleImageUrl={imageUrl || product.structureImageVersionId || undefined}
          readOnly={isReadOnly}
          onEditingChange={setIsProductionDocEditing}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ĐỢT MAY MẪU (SAMPLES) — dùng chung UI với "Lần may mẫu" bên Mẫu Fit */}
      {/* ========================================================================= */}
      {activeTab === "samples" && poId && productId && (
        <PoProductSampleRoundsTab
          poId={poId}
          productId={productId}
          readOnly={isReadOnly}
          canDownload={!readOnlyManagement}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 5: TÀI LIỆU ĐÍNH KÈM TỪ PO & TECHPACK (3 MỤC CÓ VERSIONING)           */}
      {/* ========================================================================= */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          {/* Header tổng quan */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-theme-base font-bold text-gray-900 dark:text-white">
              Tài liệu đính kèm
            </h3>

            <div className="flex items-center gap-2">
              <EntityHistoryButton
                aggregateType="PurchaseOrderProductDocument"
                parentId={product.id}
                title="Lịch sử: Tài liệu sản phẩm"
              />
              {!isReadOnly && (
                <Button
                  size="sm"
                  onClick={() => openLinkPoDocModal(null)}
                  className="shrink-0"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Gán tài liệu từ kho PO
                </Button>
              )}
            </div>
          </div>

          {/* Banner thông báo khi sản phẩm bị khóa */}
          {isProductLocked && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 flex items-center gap-2.5">
              <LockIcon className="w-4 h-4 shrink-0 text-rose-600" />
              <span>
                <strong>{readOnlyManagement ? "Khu Quản lý chỉ xem:" : "Sản phẩm đã bị khóa:"}</strong>{" "}
                {readOnlyManagement
                  ? "Bạn có thể xem thông tin và xem trước tài liệu; không thể chỉnh sửa hoặc tải file xuống."
                  : "Chế độ chỉ đọc. Bạn có thể xem trước nội dung hoặc tải về các phiên bản của tài liệu, nhưng không thể thêm, xóa hoặc cập nhật phiên bản mới."}
              </span>
            </div>
          )}

          {/* ── MỤC 1: PO CHI TIẾT ── */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-3.5">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 font-bold text-xs border border-brand-200/80 dark:bg-brand-950/60 dark:text-brand-400 dark:border-brand-900/60">
                  1
                </span>
                <div>
                  <h4 className="font-bold text-sm text-brand-600 dark:text-brand-400 flex items-center gap-2">
                    PO Chi Tiết
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                      {poDocuments.length} file
                    </span>
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    File PO chi tiết, đơn đặt hàng gốc từ khách hàng
                  </p>
                </div>
              </div>

              {!isReadOnly && (
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium text-gray-700 border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    onClick={() => openLinkPoDocModal("po_detail")}
                  >
                    <PlusIcon className="w-3.5 h-3.5 mr-1" />
                    Gán từ kho PO
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium text-gray-700 border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    onClick={() => handleOpenUploadDoc("production_doc")}
                  >
                    <PlusIcon className="w-3.5 h-3.5 mr-1" />
                    Tải file PO lên
                  </Button>
                </div>
              )}
            </div>

            {poDocuments.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400 italic bg-gray-50/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 dark:bg-gray-800/20">
                {isReadOnly
                  ? "Chưa có file PO chi tiết nào được đính kèm."
                  : 'Chưa có file PO chi tiết nào. Bấm "Tải file PO lên" hoặc "Gán từ kho PO".'}
              </div>
            ) : (
              <div className="space-y-2.5">
                {poDocuments.map((doc) => (
                  <ProductVersionedFileGroup
                    key={doc.documentId}
                    doc={doc}
                    canEdit={!isReadOnly}
                    canDownload={!readOnlyManagement}
                    onUploadVersion={handleOpenUploadVersion}
                    onDelete={handleUnlinkDocument}
                    onPreview={handlePreviewDoc}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── MỤC 2: TECHPACK ── */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-3.5">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 font-bold text-xs border border-brand-200/80 dark:bg-brand-950/60 dark:text-brand-400 dark:border-brand-900/60">
                  2
                </span>
                <div>
                  <h4 className="font-bold text-sm text-brand-600 dark:text-brand-400 flex items-center gap-2">
                    TechPack
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                      {techPackDocuments.length} file
                    </span>
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    Bảng thông số kỹ thuật, tài liệu may, form dáng và rập mẫu
                  </p>
                </div>
              </div>

              {!isReadOnly && (
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium text-gray-700 border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    onClick={() => openLinkPoDocModal("tech_pack")}
                  >
                    <PlusIcon className="w-3.5 h-3.5 mr-1" />
                    Gán từ kho PO
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium text-gray-700 border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    onClick={() => handleOpenUploadDoc("tech_pack")}
                  >
                    <PlusIcon className="w-3.5 h-3.5 mr-1" />
                    Tải TechPack lên
                  </Button>
                </div>
              )}
            </div>

            {techPackDocuments.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400 italic bg-gray-50/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 dark:bg-gray-800/20">
                Chưa có tài liệu TechPack nào. Bấm "Tải TechPack lên" hoặc "Gán từ kho PO".
              </div>
            ) : (
              <div className="space-y-2.5">
                {techPackDocuments.map((doc) => (
                  <ProductVersionedFileGroup
                    key={doc.documentId}
                    doc={doc}
                    canEdit={!isReadOnly}
                    canDownload={!readOnlyManagement}
                    onUploadVersion={handleOpenUploadVersion}
                    onDelete={handleUnlinkDocument}
                    onPreview={handlePreviewDoc}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── MỤC 3: KHÁC ── */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-3.5">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 font-bold text-xs border border-brand-200/80 dark:bg-brand-950/60 dark:text-brand-400 dark:border-brand-900/60">
                  3
                </span>
                <div>
                  <h4 className="font-bold text-sm text-brand-600 dark:text-brand-400 flex items-center gap-2">
                    Khác
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                      {otherDocuments.length} file
                    </span>
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    Tài liệu vải mẫu, nhãn mác, biên bản và các file đính kèm phụ trợ khác
                  </p>
                </div>
              </div>

              {!isReadOnly && (
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium text-gray-700 border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    onClick={() => openLinkPoDocModal("other")}
                  >
                    <PlusIcon className="w-3.5 h-3.5 mr-1" />
                    Gán từ kho PO
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium text-gray-700 border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    onClick={() => handleOpenUploadDoc("other")}
                  >
                    <PlusIcon className="w-3.5 h-3.5 mr-1" />
                    Tải file khác
                  </Button>
                </div>
              )}
            </div>

            {otherDocuments.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400 italic bg-gray-50/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 dark:bg-gray-800/20">
                Chưa có tài liệu phụ trợ nào khác. Bấm "Tải file khác" hoặc "Gán từ kho PO".
              </div>
            ) : (
              <div className="space-y-2.5">
                {otherDocuments.map((doc) => (
                  <ProductVersionedFileGroup
                    key={doc.documentId}
                    doc={doc}
                    canEdit={!isReadOnly}
                    canDownload={!readOnlyManagement}
                    onUploadVersion={handleOpenUploadVersion}
                    onDelete={handleUnlinkDocument}
                    onPreview={handlePreviewDoc}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: LỊCH SỬ THAY ĐỔI TRẠNG THÁI (GOM NHÓM TINH GỌN)                    */}
      {/* ========================================================================= */}

      {/* ─── HỘP THOẠI XÁC NHẬN RỜI TRANG KHI CHƯA LƯU (UNSAVEDCHANGESDIALOG) ──── */}
      <UnsavedChangesDialog
        isOpen={!readOnlyManagement && (pendingTab !== null || pendingNavigation !== null)}
        onConfirmLeave={handleConfirmLeaveTab}
        onCancel={() => {
          setPendingTab(null);
          setPendingNavigation(null);
        }}
      />

      {/* ─── MODAL CHỈNH SỬA THÔNG TIN SẢN PHẨM ─────────────────────────────────── */}
      {isEditModalOpen && !isReadOnly && (
        <Modal
          open={isEditModalOpen}
          onClose={() => {
            if (!updateProductMutation.isPending) setIsEditModalOpen(false);
          }}
          title="Chỉnh sửa thông tin sản phẩm"
          size="lg"
        >
          <p className="-mt-2 mb-4 text-xs text-gray-500 dark:text-gray-400">
            Cập nhật các thông số chi tiết và cơ cấu màu sắc / size của sản phẩm.
          </p>
          <form onSubmit={handleSaveEditProduct} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mã sản phẩm <span className="text-red-500">*</span>
                </label>
                <input
                  ref={editProductCodeInputRef}
                  type="text"
                  value={editProductCode}
                  onChange={(e) => {
                    setEditProductCode(e.target.value);
                    if (editFieldErrors.productCode)
                      setEditFieldErrors((prev) => ({ ...prev, productCode: undefined }));
                  }}
                  required
                  className={`mt-1 h-10 w-full rounded-lg border px-3 font-mono text-sm text-gray-900 dark:text-white dark:bg-gray-800 transition-colors focus:outline-none focus:ring-2 ${
                    editFieldErrors.productCode
                      ? "border-error-400 focus:border-error-500 focus:ring-error-500/20 dark:border-error-500"
                      : "border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                />
                {editFieldErrors.productCode && (
                  <p className="mt-1 text-xs font-medium text-error-600 dark:text-error-400">
                    {editFieldErrors.productCode}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tên sản phẩm <span className="text-red-500">*</span>
                </label>
                <input
                  ref={editProductNameInputRef}
                  type="text"
                  value={editProductName}
                  onChange={(e) => {
                    setEditProductName(e.target.value);
                    if (editFieldErrors.productName)
                      setEditFieldErrors((prev) => ({ ...prev, productName: undefined }));
                  }}
                  required
                  className={`mt-1 h-10 w-full rounded-lg border px-3 text-sm text-gray-900 dark:text-white dark:bg-gray-800 transition-colors focus:outline-none focus:ring-2 ${
                    editFieldErrors.productName
                      ? "border-error-400 focus:border-error-500 focus:ring-error-500/20 dark:border-error-500"
                      : "border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                />
                {editFieldErrors.productName && (
                  <p className="mt-1 text-xs font-medium text-error-600 dark:text-error-400">
                    {editFieldErrors.productName}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Dòng sản phẩm
                </label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  placeholder="VD: Áo polo"
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hạn giao hàng
                </label>
                <input
                  type="date"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Chu kỳ CM (ngày)
                </label>
                <input
                  type="number"
                  min="1"
                  value={editCmBaseDays}
                  onChange={(e) => setEditCmBaseDays(Number(e.target.value))}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 font-mono text-sm text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mô tả đặc điểm &amp; Ghi chú chất liệu
              </label>
              <textarea
                rows={2}
                value={editMaterialNote}
                onChange={(e) => setEditMaterialNote(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Nhập chất liệu, thành phần sợi, lưu ý may hoặc đặc điểm của sản phẩm..."
              />
            </div>

            {/* Trình soạn thảo Phân bổ Màu sắc & Cỡ số */}
            <div
              ref={editColorsCardRef}
              className="pt-2 border-t border-gray-100 dark:border-gray-800"
            >
              <ProductColorSizeEditor
                colors={editColors}
                onChange={(next) => {
                  setEditColors(next);
                  if (editFieldErrors.colors)
                    setEditFieldErrors((prev) => ({ ...prev, colors: undefined }));
                }}
                showValidationErrors={Boolean(editFieldErrors.colors)}
              />
              {editFieldErrors.colors && (
                <p className="mt-1 text-xs font-medium text-error-600 dark:text-error-400">
                  {editFieldErrors.colors}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                disabled={updateProductMutation.isPending}
              >
                Hủy
              </Button>
              <Button size="sm" type="submit" disabled={updateProductMutation.isPending}>
                {updateProductMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL GÁN TÀI LIỆU TỪ KHO PO ───────────────────────────────────────── */}
      {isLinkPoDocOpen && !isReadOnly && (
        <Modal
          open={isLinkPoDocOpen}
          onClose={() => {
            setIsLinkPoDocOpen(false);
            setLinkDocFilter(null);
          }}
          title={
            linkDocFilter === "po_detail"
              ? "Gán tài liệu từ kho PO — mục PO Chi Tiết"
              : linkDocFilter === "tech_pack"
              ? "Gán tài liệu từ kho PO — mục TechPack"
              : linkDocFilter === "other"
              ? "Gán tài liệu từ kho PO — mục Khác"
              : "Chọn tài liệu từ kho PO để gán vào sản phẩm"
          }
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-xs text-gray-500">
              {linkDocFilter ? (
                <>Chỉ hiện tài liệu đã phân loại đúng mục này ở kho PO — để mục nào ra file đúng mục đó, không lẫn qua "Khác".</>
              ) : (
                <>Chọn tài liệu từ kho PO để gán vào sản phẩm. Tài liệu sẽ tự động nằm đúng mục theo phân loại gốc bên ngoài (<strong>PO Chi Tiết</strong>, <strong>TechPack</strong> hoặc <strong>Khác</strong>).</>
              )}
            </p>

            {(() => {
              const visibleDocs = poStoreDocuments.filter((d) => {
                if (linkDocFilter === "po_detail") return isPoDetailPurpose(d.purpose);
                if (linkDocFilter === "tech_pack") return isTechPackPurpose(d.purpose);
                if (linkDocFilter === "other")
                  return !isPoDetailPurpose(d.purpose) && !isTechPackPurpose(d.purpose);
                return true;
              });

              if (visibleDocs.length === 0) {
                return (
                  <p className="text-xs text-gray-400 italic">
                    {linkDocFilter
                      ? "Kho PO chưa có tài liệu nào thuộc đúng mục này."
                      : "Đơn hàng PO này chưa có tài liệu nào trong kho tài liệu chung."}
                  </p>
                );
              }

              return (
              <div className="max-h-80 overflow-y-auto space-y-2">
                {visibleDocs.map((d) => {
                  const alreadyLinked = productDocuments.some((doc) => doc.documentId === d.documentId);
                  const isPo = isPoDetailPurpose(d.purpose);
                  const isTp = isTechPackPurpose(d.purpose);
                  const categoryName = isPo ? "PO Chi Tiết" : isTp ? "TechPack" : "Khác";

                  return (
                    <div
                      key={d.documentId}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 hover:border-gray-300 transition"
                    >
                      <div className="min-w-0 pr-3 space-y-1">
                        <span className="block font-semibold text-xs text-gray-900 dark:text-white truncate">
                          {d.title || d.fileName || d.documentCode}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                              isPo
                                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900"
                                : isTp
                                ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900"
                                : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                            }`}
                          >
                            Phân loại: {categoryName}
                          </span>
                        </div>
                      </div>

                      {alreadyLinked ? (
                        <span className="text-xs text-emerald-600 font-semibold px-2.5 py-1 bg-emerald-50 rounded-lg dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                          Đã gán
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="font-medium text-xs"
                          onClick={() => handleLinkExistingPoDoc(d.documentId)}
                        >
                          + Gán vào sản phẩm
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
              );
            })()}
            <div className="flex justify-end pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsLinkPoDocOpen(false);
                  setLinkDocFilter(null);
                }}
              >
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── MODAL XÁC NHẬN KHÓA SẢN PHẨM (ĐANG XỬ LÝ -> KHÓA) ───────────────── */}
      {isLockModalOpen && !readOnlyManagement && (
        <Modal
          open={isLockModalOpen}
          onClose={() => {
            if (!updateStatusMutation.isPending) setIsLockModalOpen(false);
          }}
          title="Khóa sản phẩm sau khi xử lý xong"
          size="md"
        >
          <form onSubmit={handleConfirmLockProduct} className="space-y-4">
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
              <div className="flex gap-2.5 items-start">
                <AlertHexaIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-900 dark:text-amber-200">
                    Bạn sắp khóa sản phẩm "{product.productName}" ({product.productCode}).
                  </p>
                  <p className="text-amber-800 dark:text-amber-400">
                    Sản phẩm hiện đang ở giai đoạn <strong>Đang Xử Lý</strong>. Sau khi xác nhận <strong>Khoá</strong>, quy trình xử lý sản phẩm được coi là đã hoàn tất và toàn bộ dữ liệu (thông số, bảng công đoạn, tài liệu kỹ thuật) sẽ chuyển sang chế độ <strong>Chỉ đọc (Read-only)</strong> để bảo vệ dữ liệu.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Lý do / Ghi chú khóa sản phẩm (Tùy chọn)
              </label>
              <textarea
                rows={3}
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                placeholder="Ví dụ: Đã hoàn tất bảng công đoạn và tài liệu kỹ thuật..."
                className="w-full rounded-xl border border-gray-300 bg-white p-3 text-xs text-gray-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsLockModalOpen(false)}
                disabled={updateStatusMutation.isPending}
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                type="submit"
                disabled={updateStatusMutation.isPending}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-1.5"
              >
                <LockIcon className="w-4 h-4 shrink-0" />
                <span>{updateStatusMutation.isPending ? "Đang khóa..." : "Xác nhận Khóa sản phẩm"}</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL MỞ KHÓA SẢN PHẨM */}
      {isUnlockModalOpen && !readOnlyManagement && (
        <Modal
          open={isUnlockModalOpen}
          onClose={() => setIsUnlockModalOpen(false)}
          title="Mở khóa sản phẩm"
          size="md"
        >
          <form onSubmit={handleConfirmUnlockProduct} className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <UnlockIcon className="w-5 h-5 shrink-0" />
              </span>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Mở khóa sản phẩm
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {product.productName} ({product.productCode})
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
              Sản phẩm sẽ được chuyển từ <strong>Khoá</strong> về <strong>Đang Xử Lý</strong>. Bạn và nhóm sản xuất sẽ có thể tiếp tục chỉnh sửa thông tin, bảng công đoạn và tài liệu kỹ thuật.
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Lý do mở khóa (Tùy chọn)
              </label>
              <textarea
                rows={2}
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                placeholder="Ví dụ: Cần cập nhật bổ sung công đoạn mới..."
                className="w-full rounded-xl border border-gray-300 bg-white p-3 text-xs text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsUnlockModalOpen(false)}
                disabled={updateStatusMutation.isPending}
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                type="submit"
                disabled={updateStatusMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
              >
                <UnlockIcon className="w-4 h-4 shrink-0" />
                <span>{updateStatusMutation.isPending ? "Đang mở khóa..." : "Xác nhận Mở khóa"}</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL TẢI LÊN TÀI LIỆU SẢN PHẨM TRỰC TIẾP ──────────────────────────── */}
      {isUploadDocOpen && !isReadOnly && (
        <Modal
          open={isUploadDocOpen}
          onClose={() => {
            if (!uploadProductDocMutation.isPending) setIsUploadDocOpen(false);
          }}
          title={
            docUploadCategory === "production_doc"
              ? "Tải lên file PO Chi Tiết"
              : docUploadCategory === "tech_pack"
              ? "Tải lên tài liệu TechPack"
              : docUploadCategory === "color_card"
              ? "Tải lên ảnh bảng màu"
              : "Tải lên tài liệu phụ trợ khác"
          }
          size="md"
        >
          <form onSubmit={handleConfirmUploadDoc} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Chọn tệp tin từ máy tính
              </label>
              <input
                type="file"
                required
                accept={docUploadCategory === "color_card" ? "image/*" : undefined}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setDocUploadFile(e.target.files[0]);
                  }
                }}
                className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-950/60 dark:file:text-blue-300 cursor-pointer"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                {docUploadCategory === "color_card"
                  ? "Hỗ trợ hình ảnh (PNG, JPG, WebP), tối đa 25MB."
                  : "Hỗ trợ các định dạng: Excel (.xlsx, .xls), PDF, Word (.docx), hình ảnh (PNG, JPG, WebP), tối đa 25MB."}
              </p>
            </div>

            {docUploadFile && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs dark:border-gray-800 dark:bg-gray-850 space-y-1">
                <div className="font-semibold text-gray-900 dark:text-white truncate">
                  {docUploadFile.name}
                </div>
                <div className="text-[11px] text-gray-400">
                  Dung lượng: {(docUploadFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsUploadDocOpen(false)}
                disabled={uploadProductDocMutation.isPending}
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                type="submit"
                disabled={!docUploadFile || uploadProductDocMutation.isPending}
              >
                {uploadProductDocMutation.isPending ? "Đang tải lên..." : "Xác nhận tải lên"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL CẬP NHẬT PHIÊN BẢN MỚI CHO TÀI LIỆU ─────────────────────────── */}
      {isUploadVersionOpen && versionTargetInfo && !isReadOnly && (
        <Modal
          open={isUploadVersionOpen}
          onClose={() => {
            if (!uploadVersionMutation.isPending) setIsUploadVersionOpen(false);
          }}
          title={`Cập nhật phiên bản mới: v${versionTargetInfo.currentVersionNo + 1}`}
          size="md"
        >
          <form onSubmit={handleConfirmUploadVersion} className="space-y-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
              <div className="font-semibold">
                Tài liệu gốc: {versionTargetInfo.title}
              </div>
              <div className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
                Phiên bản hiện tại: <strong>v{versionTargetInfo.currentVersionNo}</strong> → Phiên bản mới: <strong>v{versionTargetInfo.currentVersionNo + 1}</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Chọn tệp tin phiên bản mới từ khách hàng
              </label>
              <input
                type="file"
                required
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setNewVersionFile(e.target.files[0]);
                  }
                }}
                className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-950/60 dark:file:text-blue-300 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Lý do / Ghi chú thay đổi từ khách hàng <span className="text-rose-500 font-bold">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={newVersionReason}
                onChange={(e) => setNewVersionReason(e.target.value)}
                placeholder="Bắt buộc: Nhập chi tiết lý do/yêu cầu thay đổi từ khách hàng..."
                className="w-full rounded-xl border border-gray-300 bg-white p-3 text-xs text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsUploadVersionOpen(false)}
                disabled={uploadVersionMutation.isPending}
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                type="submit"
                disabled={!newVersionFile || !newVersionReason.trim() || uploadVersionMutation.isPending}
              >
                {uploadVersionMutation.isPending
                  ? "Đang lưu..."
                  : `Xác nhận tải lên v${versionTargetInfo.currentVersionNo + 1}`}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL XEM TRƯỚC TÀI LIỆU KỸ THUẬT (PREVIEW) ───────────────────────── */}
      {previewDocItem && (
        <Modal
          open={Boolean(previewDocItem)}
          onClose={() => setPreviewDocItem(null)}
          title={`Xem trước: ${previewDocItem.fileName || previewDocItem.title || "Tài liệu"}`}
          size="xl"
        >
          <div className="min-h-[500px]">
            <PoSplitDocumentPreview
              poId={poId || ""}
              document={previewDocItem}
              onBack={() => setPreviewDocItem(null)}
            />
          </div>
        </Modal>
      )}

      {/* Toast Notification */}
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
