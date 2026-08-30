import { useState, useRef, useEffect } from "react";
import { Toast } from "@/components/shared";
import {
  useCreateProductionDoc,
  useProductionDoc,
  useUpdateProductionDoc,
  useUpdateProductionDocStatus,
  useResyncProductionDoc,
  useCopyProductionDoc,
  useExportProductionDocExcel,
} from "@/hooks/useProductionDocs";
import { useStyles } from "@/hooks/useStyles";
import { useUploadImage } from "@/hooks/useUploadImage";
import { useToast } from "@/hooks/useToast";
import { getApiError } from "@/lib/apiError";
import { validateImageFile } from "@/lib/validateImageFile";

import { DocumentToolbar } from "./DocumentToolbar";
import { SizeSpecTable } from "./SizeSpecTable";
import { PreviewModal } from "./PreviewModal";
import { ResyncDialog } from "./ResyncDialog";
import { CopyDialog } from "./CopyDialog";
import { ConfirmDialog } from "@/components/shared";

import type {
  ProductionDocImageGroup,
  ProductionDocSection,
  ProductionDocSizeRow,
  ProductionDocStatus,
  CopyMode,
} from "@/types/production-doc";

interface Props {
  styleId: string;
  styleName: string;
  styleImageUrl?: string | null;
  onEditingChange?: (isEditing: boolean) => void;
}

function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
        {num}
      </span>
      <h3 className="text-sm font-bold tracking-wide text-red-700 uppercase underline dark:text-red-400">
        {title}
      </h3>
    </div>
  );
}

function getClipboardImage(items: DataTransferItemList): File | null {
  for (let i = 0; i < items.length; i += 1) {
    if (items[i].type.startsWith("image/")) {
      return items[i].getAsFile();
    }
  }
  return null;
}

function cleanOptionalText(value: string | null | undefined): string {
  const text = value?.trim() ?? "";
  if (
    [
      "Mô tả hình dáng mẫu",
      "Danh sách phụ liệu chưa cập nhật",
      "Lưu ý trải cắt chưa cập nhật",
      "Chưa có góp ý từ khách hàng",
      "Chưa có ý kiến phản hồi từ khách hàng",
    ].includes(text)
  ) {
    return "";
  }
  return value ?? "";
}

const autoGrowTextarea = (textarea: HTMLTextAreaElement) => {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
};

function ImagePastePanel({
  onPaste,
  onFile,
  label = "Dán ảnh vào đây",
  isUploading = false,
}: {
  onPaste: (file: File) => void;
  onFile: (file: File) => void;
  label?: string;
  isUploading?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const file = getClipboardImage(event.clipboardData.items);
    if (!file) return;
    event.preventDefault();
    event.stopPropagation();
    onPaste(file);
  };

  return (
    <div
      ref={panelRef}
      tabIndex={0}
      onPaste={handlePaste}
      className="mx-auto flex min-h-32 w-full max-w-3xl flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/40 px-4 py-4 text-center outline-none transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-blue-800 dark:bg-blue-950/20 dark:focus:ring-blue-950/50"
    >
      <p className="mt-2 text-xs font-semibold text-gray-900 dark:text-white">
        {isUploading ? "Đang tải ảnh..." : label}
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Nhấn <kbd className="rounded border border-blue-200 bg-white px-1.5 py-0.5 font-mono font-semibold text-blue-700 shadow-xs dark:border-blue-800 dark:bg-gray-800 dark:text-blue-300">Ctrl + V</kbd>
      </p>
      <div className="my-2 flex w-full max-w-xs items-center gap-3 text-[10px] font-semibold text-gray-400 uppercase">
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />hoặc<span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
      </div>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={isUploading}
        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 focus:outline-none dark:bg-blue-500 dark:hover:bg-blue-400"
      >
        {isUploading ? "Đang tải..." : "Chọn file từ máy"}
      </button>
      <p className="mt-1 text-[10px] text-gray-400">JPEG, PNG, GIF hoặc WebP · tối đa 5MB</p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}

function CompactImageUploader({
  images = [],
  onAdd,
  onRemove,
  onPaste,
  isEditing,
  isUploading = false,
}: {
  images: string[];
  onAdd: (file: File) => void;
  onRemove: (index: number) => void;
  onPaste: (file: File) => void;
  isEditing: boolean;
  isUploading?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const pasteAreaRef = useRef<HTMLDivElement>(null);
  const [showPasteArea, setShowPasteArea] = useState(false);

  useEffect(() => {
    if (showPasteArea) pasteAreaRef.current?.focus();
  }, [showPasteArea]);

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const file = getClipboardImage(event.clipboardData.items);
    if (!file) return;
    event.preventDefault();
    event.stopPropagation();
    onPaste(file);
    setShowPasteArea(false);
  };

  return (
    <div className="space-y-2" tabIndex={isEditing ? 0 : undefined} onPaste={handlePaste}>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((url, i) => (
            <div key={i} className="group relative">
              <img
                src={url}
                alt=""
                className="h-28 w-28 rounded-lg border border-gray-200 bg-gray-50 object-cover shadow-2xs dark:border-gray-700 dark:bg-gray-800"
              />
              {isEditing && (
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow-xs transition-transform hover:scale-110 hover:bg-red-600"
                  title="Xóa ảnh"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {isEditing && images.length < 2 && (
        <div>
          <button
            type="button"
            onClick={() => setShowPasteArea((visible) => !visible)}
            disabled={isUploading}
            className={`inline-flex min-h-9 min-w-40 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-colors focus:ring-2 focus:ring-gray-300 focus:outline-none ${
              showPasteArea
                ? "border-gray-700 bg-gray-800 text-white hover:bg-gray-700"
                : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            }`}
            aria-expanded={showPasteArea}
          >
            {showPasteArea ? "− Đóng thêm ảnh" : "+ Thêm ảnh"}
          </button>
          {showPasteArea && (
            <div
              ref={pasteAreaRef}
              tabIndex={0}
              onPaste={handlePaste}
              className="mx-auto mt-3 flex min-h-32 w-full max-w-3xl flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-gradient-to-b from-blue-50 to-white px-4 py-4 text-center transition-all outline-none hover:border-blue-400 hover:shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-blue-800 dark:from-blue-950/30 dark:to-gray-900 dark:focus:ring-blue-950/50"
            >
              <p className="mt-2 text-xs font-semibold text-gray-900 dark:text-white">
                Dán ảnh vào đây
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Nhấn&nbsp;
                <kbd className="rounded border border-blue-200 bg-white px-1.5 py-0.5 font-mono font-semibold text-blue-700 shadow-xs dark:border-blue-800 dark:bg-gray-800 dark:text-blue-300">
                  Ctrl + V
                </kbd>
              </p>
              <div className="my-2 flex w-full max-w-xs items-center gap-3 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                hoặc
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 focus:outline-none dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus:ring-blue-900"
              >
                <span aria-hidden="true" className="text-base leading-none">
                  ↑
                </span>
                Chọn file từ máy
              </button>
              <p className="mt-1 text-[10px] text-gray-400">
                JPEG, PNG, GIF hoặc WebP · tối đa 5MB
              </p>
            </div>
          )}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={isUploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onAdd(file);
            setShowPasteArea(false);
            e.target.value = "";
          }
        }}
      />
    </div>
  );
}

const EMPTY_IMAGE_GROUP = (kind: "text" | "image" = "image"): ProductionDocImageGroup => ({
  kind,
  heading: "",
  content: "",
  headingColor: kind === "text" ? "black" : "red",
  imageUrls: [],
  orderIndex: 0,
});

const EMPTY_SECTION = (): ProductionDocSection => ({
  title: "",
  content: "",
  imageUrls: [],
  imageGroups: [],
  orderIndex: 0,
});

export function StyleProductionDocTab({
  styleId,
  styleName,
  styleImageUrl,
  onEditingChange,
}: Props) {
  const { data: doc, isLoading, isError, error, refetch } = useProductionDoc(styleId);
  const stylesQuery = useStyles({ limit: 100 });
  const createDoc = useCreateProductionDoc();
  const updateDoc = useUpdateProductionDoc();
  const updateStatus = useUpdateProductionDocStatus();
  const resyncDoc = useResyncProductionDoc();
  const copyDoc = useCopyProductionDoc();
  const exportExcel = useExportProductionDocExcel();
  const uploadImage = useUploadImage();
  const { toast, showToast, hideToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    onEditingChange?.(isEditing);
    return () => onEditingChange?.(false);
  }, [isEditing, onEditingChange]);
  const [docName, setDocName] = useState("");
  const [sec1Image, setSec1Image] = useState("");
  const [sec1ImageCleared, setSec1ImageCleared] = useState(false);
  const [sec2Accessories, setSec2Accessories] = useState("");
  const [sec3Notes, setSec3Notes] = useState("");
  const [sec4Feedback, setSec4Feedback] = useState("");
  const [sec5SizeImages, setSec5SizeImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showSec1PasteArea, setShowSec1PasteArea] = useState(false);
  const [showSec5PasteArea, setShowSec5PasteArea] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sections, setSections] = useState<ProductionDocSection[]>([]);
  const [forcedNewRowGroups, setForcedNewRowGroups] = useState<Record<number, number[]>>({});
  const [sizeRows, setSizeRows] = useState<ProductionDocSizeRow[]>([]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [resyncOpen, setResyncOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<
    | { kind: "heading"; sectionIndex: number; groupIndex: number }
    | { kind: "section"; sectionIndex: number }
    | { kind: "sketch" }
    | { kind: "fullsize"; imageIndex: number }
    | { kind: "heading-image"; sectionIndex: number; groupIndex: number; imageIndex: number }
    | null
  >(null);

  useEffect(() => {
    if (doc) {
      setDocName(doc.name);
      setSec1Image(doc.section1ImageUrl || "");
      setSec1ImageCleared(false);
      setSec2Accessories(cleanOptionalText(doc.section2Accessories));
      setSec3Notes(cleanOptionalText(doc.section3Notes));
      setSec4Feedback(cleanOptionalText(doc.section4CustomerFeedback));

      const imgsFromData = Array.isArray(doc.sizeData)
        ? doc.sizeData
            .filter(
              (r: unknown): r is { imageUrl: string } =>
                typeof r === "object" &&
                r !== null &&
                "imageUrl" in r &&
                typeof (r as { imageUrl: unknown }).imageUrl === "string",
            )
            .map((r) => r.imageUrl)
        : [];
      const imgsFromRows = Array.isArray(doc.sizeRows)
        ? doc.sizeRows
            .filter((r): r is typeof r & { imageUrl: string } => typeof r?.imageUrl === "string")
            .map((r) => r.imageUrl)
        : [];
      const combinedImgs = Array.from(new Set([...imgsFromData, ...imgsFromRows]));
      setSec5SizeImages(combinedImgs.slice(0, 1));

      setSections(
        doc.sections
          .filter((s) => !s.isFixed)
          .map((s) => ({
            ...s,
            imageGroups: s.imageGroups || [],
          })),
      );
      setForcedNewRowGroups({});
      setSizeRows(doc.sizeRows ? doc.sizeRows.map((sr) => ({ ...sr })) : []);
    }
  }, [doc]);

  useEffect(() => {
    document
      .querySelectorAll<HTMLTextAreaElement>('textarea[data-auto-grow="true"]')
      .forEach(autoGrowTextarea);
  }, [isEditing, sec2Accessories, sec3Notes, sec4Feedback, sections]);

  const startCreate = () => {
    setDocName(`Tài liệu sản xuất - ${styleName}`);
    setSec1Image("");
    setSec1ImageCleared(false);
    setSec2Accessories("");
    setSec3Notes("");
    setSec4Feedback("");
    setSec5SizeImages([]);
    setSections([]);
    setForcedNewRowGroups({});
    setSizeRows([]);
    setIsEditing(true);
  };

  const addImageGroup = (sectionIndex: number, placement: "right" | "below") => {
    const updated = [...sections];
    const groups = updated[sectionIndex].imageGroups || [];
    const newGroupIndex = groups.length;
    updated[sectionIndex].imageGroups = [...groups, EMPTY_IMAGE_GROUP()];
    setSections(updated);

    if (placement === "below" && groups.length % 2 === 1) {
      setForcedNewRowGroups((current) => ({
        ...current,
        [sectionIndex]: [...(current[sectionIndex] || []), newGroupIndex],
      }));
    }
  };

  const addTextHeading = (sectionIndex: number) => {
    const updated = [...sections];
    const groups = updated[sectionIndex].imageGroups || [];
    updated[sectionIndex].imageGroups = [...groups, EMPTY_IMAGE_GROUP("text")];
    setSections(updated);
  };

  const handleSave = async () => {
    const firstInvalidSection = sections.findIndex((section) => !section.title?.trim());
    if (firstInvalidSection >= 0) {
      const field = `section-title-${firstInvalidSection}`;
      const message = `Tên mục ${String(firstInvalidSection + 6).padStart(2, "0")} không được để trống.`;
      setFieldErrors({ [field]: message });
      requestAnimationFrame(() => {
        const element = document.querySelector<HTMLElement>(`[data-field="${field}"]`);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
        element?.focus();
      });
      showToast(message, "error");
      return;
    }

    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
      const groups = sections[sectionIndex].imageGroups || [];
      const groupIndex = groups.findIndex((group) => !group.heading?.trim());
      if (groupIndex >= 0) {
        const field = `group-title-${sectionIndex}-${groupIndex}`;
        const groupLabel = groups[groupIndex].kind === "text" ? "chữ/nội dung" : "ảnh";
        const message = `Tiêu đề của khối ${groupLabel} không được để trống.`;
        setFieldErrors({ [field]: message });
        requestAnimationFrame(() => {
          const element = document.querySelector<HTMLElement>(`[data-field="${field}"]`);
          element?.scrollIntoView({ behavior: "smooth", block: "center" });
          element?.focus();
        });
        showToast(message, "error");
        return;
      }
    }

    setFieldErrors({});
    try {
      const baseSizeRows = sizeRows
        .filter(
          (sr) =>
            sr.sizeLabel &&
            sr.sizeLabel.trim().length > 0 &&
            sr.measurementName &&
            sr.measurementName.trim().length > 0,
        )
        .map((sr, idx) => ({
          ...sr,
          imageUrl: null,
          sizeLabel: sr.sizeLabel.trim(),
          measurementName: sr.measurementName.trim(),
          orderIndex: sr.orderIndex || idx + 1,
        }));

      const sanitizedSizeRows: ProductionDocSizeRow[] = [...baseSizeRows];
      sec5SizeImages.forEach((imgUrl, i) => {
        if (sanitizedSizeRows[i]) {
          sanitizedSizeRows[i] = { ...sanitizedSizeRows[i], imageUrl: imgUrl };
        } else {
          sanitizedSizeRows.push({
            sizeLabel: "FULL",
            measurementName: `Bản vẽ thông số ${i + 1}`,
            measurementValue: null,
            tolerance: null,
            imageUrl: imgUrl,
            orderIndex: sanitizedSizeRows.length + 1,
          });
        }
      });

      if (!doc) {
        await createDoc.mutateAsync({
          styleId,
          input: {
            name: docName || `Tài liệu sản xuất - ${styleName}`,
            description: null,
            status: "draft" as ProductionDocStatus,
            section1Description: null,
            section1ImageUrl: sec1Image || null,
            section2Accessories: sec2Accessories || null,
            section3Notes: sec3Notes || null,
            section4CustomerFeedback: sec4Feedback || null,
            sizeData: sec5SizeImages.map((img) => ({ imageUrl: img })),
            sections: sections.map((s, idx) => ({
              ...s,
              orderIndex: idx + 5,
            })),
            sizeRows: sanitizedSizeRows,
          },
        });
        showToast("Đã tạo mới tài liệu sản xuất thành công.");
      } else {
        await updateDoc.mutateAsync({
          styleId,
          docId: doc.id,
          input: {
            name: docName || doc.name,
            description: doc.description,
            status: doc.status as ProductionDocStatus,
            section1Description: null,
            section1ImageUrl: sec1Image || null,
            section2Accessories: sec2Accessories || null,
            section3Notes: sec3Notes || null,
            section4CustomerFeedback: sec4Feedback || null,
            sizeData: sec5SizeImages.map((img) => ({ imageUrl: img })),
            sections: sections.map((s, idx) => ({
              ...s,
              orderIndex: idx + 5,
            })),
            sizeRows: sanitizedSizeRows,
          },
        });
        showToast("Đã lưu tài liệu sản xuất.");
      }
      setIsEditing(false);
    } catch (err) {
      showToast(getApiError(err, "Lưu tài liệu thất bại.").message, "error");
    }
  };

  const uploadPastedImage = async (
    file: File,
    onUploaded: (url: string) => void,
    successMessage: string,
  ) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      showToast(validationError, "error");
      return;
    }
    try {
      setUploadingImage(true);
      const res = await uploadImage.mutateAsync(file);
      onUploaded(res.url);
      showToast(successMessage);
    } catch (err) {
      showToast(getApiError(err, "Tải ảnh thất bại.").message, "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleStatusChange = async (newStatus: ProductionDocStatus) => {
    if (!doc) return;
    try {
      await updateStatus.mutateAsync({
        styleId,
        docId: doc.id,
        status: newStatus,
      });
      showToast("Đã cập nhật trạng thái tài liệu.");
    } catch (err) {
      showToast(getApiError(err, "Đổi trạng thái thất bại.").message, "error");
    }
  };

  const handleResync = async () => {
    if (!doc) return;
    try {
      await resyncDoc.mutateAsync({
        styleId,
        docId: doc.id,
        input: { sections: ["section1", "section2"], confirmOverwrite: true },
      });
      showToast("Đã đồng bộ Section 1 & 2 từ Style + Nguyên phụ liệu.");
      setResyncOpen(false);
    } catch (err) {
      showToast(getApiError(err, "Đồng bộ thất bại.").message, "error");
    }
  };

  const handleCopy = async (
    targetStyleId: string,
    mode: CopyMode,
    excludeSections?: string[],
    confirmOverwrite = false,
  ) => {
    if (!doc || !targetStyleId) return;
    try {
      await copyDoc.mutateAsync({
        styleId,
        docId: doc.id,
        input: {
          targetStyleId,
          mode,
          excludeSections,
          confirmOverwrite,
        },
      });
      showToast("Đã copy tài liệu sản xuất sang Style mới.");
      setCopyOpen(false);
    } catch (err: unknown) {
      const apiErr = err as { response?: { status?: number } };
      if (apiErr?.response?.status === 409) {
        if (window.confirm("Style đích đã có dữ liệu. Bạn có muốn ghi đè không?")) {
          await handleCopy(targetStyleId, mode, excludeSections, true);
        }
      } else {
        showToast(getApiError(err, "Copy tài liệu thất bại.").message, "error");
      }
    }
  };

  const handleExportExcel = async () => {
    try {
      await exportExcel.mutateAsync({ styleId, styleCode: styleName });
      showToast("Đã xuất file Excel tài liệu sản xuất thành công.");
    } catch (err) {
      showToast(getApiError(err, "Xuất file Excel thất bại.").message, "error");
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 pt-2">
        <div className="h-8 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-64 w-full rounded-xl bg-gray-100 dark:bg-gray-800/60" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-center text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
        <h4 className="font-semibold">Lỗi tải tài liệu sản xuất</h4>
        <p className="mt-1">{getApiError(error, "Không thể kết nối đến máy chủ.").message}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-3 rounded-md bg-red-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!doc && !isEditing) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Chưa có tài liệu sản xuất tiếng Việt
        </h3>
        <p className="mx-auto mt-1.5 max-w-lg text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          Khởi tạo tài liệu sản xuất cho mẫu "{styleName}" để quản lý quy cách may, bảng size và
          danh sách phụ liệu.
        </p>
        <button
          type="button"
          onClick={startCreate}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-700"
        >
          Khởi tạo tài liệu sản xuất
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-7 pt-1">
      {/* Workspace Header Toolbar */}
      <DocumentToolbar
        status={doc ? doc.status : "draft"}
        updatedAt={doc?.updatedAt}
        copiedFromStyleId={doc?.copiedFromStyleId}
        isEditing={isEditing}
        isSaving={createDoc.isPending || updateDoc.isPending}
        isExporting={exportExcel.isPending}
        isResyncing={resyncDoc.isPending}
        onStatusChange={(s) => void handleStatusChange(s)}
        onEditClick={() => setIsEditing(true)}
        onCancelEdit={() => setIsEditing(false)}
        onSaveClick={() => void handleSave()}
        onPreviewClick={() => setPreviewOpen(true)}
        onExportExcelClick={() => void handleExportExcel()}
        onResyncClick={() => setResyncOpen(true)}
        onCopyClick={() => setCopyOpen(true)}
      />

      {/* Document Workspace Structure */}
      <div className="space-y-7">
        {/* Section 1 & Section 2 Grid */}
        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
          {/* Section 01: Mô tả hình dáng */}
          <div className="space-y-3">
            <SectionHeader num="01" title="MÔ TẢ HÌNH DÁNG" />
            {(() => {
              const activeSec1Image = doc
                ? sec1Image || (sec1ImageCleared ? null : doc.section1ImageUrl || styleImageUrl)
                : sec1Image || styleImageUrl || null;

              return isEditing ? (
                <div
                  className="space-y-3"
                  tabIndex={0}
                  onPaste={(event) => {
                    const file = getClipboardImage(event.clipboardData.items);
                    if (!file) return;
                    event.preventDefault();
                    event.stopPropagation();
                    void uploadPastedImage(
                      file,
                      (url) => {
                        setSec1Image(url);
                        setSec1ImageCleared(false);
                        setShowSec1PasteArea(false);
                      },
                      "Đã dán ảnh phác thảo.",
                    );
                  }}
                >
                  {activeSec1Image ? (
                    <div className="group relative inline-block">
                      <img
                        src={activeSec1Image}
                        alt="Sketch"
                        className="max-h-56 rounded-xl border border-gray-200 bg-gray-50 object-contain dark:border-gray-800 dark:bg-gray-800/60"
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowSec1PasteArea((visible) => !visible)}
                          className={`inline-flex min-h-9 min-w-40 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-colors focus:ring-2 focus:ring-gray-300 focus:outline-none ${
                            showSec1PasteArea
                              ? "border-gray-700 bg-gray-800 text-white hover:bg-gray-700"
                              : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                          }`}
                          aria-expanded={showSec1PasteArea}
                        >
                          {showSec1PasteArea ? "− Đóng khu vực thêm ảnh" : "Thay ảnh phác thảo"}
                        </button>
                        {sec1Image && (
                          <button
                            type="button"
                            onClick={() => setPendingDelete({ kind: "sketch" })}
                            className="inline-flex min-h-9 items-center rounded-lg border border-red-200 bg-white px-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus:ring-2 focus:ring-red-200 focus:outline-none dark:border-red-900 dark:bg-gray-900 dark:text-red-400"
                          >
                            Xóa ảnh tùy chỉnh
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-3 text-center dark:border-gray-800 dark:bg-gray-800/40"
                    >
                      <button
                        type="button"
                        onClick={() => setShowSec1PasteArea((visible) => !visible)}
                        className={`inline-flex min-h-11 w-full items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors focus:ring-4 focus:ring-gray-200 focus:outline-none ${
                          showSec1PasteArea
                            ? "border-gray-700 bg-gray-800 text-white hover:bg-gray-700"
                            : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        }`}
                        aria-expanded={showSec1PasteArea}
                      >
                        {showSec1PasteArea ? "− Đóng khu vực thêm ảnh" : "+ Thêm ảnh phác thảo"}
                      </button>
                    </div>
                  )}
                  {showSec1PasteArea && (
                    <ImagePastePanel
                      onPaste={(file) =>
                        void uploadPastedImage(
                          file,
                          (url) => {
                            setSec1Image(url);
                            setSec1ImageCleared(false);
                            setShowSec1PasteArea(false);
                          },
                          "Đã dán ảnh phác thảo.",
                        )
                      }
                      onFile={(file) =>
                        void uploadPastedImage(
                          file,
                          (url) => {
                            setSec1Image(url);
                            setSec1ImageCleared(false);
                            setShowSec1PasteArea(false);
                          },
                          "Đã tải ảnh phác thảo.",
                        )
                      }
                      label="Dán ảnh phác thảo vào đây"
                      isUploading={uploadingImage}
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {activeSec1Image && (
                    <img
                      src={activeSec1Image}
                      alt="Sketch"
                      className="max-h-56 rounded-xl border border-gray-200 bg-gray-50 object-contain dark:border-gray-800 dark:bg-gray-800/60"
                    />
                  )}
                  {!activeSec1Image && (
                    <span className="text-sm text-gray-400 italic">Chưa có ảnh phác thảo.</span>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Section 02: Phụ liệu */}
          <div className="space-y-3">
            <SectionHeader num="02" title="PHỤ LIỆU" />
            {isEditing ? (
              <textarea
                data-auto-grow="true"
                rows={10}
                value={sec2Accessories}
                onChange={(e) => setSec2Accessories(e.target.value)}
                placeholder={
                  "Khóa kéo, cúc áo, chỉ may...\n(Nhập danh sách phụ liệu, mỗi vật liệu một dòng)"
                }
                className="w-full resize-none overflow-hidden rounded-xl border border-gray-300 p-3.5 text-sm placeholder:text-gray-400 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            ) : (
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4.5 dark:border-gray-800 dark:bg-gray-900/60">
                {sec2Accessories || cleanOptionalText(doc?.section2Accessories) ? (
                  <pre className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                    {sec2Accessories || cleanOptionalText(doc?.section2Accessories)}
                  </pre>
                ) : (
                  <span className="text-sm text-gray-400 italic">Chưa có danh sách phụ liệu.</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section 03: Lưu ý trải cắt */}
        <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <SectionHeader num="03" title="LƯU Ý TRẢI CẮT" />
          {isEditing ? (
            <textarea
              data-auto-grow="true"
              rows={4}
              value={sec3Notes}
              onChange={(e) => setSec3Notes(e.target.value)}
              placeholder="Lưu ý trải vải và hướng cắt mẫu..."
              className="w-full resize-none overflow-hidden rounded-xl border border-gray-300 p-3.5 text-sm placeholder:text-gray-400 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          ) : (
            <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-4 dark:border-gray-800 dark:bg-gray-900/40">
              {sec3Notes || doc?.section3Notes ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                  {sec3Notes || doc?.section3Notes}
                </p>
              ) : (
                <span className="text-sm text-gray-400 italic">Chưa nhập nội dung.</span>
              )}
            </div>
          )}
        </section>

        {/* Section 04: Comment góp ý khách hàng */}
        <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <SectionHeader num="04" title="COMMENT GÓP Ý KHÁCH HÀNG" />
          {isEditing ? (
            <textarea
              data-auto-grow="true"
              rows={4}
              value={sec4Feedback}
              onChange={(e) => setSec4Feedback(e.target.value)}
              placeholder="Nhập góp ý từ khách hàng..."
              className="w-full resize-none overflow-hidden rounded-xl border border-gray-300 p-3.5 text-sm placeholder:text-gray-400 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          ) : (
            <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-4 dark:border-gray-800 dark:bg-gray-900/40">
              {sec4Feedback || doc?.section4CustomerFeedback ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                  {sec4Feedback || doc?.section4CustomerFeedback}
                </p>
              ) : (
                <span className="text-sm text-gray-400 italic">
                  Chưa nhập nội dung.
                </span>
              )}
            </div>
          )}
        </section>

        {/* Section 05: Thông số Full Size & Table */}
        <section
          className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900"
          tabIndex={isEditing ? 0 : undefined}
          onPaste={(event) => {
            if (!isEditing) return;
            if (sec5SizeImages.length >= 1) {
              showToast("Thông số Full Size chỉ được thêm 1 ảnh.", "error");
              return;
            }
            const file = getClipboardImage(event.clipboardData.items);
            if (!file) return;
            event.preventDefault();
            event.stopPropagation();
            void uploadPastedImage(
              file,
              (url) => {
                setSec5SizeImages((prev) => (prev.length > 0 ? prev : [url]));
                setShowSec5PasteArea(false);
              },
              "Đã dán ảnh thông số full size.",
            );
          }}
        >
          <SectionHeader num="05" title="THÔNG SỐ FULL SIZE" />
          {sec5SizeImages.length === 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Thêm hình ảnh bảng thông số kích thước của mẫu. Có thể dán bằng Ctrl + V hoặc chọn file.
            </p>
          )}

          {/* Full Width Size Spec Images */}
          {sec5SizeImages.length > 0 && (
            <div className="space-y-4">
              {sec5SizeImages.map((url, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 shadow-xs dark:border-gray-800 dark:bg-gray-900"
                >
                  <img
                    src={url}
                    alt={`Bản vẽ thông số full size ${i + 1}`}
                    className="max-h-[750px] w-full rounded-xl bg-gray-50 object-contain dark:bg-gray-800/60"
                  />
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setPendingDelete({ kind: "fullsize", imageIndex: i })}
                      className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white shadow-md transition-transform hover:scale-110 hover:bg-red-600"
                      title="Xóa ảnh thông số"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {isEditing && sec5SizeImages.length === 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowSec5PasteArea((visible) => !visible)}
                className={`flex min-h-11 w-full items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors focus:ring-4 focus:ring-gray-200 focus:outline-none ${
                  showSec5PasteArea
                    ? "border-gray-700 bg-gray-800 text-white hover:bg-gray-700"
                    : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                }`}
                aria-expanded={showSec5PasteArea}
              >
                {showSec5PasteArea ? "− Đóng khu vực thêm ảnh" : "+ Thêm ảnh thông số Full Size"}
              </button>
              {showSec5PasteArea && (
                <ImagePastePanel
                  onPaste={(file) =>
                    void uploadPastedImage(
                      file,
                      (url) => {
                        setSec5SizeImages((prev) => (prev.length > 0 ? prev : [url]));
                        setShowSec5PasteArea(false);
                      },
                      "Đã dán ảnh thông số full size.",
                    )
                  }
                  onFile={(file) =>
                    void uploadPastedImage(
                      file,
                      (url) => {
                        setSec5SizeImages((prev) => (prev.length > 0 ? prev : [url]));
                        setShowSec5PasteArea(false);
                      },
                      "Đã tải ảnh thông số full size.",
                    )
                  }
                  label="Dán ảnh thông số vào đây"
                  isUploading={uploadingImage}
                />
              )}
            </div>
          )}

          {doc && doc.sizeRows && <SizeSpecTable rows={doc.sizeRows} />}
        </section>

        {/* Dynamic Sections 06+ */}
        {sections.map((sec, idx) => {
          const secNum = String(idx + 6).padStart(2, "0");
          const imageGroupCount = sec.imageGroups?.length ?? 0;
          const forcedRows = forcedNewRowGroups[idx] || [];
          let groupsInLastRow = 0;
          for (let groupIndex = 0; groupIndex < imageGroupCount; groupIndex += 1) {
            if (sec.imageGroups?.[groupIndex]?.kind === "text") {
              groupsInLastRow = 0;
              continue;
            }
            groupsInLastRow = forcedRows.includes(groupIndex)
              ? 1
              : groupsInLastRow === 1
                ? 2
                : 1;
          }
          const canAddGroupOnRight =
            groupsInLastRow === 1 && sec.imageGroups?.[imageGroupCount - 1]?.kind !== "text";
          return (
            <section
              key={sec.id || idx}
              className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-center justify-between">
                {isEditing ? (
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                      {secNum}
                    </span>
                    <input
                      type="text"
                      value={sec.title}
                      onChange={(e) => {
                        const updated = [...sections];
                        updated[idx].title = e.target.value;
                        setSections(updated);
                        if (e.target.value.trim()) {
                          setFieldErrors((current) => {
                            const next = { ...current };
                            delete next[`section-title-${idx}`];
                            return next;
                          });
                        }
                      }}
                      data-field={`section-title-${idx}`}
                      placeholder={`TÊN MỤC ${secNum}`}
                      className="min-w-0 flex-1 border-0 border-b border-dashed border-red-200 bg-transparent py-1 text-sm font-extrabold text-red-700 uppercase underline outline-none focus:border-red-500 dark:border-red-900 dark:text-red-400"
                    />
                    {fieldErrors[`section-title-${idx}`] && (
                      <span className="absolute mt-10 text-xs font-medium text-red-600 dark:text-red-400">
                        {fieldErrors[`section-title-${idx}`]}
                      </span>
                    )}
                  </div>
                ) : (
                  <SectionHeader num={secNum} title={sec.title || `MỤC ${secNum}`} />
                )}
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setPendingDelete({ kind: "section", sectionIndex: idx })}
                    className="inline-flex min-h-9 items-center rounded-lg border border-red-200 bg-white px-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus:ring-2 focus:ring-red-200 focus:outline-none dark:border-red-900 dark:bg-gray-900 dark:text-red-400"
                  >
                    Xóa mục
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <textarea
                    data-auto-grow="true"
                    rows={4}
                    value={sec.content || ""}
                    onChange={(e) => {
                      const updated = [...sections];
                      updated[idx].content = e.target.value;
                      setSections(updated);
                    }}
                    placeholder="Nội dung mục..."
                    className="w-full resize-none overflow-hidden rounded-xl border border-gray-300 p-3.5 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />

                  {/* Image Groups Controls */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {(sec.imageGroups || []).map((grp, grpIdx) => (
                      <div
                        key={grpIdx}
                        className={`min-w-0 space-y-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-gray-800/40 ${
                          grp.kind === "text"
                            ? "md:col-span-2"
                            : forcedRows.includes(grpIdx)
                              ? "md:col-start-1"
                              : ""
                        }`}
                        tabIndex={isEditing ? 0 : undefined}
                        onPaste={(event) => {
                          if (!isEditing || grp.kind === "text") return;
                          const file = getClipboardImage(event.clipboardData.items);
                          if (!file) return;
                          event.preventDefault();
                          event.stopPropagation();
                          void uploadPastedImage(
                            file,
                            (url) => {
                              const updated = [...sections];
                              const currentImgs = updated[idx].imageGroups![grpIdx].imageUrls || [];
                              if (currentImgs.length >= 2) {
                                showToast("Mỗi khối ảnh tối đa 2 ảnh.", "error");
                                return;
                              }
                              updated[idx].imageGroups![grpIdx].imageUrls = [...currentImgs, url];
                              setSections(updated);
                            },
                            "Đã dán ảnh nhóm.",
                          );
                        }}
                      >
                        <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                          <input
                            type="text"
                            data-field={`group-title-${idx}-${grpIdx}`}
                            value={grp.heading}
                            onChange={(e) => {
                              const updated = [...sections];
                              if (!updated[idx].imageGroups) updated[idx].imageGroups = [];
                              updated[idx].imageGroups![grpIdx].heading = e.target.value;
                              setSections(updated);
                              if (e.target.value.trim()) {
                                setFieldErrors((current) => {
                                  const next = { ...current };
                                  delete next[`group-title-${idx}-${grpIdx}`];
                                  return next;
                                });
                              }
                            }}
                            placeholder={
                              grp.kind === "text"
                                ? "Tiêu đề nội dung (bắt buộc)"
                                : "Tiêu đề ảnh (bắt buộc)"
                            }
                            aria-invalid={Boolean(fieldErrors[`group-title-${idx}-${grpIdx}`])}
                            className={`min-w-0 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold underline outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 ${
                              grp.headingColor === "red"
                                ? "text-red-600"
                                : "text-gray-900 dark:text-white"
                            }`}
                          />
                          <div className="flex shrink-0 items-center justify-end gap-1">
                            {grp.kind !== "text" && (
                              <>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...sections];
                                updated[idx].imageGroups![grpIdx].headingColor = "red";
                                setSections(updated);
                              }}
                              className={`min-h-9 w-12 rounded-lg px-2 text-sm font-semibold transition-colors focus:ring-2 focus:ring-gray-300 focus:outline-none ${
                                grp.headingColor === "red"
                                  ? "bg-red-600 text-white"
                                  : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                              }`}
                            >
                              Đỏ
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...sections];
                                updated[idx].imageGroups![grpIdx].headingColor = "black";
                                setSections(updated);
                              }}
                              className={`min-h-9 w-12 rounded-lg px-2 text-sm font-semibold transition-colors focus:ring-2 focus:ring-gray-300 focus:outline-none ${
                                grp.headingColor === "black"
                                  ? "bg-gray-900 text-white"
                                  : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                              }`}
                            >
                              Đen
                            </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setPendingDelete({
                                  kind: "heading",
                                  sectionIndex: idx,
                                  groupIndex: grpIdx,
                                });
                              }}
                              className="min-h-9 min-w-36 rounded-lg border border-red-200 bg-white px-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus:ring-2 focus:ring-red-200 focus:outline-none dark:border-red-900 dark:bg-gray-900 dark:text-red-400"
                              aria-label="Xóa khối"
                            >
                              Xóa khối
                            </button>
                          </div>
                        </div>
                        {fieldErrors[`group-title-${idx}-${grpIdx}`] && (
                          <p className="text-xs font-medium text-red-600 dark:text-red-400">
                            {fieldErrors[`group-title-${idx}-${grpIdx}`]}
                          </p>
                        )}

                        {grp.kind === "text" && (
                          <textarea
                            data-auto-grow="true"
                            rows={4}
                            value={grp.content || ""}
                            onChange={(event) => {
                              const updated = [...sections];
                              updated[idx].imageGroups![grpIdx].content = event.target.value;
                              setSections(updated);
                            }}
                            placeholder="Nhập chữ hoặc nội dung hướng dẫn..."
                            className="w-full resize-none overflow-hidden rounded-xl border border-gray-300 bg-white p-3.5 text-sm leading-relaxed text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                          />
                        )}

                        {grp.kind !== "text" && (
                          <CompactImageUploader
                          images={grp.imageUrls || []}
                          onAdd={async (file) => {
                            const updated = [...sections];
                            const currentImgs = updated[idx].imageGroups![grpIdx].imageUrls || [];
                            if (currentImgs.length >= 2) {
                              showToast("Mỗi khối ảnh tối đa 2 ảnh.", "error");
                              return;
                            }
                            const validationError = validateImageFile(file);
                            if (validationError) {
                              showToast(validationError, "error");
                              return;
                            }
                            try {
                              setUploadingImage(true);
                              const res = await uploadImage.mutateAsync(file);
                              updated[idx].imageGroups![grpIdx].imageUrls = [
                                ...currentImgs,
                                res.url,
                              ];
                              setSections(updated);
                              showToast("Đã tải ảnh nhóm.");
                            } catch (err) {
                              showToast(getApiError(err, "Tải ảnh thất bại.").message, "error");
                            } finally {
                              setUploadingImage(false);
                            }
                          }}
                          onRemove={(imgIdx) =>
                            setPendingDelete({
                              kind: "heading-image",
                              sectionIndex: idx,
                              groupIndex: grpIdx,
                              imageIndex: imgIdx,
                            })
                          }
                          onPaste={(file) => {
                            void uploadPastedImage(
                              file,
                              (url) => {
                                const updated = [...sections];
                                const currentImgs =
                                  updated[idx].imageGroups![grpIdx].imageUrls || [];
                                if (currentImgs.length >= 2) {
                                  showToast("Mỗi khối ảnh tối đa 2 ảnh.", "error");
                                  return;
                                }
                                updated[idx].imageGroups![grpIdx].imageUrls = [...currentImgs, url];
                                setSections(updated);
                              },
                              "Đã dán ảnh nhóm.",
                            );
                          }}
                          isEditing={isEditing}
                          isUploading={uploadingImage}
                          />
                        )}
                      </div>
                    ))}
                    {canAddGroupOnRight && (
                      <button
                        type="button"
                        onClick={() => addImageGroup(idx, "right")}
                        className="flex min-h-11 w-full self-start items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-4 text-sm font-semibold text-gray-900 transition-colors hover:border-gray-500 hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
                      >
                        + Thêm ảnh bên phải
                      </button>
                    )}
                    <div className="grid grid-cols-1 gap-2 md:col-span-2 md:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => addTextHeading(idx)}
                        className="flex min-h-11 w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:border-gray-500 hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
                      >
                        + Thêm chữ / nội dung
                      </button>
                      <button
                        type="button"
                        onClick={() => addImageGroup(idx, "below")}
                        className="flex min-h-11 w-full items-center justify-center rounded-xl border border-gray-300 bg-gray-100 px-4 text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:border-gray-500 hover:bg-gray-200 focus:ring-4 focus:ring-gray-200 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                      >
                        + Thêm ảnh xuống dưới
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                    {sec.content || "Chưa có nội dung."}
                  </p>
                  <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
                    {(sec.imageGroups || []).map((grp, grpIdx) => (
                    <div
                      key={grpIdx}
                      className={`min-w-0 space-y-2 ${grp.kind === "text" ? "md:col-span-2" : ""}`}
                    >
                      {grp.heading && (
                        <h5
                          className={`text-sm font-bold ${grp.kind === "text" ? "" : "underline"} ${
                            grp.headingColor === "red"
                              ? "text-red-600"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {grp.heading}
                        </h5>
                      )}
                      {grp.kind === "text" && grp.content && (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                          {grp.content}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3">
                        {grp.imageUrls.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt=""
                            className="h-28 w-28 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                          />
                        ))}
                      </div>
                    </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          );
        })}

        {isEditing && (
          <section className="rounded-xl border border-blue-100 bg-blue-50/30 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
            <div className="mb-3">
              <h4 className="text-sm font-bold tracking-wide text-gray-900 dark:text-white">
                BỔ SUNG NỘI DUNG
              </h4>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Tạo thêm mục riêng cho quy cách may, kiểm chất lượng hoặc hướng dẫn khác.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSections([...sections, EMPTY_SECTION()])}
              className="flex min-h-12 w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:border-gray-400 hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
            >
              + Thêm mục mới
            </button>
          </section>
        )}

      </div>

      {/* Dialog Modals */}
      {previewOpen && (
        <PreviewModal
          doc={
            doc
              ? {
                  ...doc,
                  section1ImageUrl:
                    sec1Image ||
                    (sec1ImageCleared ? null : doc.section1ImageUrl || styleImageUrl || null),
                  section1Description: null,
                  section2Accessories: sec2Accessories || cleanOptionalText(doc.section2Accessories),
                  section3Notes: sec3Notes || doc.section3Notes,
                  section4CustomerFeedback: sec4Feedback || doc.section4CustomerFeedback,
                  sizeData: sec5SizeImages.map((img) => ({ imageUrl: img })),
                  sections: sections.length > 0 ? sections : doc.sections,
                  sizeRows: sizeRows.length > 0 ? sizeRows : doc.sizeRows,
                }
              : {
                  id: "preview",
                  styleId,
                  name: docName || `Tài liệu sản xuất - ${styleName}`,
                  description: null,
                  status: "draft",
                  section1Description: null,
                  section1ImageUrl: sec1Image || styleImageUrl || null,
                  section2Accessories: sec2Accessories,
                  section3Notes: sec3Notes,
                  section4CustomerFeedback: sec4Feedback,
                  sizeData: sec5SizeImages.map((img) => ({ imageUrl: img })),
                  copiedFromStyleId: null,
                  copiedAt: null,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  sections: sections,
                  sizeRows: sizeRows,
                  attachments: [],
                }
          }
          styleName={styleName}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {resyncOpen && (
        <ResyncDialog
          isPending={resyncDoc.isPending}
          onConfirm={() => void handleResync()}
          onClose={() => setResyncOpen(false)}
        />
      )}

      {copyOpen && (
        <CopyDialog
          currentStyleId={styleId}
          styles={stylesQuery.data?.data ?? []}
          isPending={copyDoc.isPending}
          onCopy={(targetId, mode, exclude) => void handleCopy(targetId, mode, exclude)}
          onClose={() => setCopyOpen(false)}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={
          pendingDelete?.kind === "section"
            ? "Xóa mục này?"
            : pendingDelete?.kind === "heading"
            ? "Xóa khối này?"
              : "Xóa ảnh?"
        }
        description={
          pendingDelete?.kind === "section"
            ? "Toàn bộ nội dung và ảnh trong mục này sẽ bị xóa khỏi tài liệu. Bạn có chắc chắn muốn tiếp tục không?"
            : pendingDelete?.kind === "heading"
              ? "Tiêu đề và toàn bộ nội dung trong khối này sẽ bị xóa khỏi tài liệu. Bạn có chắc chắn muốn tiếp tục không?"
              : "Ảnh này sẽ bị xóa khỏi tài liệu. Bạn có chắc chắn muốn tiếp tục không?"
        }
        confirmLabel={
          pendingDelete?.kind === "section"
            ? "Xóa mục"
            : pendingDelete?.kind === "heading"
              ? "Xóa khối"
              : "Xóa ảnh"
        }
        variant="danger"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          if (pendingDelete.kind === "section") {
            setSections(sections.filter((_, i) => i !== pendingDelete.sectionIndex));
            setPendingDelete(null);
            return;
          }
          const updated = [...sections];
          if (pendingDelete.kind === "heading") {
            updated[pendingDelete.sectionIndex].imageGroups = (
              updated[pendingDelete.sectionIndex].imageGroups || []
            ).filter((_, i) => i !== pendingDelete.groupIndex);
          } else if (pendingDelete.kind === "heading-image") {
            const group = updated[pendingDelete.sectionIndex].imageGroups?.[pendingDelete.groupIndex];
            if (group) {
              group.imageUrls = group.imageUrls.filter((_, i) => i !== pendingDelete.imageIndex);
            }
          } else if (pendingDelete.kind === "sketch") {
            setSec1Image("");
            setSec1ImageCleared(true);
          } else if (pendingDelete.kind === "fullsize") {
            setSec5SizeImages(sec5SizeImages.filter((_, i) => i !== pendingDelete.imageIndex));
          }
          setSections(updated);
          setPendingDelete(null);
        }}
      />

      <Toast
        open={Boolean(toast)}
        message={toast?.message ?? ""}
        variant={toast?.variant}
        onClose={hideToast}
      />
    </div>
  );
}
