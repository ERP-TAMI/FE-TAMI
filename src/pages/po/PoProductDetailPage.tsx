import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Toast, Button, Modal } from "@/components/shared";
import {
  usePurchaseOrder,
  usePoProductDetail,
  useUpdatePoProduct,
  useUpdateProductStatus,
  useSaveProductOperationSteps,
  useCreateProductSampleRound,
  useUnlinkProductDocument,
  useLinkProductDocument,
  useUploadProductDocument,
  useUploadProductDocumentVersion,
} from "@/hooks/usePurchaseOrders";
import { useUploadImage } from "@/hooks/useUploadImage";
import { useToast } from "@/hooks/useToast";
import { getApiError } from "@/lib/apiError";
import { validateImageFile } from "@/lib/validateImageFile";
import { resolveImageUrl } from "@/lib/imageUtils";
import {
  InfoIcon,
  DocsIcon,
  PageIcon,
  PlusIcon,
  FileIcon,
  TimeIcon,
  EyeIcon,
  LockIcon,
  UnlockIcon,
  AlertHexaIcon,
  AngleDownIcon,
  BoltIcon,
  BoxIcon,
  TableIcon,
  GridIcon,
  DownloadIcon,
  TrashBinIcon,
} from "@/icons";
import { StyleImagePlaceholder } from "@/components/features/styles/StyleImagePlaceholder";
import { StyleOperationStepTable } from "@/components/features/styles/StyleOperationStepTable";
import { StyleProductionDocTab } from "@/components/features/production-docs/StyleProductionDocTab";
import { UnsavedChangesDialog } from "@/components/features/styles/UnsavedChangesDialog";
import { ProductStatusBadge } from "@/components/features/po/ProductStatusBadge";
import { ProductColorSizeEditor } from "@/components/features/po/ProductColorSizeEditor";
import { ProductVersionedFileGroup } from "@/components/features/po/ProductVersionedFileGroup";
import { PoSplitDocumentPreview } from "@/components/features/po/PoSplitDocumentPreview";
import type {
  ProductColorItem,
  ProductDocumentItem,
  PurchaseOrderDocumentVersionItem,
  PurchaseOrderStatusHistoryItem,
} from "@/types/po";
import type { StyleOperationStepItem } from "@/api/styleOperationStepsApi";

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



export default function PoProductDetailPage() {
  const { id: poId, productId, tab } = useParams<{
    id: string;
    productId: string;
    tab?: string;
  }>();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const isSizesTab = tab === "sizes" || tab === "size-breakdown" || tab === "size";
  const isColorsTab = tab === "colors" || tab === "color-palette" || tab === "palette";
  const isStepsTab = tab === "operation-steps" || tab === "steps";
  const isProductionDocTab = tab === "production-doc";
  const isSamplesTab = tab === "samples";
  const isDocumentsTab = tab === "documents";
  const isHistoryTab = tab === "history";

  const activeTab:
    | "general"
    | "sizes"
    | "colors"
    | "steps"
    | "production_doc"
    | "samples"
    | "documents"
    | "history" = isSizesTab
    ? "sizes"
    : isColorsTab
    ? "colors"
    : isStepsTab
    ? "steps"
    : isProductionDocTab
    ? "production_doc"
    : isSamplesTab
    ? "samples"
    : isDocumentsTab
    ? "documents"
    : isHistoryTab
    ? "history"
    : "general";

  const [isProductionDocEditing, setIsProductionDocEditing] = useState(false);
  const [isOperationStepsEditing, setIsOperationStepsEditing] = useState(false);
  const [pendingTab, setPendingTab] = useState<
    | "general"
    | "sizes"
    | "colors"
    | "steps"
    | "production_doc"
    | "samples"
    | "documents"
    | "history"
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
      | "production_doc"
      | "samples"
      | "documents"
      | "history",
  ) => {
    if (!poId || !productId) return;
    if (nextTab === "sizes") {
      navigate(`/po/${poId}/products/${productId}/sizes`);
    } else if (nextTab === "colors") {
      navigate(`/po/${poId}/products/${productId}/colors`);
    } else if (nextTab === "production_doc") {
      navigate(`/po/${poId}/products/${productId}/production-doc`);
    } else if (nextTab === "steps") {
      navigate(`/po/${poId}/products/${productId}/operation-steps`);
    } else if (nextTab === "samples") {
      navigate(`/po/${poId}/products/${productId}/samples`);
    } else if (nextTab === "documents") {
      navigate(`/po/${poId}/products/${productId}/documents`);
    } else if (nextTab === "history") {
      navigate(`/po/${poId}/products/${productId}/history`);
    } else {
      navigate(`/po/${poId}/products/${productId}/detail`);
    }
  };

  const handleTabChange = (
    nextTab:
      | "general"
      | "sizes"
      | "colors"
      | "steps"
      | "production_doc"
      | "samples"
      | "documents"
      | "history",
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

  const updateProductMutation = useUpdatePoProduct();
  const updateStatusMutation = useUpdateProductStatus();
  const saveStepsMutation = useSaveProductOperationSteps();
  const createSampleMutation = useCreateProductSampleRound();
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

  // Local state for image handling (phong cách GeneralTab)
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for PO document picker modal
  const [isLinkPoDocOpen, setIsLinkPoDocOpen] = useState(false);

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
  } | null>(null);
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [newVersionReason, setNewVersionReason] = useState<string>("");

  // Local state for document preview modal
  const [previewDocItem, setPreviewDocItem] = useState<(ProductDocumentItem & { versionId?: string }) | null>(null);

  // Local state for sample round modal
  const [isAddSampleOpen, setIsAddSampleOpen] = useState(false);
  const [sampleFeedback, setSampleFeedback] = useState("");
  const [sampleStatus, setSampleStatus] = useState("Đang may");

  // Local state cho quản lý ảnh bảng màu sản phẩm (Tab 3: Bảng màu)
  interface ColorPaletteItem {
    id: string;
    url: string;
    name: string;
    size: number;
    uploadedAt: string;
  }
  const [paletteImages, setPaletteImages] = useState<ColorPaletteItem[]>([]);
  const [palettePreviewModalUrl, setPalettePreviewModalUrl] = useState<{ url: string; name: string } | null>(null);
  const paletteFileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadPaletteFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const newImg: ColorPaletteItem = {
      id: `palette-${Date.now()}`,
      url,
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };
    setPaletteImages((prev) => [newImg, ...prev]);
    showToast(`Đã tải lên ảnh bảng màu "${file.name}" thành công!`);
    if (paletteFileInputRef.current) paletteFileInputRef.current.value = "";
  };

  const handleDeletePaletteImage = (id: string) => {
    setPaletteImages((prev) => prev.filter((img) => img.id !== id));
    showToast("Đã xóa ảnh bảng màu.");
  };

  // Local state cho xem lịch sử tinh gọn
  const [historyViewMode, setHistoryViewMode] = useState<"grouped" | "timeline">("grouped");
  const [expandedHistoryGroups, setExpandedHistoryGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (product?.structureImageVersionId) {
      setImageUrl(resolveImageUrl(product.structureImageVersionId));
    } else {
      setImageUrl(null);
    }
  }, [product?.structureImageVersionId]);

  // Danh sách các size duy nhất từ các màu sắc để dựng bảng ma trận
  const uniqueSizes = useMemo(() => {
    const set = new Set<string>();
    const list: string[] = [];
    (product?.colors || []).forEach((c) => {
      (c.sizes || []).forEach((s) => {
        if (s.sizeLabel && !set.has(s.sizeLabel)) {
          set.add(s.sizeLabel);
          list.push(s.sizeLabel);
        }
      });
    });
    return list;
  }, [product?.colors]);

  // Gom nhóm các sự kiện lịch sử theo từng loại thao tác chung
  const groupedHistory = useMemo(() => {
    const rawItems: PurchaseOrderStatusHistoryItem[] = (product?.statusHistory || []) as PurchaseOrderStatusHistoryItem[];
    const sorted = [...rawItems].sort(
      (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
    );

    const lockItems: PurchaseOrderStatusHistoryItem[] = [];
    const stepItems: PurchaseOrderStatusHistoryItem[] = [];
    const createItems: PurchaseOrderStatusHistoryItem[] = [];
    const otherItems: PurchaseOrderStatusHistoryItem[] = [];

    for (const item of sorted) {
      const act = (item.action || "").toLowerCase();
      const rsn = (item.reason || "").toLowerCase();

      if (
        act === "locked" ||
        act === "unlocked" ||
        act.includes("lock") ||
        rsn.includes("khóa") ||
        rsn.includes("mở khóa")
      ) {
        lockItems.push(item);
      } else if (
        act.includes("step") ||
        act.includes("operation") ||
        rsn.includes("công đoạn") ||
        rsn.includes("bước")
      ) {
        stepItems.push(item);
      } else if (
        act === "created" ||
        act === "imported_from_fit" ||
        act.includes("import") ||
        rsn.includes("tạo mới") ||
        rsn.includes("khởi tạo")
      ) {
        createItems.push(item);
      } else {
        otherItems.push(item);
      }
    }

    const groups = [];

    if (lockItems.length > 0) {
      groups.push({
        id: "lock_group",
        title: "Lịch sử Khóa & Mở khóa sản phẩm",
        type: "lock",
        items: lockItems,
        latestTime: lockItems[0].changedAt,
        latestStatus: lockItems[0].newStatus,
        latestReason: lockItems[0].reason,
      });
    }

    if (stepItems.length > 0) {
      groups.push({
        id: "step_group",
        title: "Quy trình công đoạn sản xuất & Định mức",
        type: "step",
        items: stepItems,
        latestTime: stepItems[0].changedAt,
        latestReason: stepItems[0].reason,
      });
    }

    if (createItems.length > 0) {
      groups.push({
        id: "create_group",
        title: "Khởi tạo & Nhập mẫu sản phẩm",
        type: "create",
        items: createItems,
        latestTime: createItems[0].changedAt,
        latestReason: createItems[0].reason,
      });
    }

    if (otherItems.length > 0) {
      groups.push({
        id: "other_group",
        title: "Các cập nhật trạng thái khác",
        type: "other",
        items: otherItems,
        latestTime: otherItems[0].changedAt,
        latestStatus: otherItems[0].newStatus,
        latestReason: otherItems[0].reason,
      });
    }

    return groups;
  }, [product?.statusHistory]);

  const totalBySize = useMemo(() => {
    const map: Record<string, number> = {};
    (product?.colors || []).forEach((c) => {
      (c.sizes || []).forEach((s) => {
        map[s.sizeLabel] = (map[s.sizeLabel] || 0) + (Number(s.quantity) || 0);
      });
    });
    return map;
  }, [product?.colors]);

  const handleOpenEditModal = () => {
    if (!product) return;
    setEditProductCode(product.productCode);
    setEditProductName(product.productName);
    setEditCategory(product.category || "");
    setEditMaterialNote(product.materialNote || "");
    setEditDeadline(product.deadline ? product.deadline.split("T")[0] : "");
    setEditCmBaseDays(product.as3bCmBaseDays || 30);
    setEditColors(
      product.colors && product.colors.length > 0
        ? JSON.parse(JSON.stringify(product.colors))
        : [],
    );
    setIsEditModalOpen(true);
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poId || !productId) return;
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
          colors: editColors,
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
      if (!poId || !productId) return;
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
    [poId, productId, uploadImage, updateProductMutation, showToast],
  );

  const clearLocalImage = useCallback(async () => {
    if (!poId || !productId) return;
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
  }, [poId, productId, updateProductMutation, showToast]);

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (activeTab !== "general") return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) void handleUploadAndSaveImage(file);
        }
      }
    },
    [activeTab, handleUploadAndSaveImage],
  );

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleUploadAndSaveImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) void handleUploadAndSaveImage(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const isProductLocked = product?.status === "closed";
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [lockReason, setLockReason] = useState("");
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");



  const handleConfirmLockProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poId || !productId || !product) return;
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
    if (!poId || !productId || !product) return;
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
    if (!poId || !productId) return;
    try {
      const cleanedSteps = (stepsData || []).map((step, orderIndex) => ({
        id: step.id && !step.id.startsWith("temp-") ? String(step.id) : undefined,
        stepName: step.stepName || "",
        description: step.description || undefined,
        timePerPiece: Number(step.timePerPiece) || 0,
        ssv: Number(step.ssv) || 0,
        targetTotal: Number(step.targetTotal) || 0,
        note: step.note || undefined,
        orderIndex,
        isGroup: Boolean(step.isGroup),
        stageId: step.stageId ? String(step.stageId) : undefined,
        parentStepId: step.parentStepId ? String(step.parentStepId) : undefined,
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


  const handleAddSampleRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poId || !productId) return;
    try {
      await createSampleMutation.mutateAsync({
        poId,
        productId,
        input: {
          feedback: sampleFeedback.trim() || undefined,
          status: sampleStatus,
        },
      });
      showToast("Đã thêm đợt may mẫu mới thành công.");
      setIsAddSampleOpen(false);
      setSampleFeedback("");
    } catch (err: unknown) {
      const apiErr = getApiError(err, "Thêm đợt may mẫu thất bại.");
      showToast(apiErr.message, "error");
    }
  };

  const handleUnlinkDocument = async (documentId: string) => {
    if (!poId || !productId) return;
    try {
      await unlinkDocMutation.mutateAsync({ poId, productId, documentId });
      showToast("Đã gỡ liên kết tài liệu khỏi sản phẩm.");
    } catch (err: unknown) {
      const apiErr = getApiError(err, "Gỡ tài liệu thất bại.");
      showToast(apiErr.message, "error");
    }
  };

  const handleLinkExistingPoDoc = async (documentId: string) => {
    if (!poId || !productId) return;
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
    setDocUploadCategory(category);
    setDocUploadFile(null);
    setIsUploadDocOpen(true);
  };

  const handleConfirmUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poId || !productId || !docUploadFile) return;
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
  ) => {
    setVersionTargetInfo({ documentId, currentVersionNo, title });
    setNewVersionFile(null);
    setNewVersionReason("");
    setIsUploadVersionOpen(true);
  };

  const handleConfirmUploadVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poId || !productId || !versionTargetInfo || !newVersionFile) return;
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
          to={`/po/${poId}/products`}
          className="mt-4 inline-block rounded-md bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 transition-colors cursor-pointer"
        >
          Quay lại danh sách sản phẩm PO
        </Link>
      </div>
    );
  }



  // Chuyển đổi dữ liệu công đoạn cho StyleOperationStepTable
  const mappedSteps: StyleOperationStepItem[] = (product.operationSteps || []).map(
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

  // Phân nhóm tài liệu đính kèm: PO Chi Tiết, TechPack, Khác
  const poDocuments = (product.documents || []).filter((d) =>
    isPoDetailPurpose(d.purpose),
  );
  const techPackDocuments = (product.documents || []).filter((d) =>
    isTechPackPurpose(d.purpose),
  );
  const otherDocuments = (product.documents || []).filter(
    (d) => !isPoDetailPurpose(d.purpose) && !isTechPackPurpose(d.purpose),
  );

  return (
    <div className="space-y-6 pt-2 md:pt-3">
      {/* ─── 1. BREADCRUMB PHÂN CẤP TINH GỌN ────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <Link to="/dashboard" className="hover:text-gray-900 dark:hover:text-white transition-colors">
          Dashboard
        </Link>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <Link to="/po" className="hover:text-gray-900 dark:hover:text-white transition-colors">
          Đơn hàng PO
        </Link>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <Link
          to={`/po/${poId}/products`}
          className="font-mono hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {po?.poCode || "PO"}
        </Link>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <span className="font-mono font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[200px] sm:max-w-none">
          {product.productCode}
        </span>
      </nav>

      {/* ─── 2. UNIFIED PRODUCT HEADER CARD (BỐ CỤC CHUẨN GỌN GÀNG, SANG TRỌNG) ──── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Cột trái: Mã sản phẩm TO và ĐẦU TIÊN (Focus), Tên SP phụ trợ & Trạng thái */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-gray-900 dark:text-white">
                {product.productCode}
              </h1>
              {product.productName && (
                <span className="text-base sm:text-lg font-medium text-gray-600 dark:text-gray-300">
                  {product.productName}
                </span>
              )}
              <ProductStatusBadge status={product.status} />
            </div>
          </div>

          {/* Cột phải: Nhóm nút hành động */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              to={`/po/${poId}/products`}
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              ← Danh sách SP
            </Link>
            {!isProductLocked ? (
              <Button
                size="sm"
                onClick={() => setIsLockModalOpen(true)}
                disabled={updateStatusMutation.isPending}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-1.5"
              >
                <LockIcon className="w-4 h-4 shrink-0" />
                <span>Khóa sản phẩm</span>
              </Button>
            ) : (
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
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenEditModal}
              disabled={isProductLocked}
            >
              Chỉnh sửa
            </Button>
          </div>
        </div>

        {/* Lock Banner notification khi sản phẩm bị khóa */}
        {isProductLocked && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white shrink-0">
                <LockIcon className="w-3 h-3" />
              </span>
              <span>
                Sản phẩm này đã được <strong>Khoá</strong> sau khi xử lý hoàn tất. Quy trình công đoạn và các thông tin đã được chốt và chuyển sang chế độ <strong>Chỉ đọc</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsUnlockModalOpen(true)}
              disabled={updateStatusMutation.isPending}
              className="text-xs font-bold text-rose-700 underline hover:text-rose-900 dark:text-rose-300 dark:hover:text-white shrink-0 cursor-pointer"
            >
              Mở khoá để tiếp tục xử lý
            </button>
          </div>
        )}
      </div>

      {/* ─── 3. THANH TABS GẠCH CHÂN RIÊNG BIỆT ──────────────────── */}
      <div className="flex flex-wrap items-center justify-between border-b border-gray-200 dark:border-gray-800 pt-2 gap-2">
          <nav className="flex space-x-6 overflow-x-auto" aria-label="Tabs">
            <button
              type="button"
              onClick={() => handleTabChange("general")}
              className={`flex items-center gap-2 border-b-2 py-2.5 px-1 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "general"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <InfoIcon className="w-4 h-4" />
              Thông tin sản phẩm
            </button>

            {/* TAB 2: BẢNG SIZE (SIZE + MÀU) */}
            <button
              type="button"
              onClick={() => handleTabChange("sizes")}
              className={`flex items-center gap-2 border-b-2 py-2.5 px-1 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "sizes"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <TableIcon className="w-4 h-4" />
              Bảng size
              {uniqueSizes.length > 0 && (
                <span className="ml-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 text-xs text-brand-600 dark:text-brand-400">
                  {uniqueSizes.length} size
                </span>
              )}
            </button>

            {/* TAB 3: BẢNG MÀU (ẢNH BẢNG MÀU) */}
            <button
              type="button"
              onClick={() => handleTabChange("colors")}
              className={`flex items-center gap-2 border-b-2 py-2.5 px-1 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "colors"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <GridIcon className="w-4 h-4" />
              Bảng màu
              {(product.colors?.length || 0) > 0 && (
                <span className="ml-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 text-xs text-brand-600 dark:text-brand-400">
                  {product.colors?.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("steps")}
              className={`flex items-center gap-2 border-b-2 py-2.5 px-1 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "steps"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <DocsIcon className="w-4 h-4" />
              Quy trình công đoạn &amp; KIM
              {mappedSteps.length > 0 && (
                <span className="ml-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 text-xs text-brand-600 dark:text-brand-400">
                  {mappedSteps.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("production_doc")}
              className={`flex items-center gap-2 border-b-2 py-2.5 px-1 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "production_doc"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <PageIcon className="w-4 h-4" />
              Tài liệu sản xuất
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("samples")}
              className={`flex items-center gap-2 border-b-2 py-2.5 px-1 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "samples"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <EyeIcon className="w-4 h-4" />
              Đợt may mẫu
              {(product.sampleRounds?.length || 0) > 0 && (
                <span className="ml-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-400">
                  {product.sampleRounds?.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("documents")}
              className={`flex items-center gap-2 border-b-2 py-2.5 px-1 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "documents"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <FileIcon className="w-4 h-4" />
              Tài liệu đính kèm
              {(product.documents?.length || 0) > 0 && (
                <span className="ml-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-400">
                  {product.documents?.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("history")}
              className={`flex items-center gap-2 border-b-2 py-2.5 px-1 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "history"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <TimeIcon className="w-4 h-4" />
              Lịch sử ({product.statusHistory?.length || 0})
            </button>
          </nav>
        </div>

      {/* ========================================================================= */}
      {/* TAB 1: THÔNG TIN SẢN PHẨM (Y XÌ GENERALTAB CỦA MẪU FIT)                   */}
      {/* ========================================================================= */}
      {activeTab === "general" && (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-start pt-3">
          {/* Cột trái (5 cols / 40%): Visual Focus hình ảnh sản phẩm */}
          <div className="lg:col-span-5 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
              {imageUrl ? (
                <div className="relative group overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                  <img
                    src={imageUrl}
                    alt={product.productName}
                    className="aspect-[4/5] w-full object-contain"
                  />
                  <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg bg-white/90 px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-white backdrop-blur-xs dark:bg-gray-900/90 dark:text-gray-200 dark:hover:bg-gray-900 transition-colors cursor-pointer"
                    >
                      Thay ảnh
                    </button>
                    <button
                      type="button"
                      onClick={clearLocalImage}
                      className="rounded-lg bg-white/90 px-3.5 py-2 text-xs font-semibold text-red-600 shadow-xs hover:bg-white backdrop-blur-xs dark:bg-gray-900/90 dark:text-red-400 dark:hover:bg-gray-900 transition-colors cursor-pointer"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex aspect-[4/5] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                    isDragging
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30"
                      : "border-gray-200 hover:border-gray-300 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/40"
                  }`}
                >
                  <StyleImagePlaceholder className="h-32 w-32 text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Thêm ảnh sản phẩm
                  </p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Kéo thả ảnh vào đây hoặc nhấn <strong>Ctrl + V</strong>
                  </p>
                  <span className="mt-4 inline-flex items-center rounded-md bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-2xs border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    PNG, JPG, WebP · tối đa 5MB
                  </span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Cột phải (7 cols / 60%): Chi tiết thông số sản phẩm */}
          <div className="lg:col-span-7 space-y-7">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Thông tin sản phẩm
              </h3>
              <dl className="divide-y divide-gray-100 dark:divide-gray-800/80 border-t border-b border-gray-100 dark:border-gray-800/80">
                <div className="flex items-center py-4 text-base">
                  <dt className="w-1/3 shrink-0 font-semibold text-gray-600 dark:text-gray-400">
                    Mã sản phẩm
                  </dt>
                  <dd className="w-2/3 min-w-0 font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
                    {product.productCode}
                  </dd>
                </div>

                <div className="flex items-center py-4 text-base">
                  <dt className="w-1/3 shrink-0 font-semibold text-gray-600 dark:text-gray-400">
                    Tên sản phẩm
                  </dt>
                  <dd className="w-2/3 min-w-0 break-words text-xl font-bold text-gray-900 dark:text-white">
                    {product.productName}
                  </dd>
                </div>

                <div className="flex items-center py-4 text-base">
                  <dt className="w-1/3 shrink-0 font-semibold text-gray-600 dark:text-gray-400">
                    Dòng sản phẩm
                  </dt>
                  <dd className="w-2/3 min-w-0 break-words text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {product.category || "—"}
                  </dd>
                </div>

                <div className="flex items-center py-4 text-base">
                  <dt className="w-1/3 shrink-0 font-semibold text-gray-600 dark:text-gray-400">
                    Hạn giao (Deadline)
                  </dt>
                  <dd className="w-2/3 min-w-0 text-base font-semibold text-gray-800 dark:text-gray-200">
                    {formatDate(product.deadline)}
                  </dd>
                </div>

                {product.sourceStyle && (
                  <div className="flex items-center py-4 text-base">
                    <dt className="w-1/3 shrink-0 font-semibold text-gray-600 dark:text-gray-400">
                      Mẫu Fit nguồn
                    </dt>
                    <dd className="w-2/3 min-w-0 flex items-center gap-2">
                      <Link
                        to={`/styles/${product.sourceStyle.id}/detail`}
                        target="_blank"
                        className="font-mono text-sm font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-300 px-2.5 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/40 hover:underline"
                      >
                        {product.sourceStyle.styleCode} - {product.sourceStyle.styleName} ↗
                      </Link>
                    </dd>
                  </div>
                )}

                <div className="flex items-center py-4 text-base">
                  <dt className="w-1/3 shrink-0 font-semibold text-gray-600 dark:text-gray-400">
                    Trạng thái
                  </dt>
                  <dd className="flex w-2/3 min-w-0 items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ProductStatusBadge status={product.status} />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {!isProductLocked
                          ? "(Đang trong quá trình xử lý dữ liệu)"
                          : "(Đã khóa sau khi xử lý xong, chế độ chỉ đọc)"}
                      </span>
                    </div>

                    {!isProductLocked ? (
                      <button
                        type="button"
                        onClick={() => setIsLockModalOpen(true)}
                        disabled={updateStatusMutation.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 cursor-pointer transition-colors"
                      >
                        <LockIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>Khóa sản phẩm</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsUnlockModalOpen(true)}
                        disabled={updateStatusMutation.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 cursor-pointer transition-colors"
                      >
                        <UnlockIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>Mở khoá</span>
                      </button>
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Thẻ liên kết nhanh sang Tab 2: Bảng size */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-5 dark:border-gray-800 dark:bg-gray-800/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <span>Cơ cấu Màu sắc &amp; Kích cỡ</span>
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600 border border-brand-200 dark:bg-brand-950/40 dark:text-brand-300">
                    {product.colors?.length || 0} màu • {uniqueSizes.length} size • {(product.totalQuantity || 0).toLocaleString()} pcs
                  </span>
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Đã chuyển sang danh mục riêng <strong>"Bảng size"</strong> để theo dõi ma trận chi tiết và quản lý sản lượng.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTabChange("sizes")}
                className="shrink-0 text-xs font-semibold text-brand-600 border-brand-200 hover:bg-brand-50 cursor-pointer"
              >
                Xem chi tiết Bảng size →
              </Button>
            </div>

            {/* Khối chất liệu & đặc điểm */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Mô tả đặc điểm &amp; Ghi chú chất liệu
              </h4>
              <div className="rounded-xl border border-gray-200/80 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-gray-900/60">
                <p className="text-base text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {product.materialNote || "Chưa có ghi chú chất liệu chi tiết cho sản phẩm này."}
                </p>
              </div>
            </div>

            {/* Metadata Footer */}
            <div className="pt-3 text-xs text-gray-400 dark:text-gray-500 flex flex-wrap gap-4 border-t border-gray-100 dark:border-gray-800">
              <span>Tạo lúc {formatDateTime(product.createdAt)}</span>
              <span>•</span>
              <span>Cập nhật {formatDateTime(product.updatedAt)}</span>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Bảng phân bổ Size &amp; Phối màu sản phẩm</span>
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-600 border border-brand-200 dark:bg-brand-950/40 dark:text-brand-300">
                  {(product.colors || []).length} màu • {uniqueSizes.length} size
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Ma trận phân bổ chi tiết sản lượng theo từng màu sắc và kích cỡ của sản phẩm
              </p>
            </div>

            {!isProductLocked && (
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

          {/* 3 Thẻ thống kê KPI nhanh */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Tổng sản lượng</span>
              <p className="text-2xl font-bold font-mono text-brand-600 dark:text-brand-400 mt-1">
                {(product.totalQuantity || 0).toLocaleString()} <span className="text-xs text-gray-400 font-sans font-normal">pcs</span>
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Số lượng phối màu</span>
              <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white mt-1">
                {(product.colors || []).length} <span className="text-xs text-gray-400 font-sans font-normal">phối màu</span>
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Dải kích cỡ (Sizes)</span>
              <p className="text-lg font-bold font-mono text-gray-900 dark:text-white mt-1 truncate" title={uniqueSizes.join(", ")}>
                {uniqueSizes.length > 0 ? uniqueSizes.join(" • ") : "Chưa có"}
              </p>
            </div>
          </div>

          {/* Ma trận bảng Size + Màu */}
          {!product.colors || product.colors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700 bg-white dark:bg-gray-900">
              <TableIcon className="w-10 h-10 mx-auto text-gray-400 mb-3" />
              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Chưa có bảng size &amp; màu sắc</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                Sản phẩm này chưa được thiết lập cơ cấu kích cỡ và phối màu sản xuất.
              </p>
              {!isProductLocked && (
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
                      <th className="px-4 py-3.5">Mã màu</th>
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
                    {product.colors.map((color, idx) => {
                      const rowTotal = (color.sizes || []).reduce(
                        (sum, s) => sum + (Number(s.quantity) || 0),
                        0,
                      );
                      return (
                        <tr key={color.id || idx} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-5 py-3.5 text-center font-mono text-gray-400">{idx + 1}</td>
                          <td className="px-4 py-3.5 font-semibold text-gray-900 dark:text-white">
                            <div className="flex items-center gap-2.5">
                              {color.colorCode && (
                                <span
                                  className="w-4 h-4 rounded-full border border-gray-300 shadow-2xs shrink-0"
                                  style={{ backgroundColor: color.colorCode }}
                                />
                              )}
                              <span>{color.colorName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-[11px] text-gray-500 dark:text-gray-400">
                            {color.colorCode || "—"}
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
                      <td colSpan={3} className="px-5 py-3.5 text-gray-900 dark:text-white uppercase text-[11px] tracking-wider">
                        Tổng cộng theo Size
                      </td>
                      {uniqueSizes.map((size) => (
                        <td key={size} className="px-3 py-3.5 text-center font-mono font-bold text-gray-900 dark:text-white">
                          {(totalBySize[size] || 0).toLocaleString()}
                        </td>
                      ))}
                      <td className="px-5 py-3.5 text-right font-mono text-sm font-extrabold text-brand-600 dark:text-brand-400">
                        {(product.totalQuantity || 0).toLocaleString()}
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Bảng màu sản phẩm (Color Palette &amp; Swatches)</span>
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-600 border border-brand-200 dark:bg-brand-950/40 dark:text-brand-300">
                  {paletteImages.length} ảnh bảng màu
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Khu vực lưu trữ, tải lên và cập nhật hình ảnh bảng màu, lab-dips và mẫu vải cho sản phẩm
              </p>
            </div>

            {!isProductLocked && (
              <Button
                size="sm"
                onClick={() => paletteFileInputRef.current?.click()}
                className="text-xs font-semibold shrink-0"
              >
                <PlusIcon className="w-4 h-4 mr-1.5" />
                Tải ảnh bảng màu lên
              </Button>
            )}
            <input
              ref={paletteFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadPaletteFile}
              className="hidden"
            />
          </div>

          {/* Banner thông báo phát triển & hướng dẫn */}
          <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-4 text-xs text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200 flex items-start gap-3">
            <InfoIcon className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <strong>Khu vực quản lý hình ảnh bảng màu sản phẩm:</strong> Bạn có thể tải lên các file ảnh bảng màu thực tế từ khách hàng, swatch card vải, hoặc mã màu Pantone/lab-dips. Khu vực này sẵn sàng phục vụ việc mở rộng quản lý màu chi tiết trong tương lai.
            </div>
          </div>

          {/* Khu vực upload ảnh nhanh (Dropzone) */}
          {!isProductLocked && (
            <div
              onClick={() => paletteFileInputRef.current?.click()}
              className="cursor-pointer rounded-2xl border-2 border-dashed border-gray-300 bg-white p-8 text-center hover:border-brand-400 hover:bg-gray-50/50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-500 transition-all group"
            >
              <GridIcon className="w-10 h-10 mx-auto text-gray-400 group-hover:text-brand-600 transition-colors mb-2" />
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Nhấp hoặc kéo thả hình ảnh bảng màu vào đây để tải lên
              </p>
              <p className="text-xs text-gray-400 mt-1">Hỗ trợ PNG, JPG, WEBP dung lượng tối đa 15MB</p>
            </div>
          )}

          {/* Thư viện hình ảnh bảng màu đã tải lên */}
          {paletteImages.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Hình ảnh bảng màu đã tải lên ({paletteImages.length})</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {paletteImages.map((img) => (
                  <div
                    key={img.id}
                    className="group relative rounded-xl border border-gray-200 bg-white overflow-hidden shadow-xs dark:border-gray-800 dark:bg-gray-900 transition-all hover:shadow-md"
                  >
                    <div className="aspect-square bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate" title={img.name}>
                        {img.name}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatDateTime(img.uploadedAt)}</p>

                      <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-100 dark:border-gray-800">
                        <button
                          type="button"
                          onClick={() => setPalettePreviewModalUrl({ url: img.url, name: img.name })}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 cursor-pointer"
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                          <span>Xem</span>
                        </button>

                        <a
                          href={img.url}
                          download={img.name}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white cursor-pointer"
                          title="Tải về"
                        >
                          <DownloadIcon className="w-3.5 h-3.5" />
                        </a>

                        {!isProductLocked && (
                          <button
                            type="button"
                            onClick={() => handleDeletePaletteImage(img.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Xóa ảnh"
                          >
                            <TrashBinIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs text-gray-400 italic">Chưa có ảnh bảng màu nào được tải lên.</p>
            </div>
          )}

          {/* Danh sách các phối màu đã khai báo của sản phẩm */}
          {(product.colors || []).length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-3">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Các phối màu hiện có của sản phẩm ({product.colors?.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {product.colors?.map((c, i) => {
                  const qty = (c.sizes || []).reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
                  return (
                    <div
                      key={c.id || i}
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-800/40"
                    >
                      <span
                        className="w-8 h-8 rounded-xl border border-gray-200 shadow-2xs shrink-0"
                        style={{ backgroundColor: c.colorCode || "#cccccc" }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{c.colorName}</p>
                        <p className="text-[11px] font-mono text-gray-400 mt-0.5">Mã: {c.colorCode || "—"}</p>
                      </div>
                      <span className="text-xs font-mono font-semibold text-brand-600 dark:text-brand-400 shrink-0">
                        {qty.toLocaleString()} pcs
                      </span>
                    </div>
                  );
                })}
              </div>
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
          canEdit={!isProductLocked}
          onEditingChange={setIsOperationStepsEditing}
          onSave={handleSaveSteps}
          imageUrl={imageUrl}
          styleCode={product.productCode}
          styleName={product.productName}
          onImageChange={(file) => void handleUploadAndSaveImage(file)}
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
          onEditingChange={setIsProductionDocEditing}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ĐỢT MAY MẪU (SAMPLES)                                              */}
      {/* ========================================================================= */}
      {activeTab === "samples" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Danh sách các đợt may mẫu của sản phẩm
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Theo dõi quá trình may mẫu, feedback từ khách hàng và ảnh chụp mẫu
              </p>
            </div>
            <Button size="sm" onClick={() => setIsAddSampleOpen(true)}>
              <PlusIcon className="w-4 h-4 mr-1" />
              Thêm đợt may mẫu
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {!product.sampleRounds || product.sampleRounds.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-xs text-gray-400 dark:border-gray-800">
                Sản phẩm này chưa có đợt may mẫu nào. Bấm "Thêm đợt may mẫu" để tạo mới.
              </div>
            ) : (
              product.sampleRounds.map((round) => (
                <div
                  key={round.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-sm font-bold text-brand-600 dark:bg-brand-950 dark:text-brand-400 font-mono">
                        #{round.roundNo}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                          Đợt may mẫu {round.roundNo}
                        </h4>
                        <span className="text-[11px] text-gray-400">
                          Ngày tạo: {formatDate(round.createdAt)}
                        </span>
                      </div>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {round.status}
                    </span>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Ý kiến phản hồi (Feedback):
                    </span>
                    <p className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 p-3 rounded-xl dark:bg-gray-800/40">
                      {round.feedback || "Chưa có phản hồi cho đợt mẫu này."}
                    </p>
                  </div>

                  {round.images && round.images.length > 0 && (
                    <div>
                      <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                        Ảnh chụp kiểm mẫu ({round.images.length} ảnh):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                        {round.images.map((img) => (
                          <div
                            key={img.id}
                            className="aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50 dark:border-gray-700"
                          >
                            <img
                              src={img.documentVersionId || img.fileUrl}
                              alt="Ảnh mẫu"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: TÀI LIỆU ĐÍNH KÈM TỪ PO & TECHPACK (3 MỤC CÓ VERSIONING)           */}
      {/* ========================================================================= */}
      {activeTab === "documents" && (
        <div className="space-y-6">
          {/* Header tổng quan */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Tài liệu kỹ thuật đính kèm sản phẩm</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                  {(product.documents || []).length} file
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Quản lý các tài liệu PO chi tiết, TechPack thông số và tài liệu phụ trợ với kiểm soát lịch sử phiên bản
              </p>
            </div>

            {!isProductLocked && (
              <Button
                size="sm"
                onClick={() => setIsLinkPoDocOpen(true)}
                className="shrink-0"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Gán tài liệu từ kho PO
              </Button>
            )}
          </div>

          {/* Banner thông báo khi sản phẩm bị khóa */}
          {isProductLocked && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 flex items-center gap-2.5">
              <LockIcon className="w-4 h-4 shrink-0 text-rose-600" />
              <span>
                <strong>Sản phẩm đã bị khóa:</strong> Chế độ chỉ đọc. Bạn có thể xem trước nội dung hoặc tải về các phiên bản của tài liệu, nhưng không thể thêm, xóa hoặc cập nhật phiên bản mới.
              </span>
            </div>
          )}

          {/* ── MỤC 1: PO CHI TIẾT ── */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
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

              {!isProductLocked && (
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium text-gray-700 border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    onClick={() => setIsLinkPoDocOpen(true)}
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
                Chưa có file PO chi tiết nào. Bấm "Tải file PO lên" hoặc "Gán từ kho PO".
              </div>
            ) : (
              <div className="space-y-2.5">
                {poDocuments.map((doc) => (
                  <ProductVersionedFileGroup
                    key={doc.documentId}
                    doc={doc}
                    canEdit={!isProductLocked}
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
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
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

              {!isProductLocked && (
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium text-gray-700 border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    onClick={() => setIsLinkPoDocOpen(true)}
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
                    canEdit={!isProductLocked}
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
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
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

              {!isProductLocked && (
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium text-gray-700 border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    onClick={() => setIsLinkPoDocOpen(true)}
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
                    canEdit={!isProductLocked}
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
      {activeTab === "history" && (
        <div className="space-y-4">
          {/* Header thanh công cụ lịch sử */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Nhật ký lịch sử thay đổi của sản phẩm</span>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-600 border border-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-900">
                  {product.statusHistory?.length || 0} bản ghi
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Các sự kiện được tự động gom nhóm tinh gọn theo từng loại thao tác chung, bấm mở rộng để xem chi tiết
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Toggle chế độ xem */}
              <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50/80 p-1 dark:border-gray-700 dark:bg-gray-800 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setHistoryViewMode("grouped")}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    historyViewMode === "grouped"
                      ? "bg-white text-brand-600 shadow-xs font-semibold dark:bg-gray-700 dark:text-brand-400"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  Gom nhóm tinh gọn
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryViewMode("timeline")}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    historyViewMode === "timeline"
                      ? "bg-white text-brand-600 shadow-xs font-semibold dark:bg-gray-700 dark:text-brand-400"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  Dòng thời gian
                </button>
              </div>

              {historyViewMode === "grouped" && groupedHistory.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-medium text-gray-700 border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  onClick={() => {
                    const allExpanded = groupedHistory.every((g) => expandedHistoryGroups[g.id]);
                    const next: Record<string, boolean> = {};
                    groupedHistory.forEach((g) => {
                      next[g.id] = !allExpanded;
                    });
                    setExpandedHistoryGroups(next);
                  }}
                >
                  {groupedHistory.every((g) => expandedHistoryGroups[g.id])
                    ? "Thu gọn tất cả"
                    : "Mở rộng tất cả"}
                </Button>
              )}
            </div>
          </div>

          {!product.statusHistory || product.statusHistory.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400 italic bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
              Chưa có bản ghi lịch sử nào cho sản phẩm này.
            </div>
          ) : historyViewMode === "grouped" ? (
            /* ── CHẾ ĐỘ XEM GOM NHÓM TINH GỌN (ACCORDION) ── */
            <div className="space-y-3">
              {groupedHistory.map((group) => {
                const isExpanded = Boolean(expandedHistoryGroups[group.id]);
                return (
                  <div
                    key={group.id}
                    className="rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900 transition-all overflow-hidden"
                  >
                    {/* Header nhóm có thể click để mở rộng */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedHistoryGroups((prev) => ({
                          ...prev,
                          [group.id]: !prev[group.id],
                        }))
                      }
                      className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Biểu tượng phân loại nhóm */}
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                            group.type === "lock"
                              ? "bg-brand-50 text-brand-600 border border-brand-200/80 dark:bg-brand-950/50 dark:text-brand-400 dark:border-brand-900/60"
                              : group.type === "step"
                              ? "bg-blue-50 text-blue-600 border border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/60"
                              : group.type === "create"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/60"
                              : "bg-gray-100 text-gray-700 border border-gray-200/80 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                          }`}
                        >
                          {group.type === "lock" ? (
                            <LockIcon className="w-5 h-5" />
                          ) : group.type === "step" ? (
                            <BoltIcon className="w-5 h-5" />
                          ) : group.type === "create" ? (
                            <BoxIcon className="w-5 h-5" />
                          ) : (
                            <InfoIcon className="w-5 h-5" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                              {group.title}
                            </h4>
                            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                              {group.items.length} lần ghi nhận
                            </span>
                            {group.latestStatus && (
                              <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 border border-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-900">
                                Hiện tại: {String(group.latestStatus).toUpperCase() === "CLOSED" ? "Đã khóa" : String(group.latestStatus).toUpperCase() === "DRAFT" ? "Đang xử lý" : group.latestStatus}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2 text-xs text-gray-400 dark:text-gray-500 mt-1">
                            <span>Lần gần nhất: {formatDateTime(group.latestTime)}</span>
                            {group.latestReason && (
                              <>
                                <span>•</span>
                                <span className="italic text-gray-600 dark:text-gray-400 truncate max-w-md">
                                  "{group.latestReason}"
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-xs text-gray-400 hidden sm:inline">
                          {isExpanded ? "Thu gọn" : "Xem chi tiết"}
                        </span>
                        <div
                          className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-600 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        >
                          <AngleDownIcon className="w-4 h-4" />
                        </div>
                      </div>
                    </button>

                    {/* Chi tiết từng lần khi mở rộng */}
                    {isExpanded && (
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 border-t border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/20">
                        <div className="relative pl-5 border-l-2 border-brand-500/60 ml-2 mt-3 space-y-4">
                          {group.items.map((item, idx) => (
                            <div key={item.id || idx} className="relative">
                              <span className="absolute -left-[27px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-brand-500 ring-4 ring-white dark:ring-gray-900" />
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-gray-900 dark:text-white">
                                      {item.action === "locked"
                                        ? "Khóa sản phẩm"
                                        : item.action === "unlocked"
                                        ? "Mở khóa sản phẩm"
                                        : item.action === "operation_steps_updated"
                                        ? "Cập nhật công đoạn"
                                        : item.action === "created"
                                        ? "Khởi tạo sản phẩm"
                                        : item.action}
                                    </span>
                                    {item.newStatus && (
                                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                        {item.newStatus}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] font-mono text-gray-400">
                                    {formatDateTime(item.changedAt)}
                                  </span>
                                </div>

                                {item.reason && (
                                  <div className="rounded-xl bg-white p-2.5 text-xs text-gray-700 border border-gray-200/80 shadow-2xs dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                    <span className="font-semibold text-gray-900 dark:text-white mr-1.5">
                                      Lý do:
                                    </span>
                                    {item.reason}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── CHẾ ĐỘ XEM DÒNG THỜI GIAN ĐẦY ĐỦ ── */
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
              <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-800 space-y-6">
                {product.statusHistory.map((item, idx) => (
                  <div key={item.id || idx} className="relative">
                    <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 ring-4 ring-white dark:ring-gray-900" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-gray-900 dark:text-white">
                          {item.action || "Cập nhật trạng thái"}
                        </span>
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          {item.newStatus}
                        </span>
                        <span className="text-[10px] text-gray-400 ml-auto font-mono">
                          {formatDateTime(item.changedAt)}
                        </span>
                      </div>
                      {item.reason && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-xl">
                          <strong>Lý do:</strong> {item.reason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── HỘP THOẠI XÁC NHẬN RỜI TRANG KHI CHƯA LƯU (UNSAVEDCHANGESDIALOG) ──── */}
      <UnsavedChangesDialog
        isOpen={pendingTab !== null || pendingNavigation !== null}
        onConfirmLeave={handleConfirmLeaveTab}
        onCancel={() => {
          setPendingTab(null);
          setPendingNavigation(null);
        }}
      />

      {/* ─── MODAL CHỈNH SỬA THÔNG TIN SẢN PHẨM (PHONG CÁCH STYLEFORMMODAL) ────── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Chỉnh sửa thông tin sản phẩm
                </h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Cập nhật các thông số chi tiết và cơ cấu màu sắc / size của sản phẩm.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mã sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editProductCode}
                    onChange={(e) => setEditProductCode(e.target.value)}
                    required
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 font-mono text-sm text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tên sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editProductName}
                    onChange={(e) => setEditProductName(e.target.value)}
                    required
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
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
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <ProductColorSizeEditor
                  colors={editColors}
                  onChange={setEditColors}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updateProductMutation.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {updateProductMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL GÁN TÀI LIỆU TỪ KHO PO ───────────────────────────────────────── */}
      {isLinkPoDocOpen && (
        <Modal
          open={isLinkPoDocOpen}
          onClose={() => setIsLinkPoDocOpen(false)}
          title="Chọn tài liệu từ kho PO để gán vào sản phẩm"
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-xs text-gray-500">
              Chọn tài liệu từ kho PO để gán vào sản phẩm. Tài liệu sẽ tự động nằm đúng mục theo phân loại gốc bên ngoài (<strong>PO Chi Tiết</strong>, <strong>TechPack</strong> hoặc <strong>Khác</strong>).
            </p>

            {!po?.documents || po.documents.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                Đơn hàng PO này chưa có tài liệu nào trong kho tài liệu chung.
              </p>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2">
                {po.documents.map((d) => {
                  const alreadyLinked = product.documents?.some((doc) => doc.documentId === d.documentId);
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
            )}
            <div className="flex justify-end pt-3 border-t">
              <Button variant="outline" size="sm" onClick={() => setIsLinkPoDocOpen(false)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── MODAL THÊM ĐỢT MAY MẪU ─────────────────────────────────────────────── */}
      {isAddSampleOpen && (
        <Modal
          open={isAddSampleOpen}
          onClose={() => setIsAddSampleOpen(false)}
          title="Thêm đợt may mẫu mới"
          size="md"
        >
          <form onSubmit={handleAddSampleRound} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Trạng thái đợt mẫu
              </label>
              <select
                value={sampleStatus}
                onChange={(e) => setSampleStatus(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="Đang may">Đang may</option>
                <option value="Đạt yêu cầu">Đạt yêu cầu</option>
                <option value="Cần chỉnh sửa">Cần chỉnh sửa</option>
                <option value="Hủy">Hủy</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Ý kiến đóng góp / Feedback kiểm mẫu
              </label>
              <textarea
                rows={3}
                value={sampleFeedback}
                onChange={(e) => setSampleFeedback(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-3 text-xs text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="Nhập nhận xét về form dáng, đường may..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" size="sm" onClick={() => setIsAddSampleOpen(false)}>
                Hủy
              </Button>
              <Button size="sm" type="submit" disabled={createSampleMutation.isPending}>
                {createSampleMutation.isPending ? "Đang lưu..." : "Xác nhận tạo"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL XÁC NHẬN KHÓA SẢN PHẨM (ĐANG XỬ LÝ -> KHÓA) ───────────────── */}
      {isLockModalOpen && (
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
      {isUnlockModalOpen && (
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
      {isUploadDocOpen && (
        <Modal
          open={isUploadDocOpen}
          onClose={() => {
            if (!uploadProductDocMutation.isPending) setIsUploadDocOpen(false);
          }}
          title={
            docUploadCategory === "po_original"
              ? "Tải lên file PO Chi Tiết"
              : docUploadCategory === "tech_pack"
              ? "Tải lên tài liệu TechPack"
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
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setDocUploadFile(e.target.files[0]);
                  }
                }}
                className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-950/60 dark:file:text-blue-300 cursor-pointer"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Hỗ trợ các định dạng: Excel (.xlsx, .xls), PDF, Word (.docx), hình ảnh (PNG, JPG, WebP), tối đa 25MB.
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
      {isUploadVersionOpen && versionTargetInfo && (
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
