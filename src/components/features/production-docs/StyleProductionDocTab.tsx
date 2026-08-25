import { useState, useRef, useEffect } from "react";
import { Toast } from "@/components/shared";
import {
  useCreateProductionDoc,
  useLinkProductionDocAttachment,
  useProductionDoc,
  useUnlinkProductionDocAttachment,
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
import { AttachmentsSection } from "./AttachmentsSection";
import { PreviewModal } from "./PreviewModal";
import { ResyncDialog } from "./ResyncDialog";
import { CopyDialog } from "./CopyDialog";

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
  styleDescription?: string | null;
  styleImageUrl?: string | null;
  onEditingChange?: (isEditing: boolean) => void;
}

function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 font-mono text-xs font-bold text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
        {num}
      </span>
      <h3 className="text-sm font-bold tracking-wide text-gray-900 dark:text-white uppercase">
        {title}
      </h3>
    </div>
  );
}

function CompactImageUploader({
  images = [],
  onAdd,
  onRemove,
  isEditing,
}: {
  images: string[];
  onAdd: (file: File) => void;
  onRemove: (index: number) => void;
  isEditing: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((url, i) => (
            <div key={i} className="relative group">
              <img
                src={url}
                alt=""
                className="w-28 h-28 object-cover rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shadow-2xs"
              />
              {isEditing && (
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-xs transition-transform hover:scale-110"
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
            onClick={() => fileRef.current?.click()}
            className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            + Thêm ảnh
          </button>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onAdd(file);
            e.target.value = "";
          }
        }}
      />
    </div>
  );
}

const EMPTY_IMAGE_GROUP = (): ProductionDocImageGroup => ({
  heading: "",
  headingColor: "red",
  imageUrls: [],
  orderIndex: 0,
});

const EMPTY_SECTION = (): ProductionDocSection => ({
  title: "",
  content: "",
  imageUrls: [],
  imageGroups: [EMPTY_IMAGE_GROUP()],
  orderIndex: 0,
});

export function StyleProductionDocTab({
  styleId,
  styleName,
  styleDescription,
  styleImageUrl,
  onEditingChange,
}: Props) {
  const { data: doc, isLoading, isError, error, refetch } = useProductionDoc(
    styleId,
  );
  const stylesQuery = useStyles({ limit: 100 });
  const createDoc = useCreateProductionDoc();
  const updateDoc = useUpdateProductionDoc();
  const updateStatus = useUpdateProductionDocStatus();
  const resyncDoc = useResyncProductionDoc();
  const copyDoc = useCopyProductionDoc();
  const exportExcel = useExportProductionDocExcel();
  const linkAttachment = useLinkProductionDocAttachment();
  const unlinkAttachment = useUnlinkProductionDocAttachment();
  const uploadImage = useUploadImage();
  const { toast, showToast, hideToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    onEditingChange?.(isEditing);
    return () => onEditingChange?.(false);
  }, [isEditing, onEditingChange]);
  const [docName, setDocName] = useState("");
  const [sec1Desc, setSec1Desc] = useState("");
  const [sec1Image, setSec1Image] = useState("");
  const [sec2Accessories, setSec2Accessories] = useState("");
  const [sec3Notes, setSec3Notes] = useState("");
  const [sec4Feedback, setSec4Feedback] = useState("");
  const [sec5SizeImages, setSec5SizeImages] = useState<string[]>([]);
  const [sections, setSections] = useState<ProductionDocSection[]>([]);
  const [sizeRows, setSizeRows] = useState<ProductionDocSizeRow[]>([]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [resyncOpen, setResyncOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);

  const sketchInputRef = useRef<HTMLInputElement>(null);
  const sec5FileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (doc) {
      setDocName(doc.name);
      setSec1Image(doc.section1ImageUrl || "");
      setSec1Desc(doc.section1Description || "");
      setSec2Accessories(doc.section2Accessories || "");
      setSec3Notes(doc.section3Notes || "");
      setSec4Feedback(doc.section4CustomerFeedback || "");

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
            .filter(
              (r): r is typeof r & { imageUrl: string } =>
                typeof r?.imageUrl === "string",
            )
            .map((r) => r.imageUrl)
        : [];
      const combinedImgs = Array.from(new Set([...imgsFromData, ...imgsFromRows]));
      setSec5SizeImages(combinedImgs);

      setSections(
        doc.sections
          .filter((s) => !s.isFixed)
          .map((s) => ({
            ...s,
            imageGroups: s.imageGroups || [EMPTY_IMAGE_GROUP()],
          })),
      );
      setSizeRows(doc.sizeRows ? doc.sizeRows.map((sr) => ({ ...sr })) : []);
    }
  }, [doc]);

  const startCreate = () => {
    setDocName(`Tài liệu sản xuất - ${styleName}`);
    setSec1Desc("");
    setSec1Image("");
    setSec2Accessories("");
    setSec3Notes("");
    setSec4Feedback("");
    setSec5SizeImages([]);
    setSections([]);
    setSizeRows([]);
    setIsEditing(true);
  };

  const handleSave = async () => {
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
          sizeLabel: sr.sizeLabel.trim(),
          measurementName: sr.measurementName.trim(),
          orderIndex: sr.orderIndex || idx + 1,
        }));

      const sanitizedSizeRows = [...baseSizeRows];
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
            section1Description: sec1Desc || null,
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
            section1Description: sec1Desc || null,
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
        if (
          window.confirm("Style đích đã có dữ liệu. Bạn có muốn ghi đè không?")
        ) {
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

  const handleLinkAttachment = async (documentId: string) => {
    if (!doc) return;
    try {
      await linkAttachment.mutateAsync({
        styleId,
        documentId,
      });
      showToast("Đã đính kèm tài liệu.");
    } catch (err) {
      showToast(
        getApiError(err, "Không thể liên kết tài liệu.").message,
        "error",
      );
    }
  };

  const handleUnlinkAttachment = async (documentId: string) => {
    if (!doc) return;
    try {
      await unlinkAttachment.mutateAsync({
        styleId,
        documentId,
      });
      showToast("Đã gỡ liên kết đính kèm.");
    } catch (err) {
      showToast(getApiError(err, "Không thể gỡ đính kèm.").message, "error");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse pt-2">
        <div className="h-8 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-64 w-full rounded-xl bg-gray-100 dark:bg-gray-800/60" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-center text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
        <h4 className="font-semibold">Lỗi tải tài liệu sản xuất</h4>
        <p className="mt-1">
          {getApiError(error, "Không thể kết nối đến máy chủ.").message}
        </p>
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
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto leading-relaxed">
          Khởi tạo tài liệu sản xuất cho mẫu "{styleName}" để quản lý quy cách may, bảng size và danh sách phụ liệu.
        </p>
        <button
          type="button"
          onClick={startCreate}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
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
        docName={doc ? doc.name : docName}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Section 01: Mô tả hình dáng */}
            <div className="space-y-3">
              <SectionHeader num="01" title="MÔ TẢ HÌNH DÁNG" />
              {(() => {
                const activeSec1Image =
                  sec1Image || doc?.section1ImageUrl || styleImageUrl || null;

                return isEditing ? (
                  <div className="space-y-3">
                    {activeSec1Image ? (
                      <div className="relative inline-block group">
                        <img
                          src={activeSec1Image}
                          alt="Sketch"
                          className="max-h-56 rounded-xl border border-gray-200 object-contain bg-gray-50 dark:border-gray-800 dark:bg-gray-800/60"
                        />
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => sketchInputRef.current?.click()}
                            className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                          >
                            Tải ảnh phác thảo khác
                          </button>
                          {sec1Image && (
                            <button
                              type="button"
                              onClick={() => setSec1Image("")}
                              className="text-xs text-red-500 hover:underline"
                            >
                              Xóa ảnh tùy chỉnh
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => sketchInputRef.current?.click()}
                        className="cursor-pointer border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-6 text-center hover:border-blue-400 transition-colors bg-gray-50/50 dark:bg-gray-800/40"
                      >
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Upload ảnh phác thảo
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PNG, JPG, WebP — tối đa 5MB
                        </p>
                      </div>
                    )}
                    <input
                      ref={sketchInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const validationError = validateImageFile(file);
                        if (validationError) {
                          showToast(validationError, "error");
                          return;
                        }
                        try {
                          const res = await uploadImage.mutateAsync(file);
                          setSec1Image(res.url);
                          showToast("Đã tải ảnh phác thảo.");
                        } catch (err) {
                          showToast(
                            getApiError(err, "Tải ảnh thất bại.").message,
                            "error",
                          );
                        }
                      }}
                    />
                    <textarea
                      rows={5}
                      value={sec1Desc}
                      onChange={(e) => setSec1Desc(e.target.value)}
                      placeholder="Mô tả chi tiết hình dáng mẫu Fit..."
                      className="w-full rounded-xl border border-gray-300 p-3.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeSec1Image && (
                      <img
                        src={activeSec1Image}
                        alt="Sketch"
                        className="max-h-56 rounded-xl border border-gray-200 object-contain bg-gray-50 dark:border-gray-800 dark:bg-gray-800/60"
                      />
                    )}
                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {sec1Desc ||
                        doc?.section1Description ||
                        styleDescription || (
                          <span className="text-gray-400 italic">
                            Chưa có mô tả hình dáng.
                          </span>
                        )}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Section 02: Phụ liệu */}
            <div className="space-y-3">
              <SectionHeader num="02" title="PHỤ LIỆU" />
              {isEditing ? (
                <textarea
                  rows={10}
                  value={sec2Accessories}
                  onChange={(e) => setSec2Accessories(e.target.value)}
                  placeholder={
                    "Khóa kéo, cúc áo, chỉ may...\n(Nhập danh sách phụ liệu, mỗi vật liệu một dòng)"
                  }
                  className="w-full rounded-xl border border-gray-300 p-3.5 text-sm font-mono dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
                />
              ) : (
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4.5 dark:border-gray-800 dark:bg-gray-900/60">
                  {sec2Accessories || doc?.section2Accessories ? (
                    <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed">
                      {sec2Accessories || doc?.section2Accessories}
                    </pre>
                  ) : (
                    <span className="text-sm text-gray-400 italic">
                      Chưa có danh sách phụ liệu.
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 03: Lưu ý trải cắt */}
          <div className="space-y-3 pt-5 border-t border-gray-100 dark:border-gray-800">
            <SectionHeader num="03" title="LƯU Ý TRẢI CẮT" />
            {isEditing ? (
              <textarea
                rows={4}
                value={sec3Notes}
                onChange={(e) => setSec3Notes(e.target.value)}
                placeholder="Lưu ý trải vải và hướng cắt mẫu..."
                className="w-full rounded-xl border border-gray-300 p-3.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
              />
            ) : (
              <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-4 dark:border-gray-800 dark:bg-gray-900/40">
                {sec3Notes || doc?.section3Notes ? (
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {sec3Notes || doc?.section3Notes}
                  </p>
                ) : (
                  <span className="text-sm text-gray-400 italic">
                    Chưa có lưu ý trải cắt.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Section 04: Comment góp ý khách hàng */}
          <div className="space-y-3 pt-5 border-t border-gray-100 dark:border-gray-800">
            <SectionHeader num="04" title="COMMENT GÓP Ý KHÁCH HÀNG" />
            {isEditing ? (
              <textarea
                rows={4}
                value={sec4Feedback}
                onChange={(e) => setSec4Feedback(e.target.value)}
                placeholder="Chưa có ý kiến phản hồi từ khách hàng..."
                className="w-full rounded-xl border border-gray-300 p-3.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
              />
            ) : (
              <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-4 dark:border-gray-800 dark:bg-gray-900/40">
                {sec4Feedback || doc?.section4CustomerFeedback ? (
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {sec4Feedback || doc?.section4CustomerFeedback}
                  </p>
                ) : (
                  <span className="text-sm text-gray-400 italic">
                    Chưa có ý kiến phản hồi từ khách hàng.
                  </span>
                )}
              </div>
            )}
          </div>

        {/* Section 05: Thông số Full Size & Table */}
        <div className="space-y-4 pt-5 border-t border-gray-100 dark:border-gray-800">
          <SectionHeader num="05" title="THÔNG SỐ FULL SIZE" />
          
          {/* Full Width Size Spec Images */}
          {sec5SizeImages.length > 0 && (
            <div className="space-y-4">
              {sec5SizeImages.map((url, i) => (
                <div
                  key={i}
                  className="relative group overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 shadow-xs dark:border-gray-800 dark:bg-gray-900"
                >
                  <img
                    src={url}
                    alt={`Bản vẽ thông số full size ${i + 1}`}
                    className="w-full max-h-[750px] object-contain rounded-xl bg-gray-50 dark:bg-gray-800/60"
                  />
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() =>
                        setSec5SizeImages(
                          sec5SizeImages.filter((_, idx) => idx !== i),
                        )
                      }
                      className="absolute top-5 right-5 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-md transition-transform hover:scale-110"
                      title="Xóa ảnh thông số"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {isEditing && (
            <div>
              <button
                type="button"
                onClick={() => sec5FileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all bg-gray-50/50 dark:bg-gray-800/40"
              >
                + Thêm ảnh thông số Full Size
              </button>
              <input
                ref={sec5FileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const validationError = validateImageFile(file);
                  if (validationError) {
                    showToast(validationError, "error");
                    return;
                  }
                  try {
                    const res = await uploadImage.mutateAsync(file);
                    setSec5SizeImages((prev) => [...prev, res.url]);
                    showToast("Đã tải ảnh thông số full size.");
                  } catch (err) {
                    showToast(
                      getApiError(err, "Tải ảnh thất bại.").message,
                      "error",
                    );
                  }
                }}
              />
            </div>
          )}

          {doc && doc.sizeRows && <SizeSpecTable rows={doc.sizeRows} />}
        </div>

        {/* Dynamic Sections 06+ */}
        {sections.map((sec, idx) => {
          const secNum = String(idx + 6).padStart(2, "0");
          return (
            <div
              key={sec.id || idx}
              className="space-y-3 pt-5 border-t border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center justify-between">
                <SectionHeader
                  num={secNum}
                  title={sec.title || `MỤC ${secNum}`}
                />
                {isEditing && (
                  <button
                    type="button"
                    onClick={() =>
                      setSections(sections.filter((_, i) => i !== idx))
                    }
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Xóa mục
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={sec.title}
                    onChange={(e) => {
                      const updated = [...sections];
                      updated[idx].title = e.target.value;
                      setSections(updated);
                    }}
                    placeholder="TÊN MỤC (vd: QUY CÁCH MAY)"
                    className="w-full font-bold text-sm text-blue-600 dark:text-blue-400 border-0 border-b border-dashed border-gray-300 dark:border-gray-700 bg-transparent uppercase focus:outline-none py-1"
                  />
                  <textarea
                    rows={4}
                    value={sec.content || ""}
                    onChange={(e) => {
                      const updated = [...sections];
                      updated[idx].content = e.target.value;
                      setSections(updated);
                    }}
                    placeholder="Nội dung mục..."
                    className="w-full rounded-xl border border-gray-300 p-3.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />

                  {/* Image Groups Controls */}
                  <div className="space-y-3">
                    {(sec.imageGroups || []).map((grp, grpIdx) => (
                      <div
                        key={grpIdx}
                        className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-gray-800/40 space-y-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            value={grp.heading}
                            onChange={(e) => {
                              const updated = [...sections];
                              if (!updated[idx].imageGroups)
                                updated[idx].imageGroups = [];
                              updated[idx].imageGroups![grpIdx].heading =
                                e.target.value;
                              setSections(updated);
                            }}
                            placeholder="Heading nhóm ảnh (vd: HÌNH ẢNH XỎ ĐAN VÒNG)"
                            className={`flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm font-bold underline dark:border-gray-700 dark:bg-gray-800 ${
                              grp.headingColor === "red"
                                ? "text-red-600"
                                : "text-gray-900 dark:text-white"
                            }`}
                          />
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...sections];
                                updated[idx].imageGroups![grpIdx].headingColor =
                                  "red";
                                setSections(updated);
                              }}
                              className={`px-2.5 py-1 text-xs font-semibold rounded ${
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
                                updated[idx].imageGroups![grpIdx].headingColor =
                                  "black";
                                setSections(updated);
                              }}
                              className={`px-2.5 py-1 text-xs font-semibold rounded ${
                                grp.headingColor === "black"
                                  ? "bg-gray-900 text-white"
                                  : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                              }`}
                            >
                              Đen
                            </button>
                          </div>
                        </div>

                        <CompactImageUploader
                          images={grp.imageUrls || []}
                          onAdd={async (file) => {
                            const updated = [...sections];
                            const currentImgs =
                              updated[idx].imageGroups![grpIdx].imageUrls || [];
                            if (currentImgs.length >= 2) {
                              showToast("Mỗi heading tối đa 2 ảnh.", "error");
                              return;
                            }
                            const validationError = validateImageFile(file);
                            if (validationError) {
                              showToast(validationError, "error");
                              return;
                            }
                            try {
                              const res = await uploadImage.mutateAsync(file);
                              updated[idx].imageGroups![grpIdx].imageUrls = [
                                ...currentImgs,
                                res.url,
                              ];
                              setSections(updated);
                              showToast("Đã tải ảnh nhóm.");
                            } catch (err) {
                              showToast(getApiError(err, "Tải ảnh thất bại.").message, "error");
                            }
                          }}
                          onRemove={(imgIdx) => {
                            const updated = [...sections];
                            updated[idx].imageGroups![grpIdx].imageUrls =
                              updated[idx].imageGroups![grpIdx].imageUrls.filter(
                                (_, i) => i !== imgIdx,
                              );
                            setSections(updated);
                          }}
                          isEditing={isEditing}
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...sections];
                        if (!updated[idx].imageGroups)
                          updated[idx].imageGroups = [];
                        updated[idx].imageGroups!.push(EMPTY_IMAGE_GROUP());
                        setSections(updated);
                      }}
                      className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      + Thêm heading ảnh
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {sec.content || "Chưa có nội dung."}
                  </p>
                  {(sec.imageGroups || []).map((grp, grpIdx) => (
                    <div key={grpIdx} className="space-y-2">
                      {grp.heading && (
                        <h5
                          className={`text-sm font-bold underline ${
                            grp.headingColor === "red"
                              ? "text-red-600"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {grp.heading}
                        </h5>
                      )}
                      <div className="flex flex-wrap gap-3">
                        {grp.imageUrls.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt=""
                            className="w-28 h-28 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {isEditing && (
          <button
            type="button"
            onClick={() => setSections([...sections, EMPTY_SECTION()])}
            className="w-full py-3.5 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            + Thêm mục mới (Quy cách may, Kiểm chất lượng...)
          </button>
        )}

        {/* Attachments Section */}
        {doc && (
          <AttachmentsSection
            attachments={doc.attachments}
            isPending={linkAttachment.isPending || unlinkAttachment.isPending}
            onLink={handleLinkAttachment}
            onUnlink={handleUnlinkAttachment}
          />
        )}
      </div>

      {/* Dialog Modals */}
      {previewOpen && (
        <PreviewModal
          doc={
            doc
              ? {
                  ...doc,
                  section1ImageUrl: sec1Image || doc.section1ImageUrl,
                  section1Description: sec1Desc || doc.section1Description,
                  section2Accessories: sec2Accessories || doc.section2Accessories,
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
                  section1Description: sec1Desc,
                  section1ImageUrl: sec1Image || null,
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
          onCopy={(targetId, mode, exclude) =>
            void handleCopy(targetId, mode, exclude)
          }
          onClose={() => setCopyOpen(false)}
        />
      )}

      <Toast
        open={Boolean(toast)}
        message={toast?.message ?? ""}
        variant={toast?.variant}
        onClose={hideToast}
      />
    </div>
  );
}
