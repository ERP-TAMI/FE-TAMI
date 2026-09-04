import { RefObject } from "react";
import type { Style } from "@/types/style";
import { StyleStatusBadge } from "./StyleStatusBadge";
import { StyleImagePlaceholder } from "./StyleImagePlaceholder";

interface Props {
  style: Style;
  imageUrl: string | null;
  isDragging: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onClearImage: () => void;
  onToggleStatus: () => void;
  isStatusPending: boolean;
}

export function GeneralTab({
  style,
  imageUrl,
  isDragging,
  fileInputRef,
  onFileSelect,
  onDrop,
  onDragOver,
  onDragLeave,
  onClearImage,
  onToggleStatus,
  isStatusPending,
}: Props) {
  const formattedCreatedAt = new Date(style.createdAt).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedUpdatedAt = new Date(style.updatedAt).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-start pt-3">
      {/* Left Column: Product Photo Visual Focus (40% / 5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          {imageUrl ? (
            <div className="relative group overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
              <img
                src={imageUrl}
                alt={style.styleName}
                className="aspect-[4/5] w-full object-contain"
              />
              <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg bg-white/90 px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-white backdrop-blur-xs dark:bg-gray-900/90 dark:text-gray-200 dark:hover:bg-gray-900 transition-colors"
                >
                  Thay ảnh
                </button>
                <button
                  type="button"
                  onClick={onClearImage}
                  className="rounded-lg bg-white/90 px-3.5 py-2 text-xs font-semibold text-red-600 shadow-xs hover:bg-white backdrop-blur-xs dark:bg-gray-900/90 dark:text-red-400 dark:hover:bg-gray-900 transition-colors"
                >
                  Xóa
                </button>
              </div>
            </div>
          ) : (
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex aspect-[4/5] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                isDragging
                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30"
                  : "border-gray-200 hover:border-gray-300 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/40"
              }`}
            >
              <StyleImagePlaceholder
                className="h-32 w-32 text-gray-300 dark:text-gray-600 mb-4"
              />
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Thêm ảnh mẫu
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
          onChange={onFileSelect}
          className="hidden"
        />
      </div>

      {/* Right Column: Prominent Style Information (60% / 7 cols) */}
      <div className="lg:col-span-7 space-y-7">
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Thông tin mẫu
          </h3>
          <dl className="divide-y divide-gray-100 dark:divide-gray-800/80 border-t border-b border-gray-100 dark:border-gray-800/80">
            <div className="flex items-center py-4 text-base">
              <dt className="w-1/3 shrink-0 font-semibold text-gray-600 dark:text-gray-400">
                Mã mẫu
              </dt>
              <dd className="w-2/3 min-w-0 font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
                {style.styleCode}
              </dd>
            </div>
            <div className="flex items-center py-4 text-base">
              <dt className="w-1/3 shrink-0 font-semibold text-gray-600 dark:text-gray-400">
                Tên mẫu
              </dt>
              <dd className="w-2/3 min-w-0 break-words text-xl font-bold text-gray-900 dark:text-white">
                {style.styleName}
              </dd>
            </div>
            <div className="flex items-center py-4 text-base">
              <dt className="w-1/3 shrink-0 font-semibold text-gray-600 dark:text-gray-400">
                Dòng sản phẩm
              </dt>
              <dd className="w-2/3 min-w-0 break-words text-lg font-semibold text-gray-800 dark:text-gray-200">
                {style.category || "—"}
              </dd>
            </div>
            <div className="flex items-center py-4 text-base">
              <dt className="w-1/3 shrink-0 font-semibold text-gray-600 dark:text-gray-400">
                Trạng thái
              </dt>
              <dd className="flex w-2/3 min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={onToggleStatus}
                  disabled={isStatusPending}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    style.status === "active"
                      ? "bg-emerald-500"
                      : "bg-gray-300 dark:bg-gray-700"
                  }`}
                  title={
                    style.status === "active"
                      ? "Đang Hoạt động (Bấm để chuyển về Nháp)"
                      : "Đang Nháp (Bấm để kích hoạt)"
                  }
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      style.status === "active" ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <StyleStatusBadge status={style.status} />
              </dd>
            </div>
          </dl>
        </div>

        {/* Description Block */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Mô tả đặc điểm
          </h4>
          <div className="rounded-xl border border-gray-200/80 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-gray-900/60">
            <p className="text-base text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
              {style.description || "Chưa có mô tả chi tiết."}
            </p>
          </div>
        </div>

        {/* Metadata Footer */}
        <div className="pt-3 text-xs text-gray-400 dark:text-gray-500 flex flex-wrap gap-4 border-t border-gray-100 dark:border-gray-800">
          <span>Tạo lúc {formattedCreatedAt}</span>
          <span>•</span>
          <span>Cập nhật {formattedUpdatedAt}</span>
        </div>
      </div>
    </div>
  );
}
