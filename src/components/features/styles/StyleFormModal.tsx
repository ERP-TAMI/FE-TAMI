import { useEffect, useState } from "react";
import type { Style, StyleStatus, CreateStylePayload } from "@/types/style";
import { UnsavedChangesDialog } from "./UnsavedChangesDialog";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateStylePayload) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  hasCodeConflict?: boolean;
  styleToEdit?: Style | null;
}

export function StyleFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  serverError,
  hasCodeConflict = false,
  styleToEdit,
}: Props) {
  const [styleCode, setStyleCode] = useState("");
  const [styleName, setStyleName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<StyleStatus>("draft");

  const [codeError, setCodeError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);

  const isEdit = !!styleToEdit;

  useEffect(() => {
    if (styleToEdit) {
      setStyleCode(styleToEdit.styleCode);
      setStyleName(styleToEdit.styleName);
      setDescription(styleToEdit.description || "");
      setCategory(styleToEdit.category || "");
      setStatus(styleToEdit.status);
    } else {
      setStyleCode("");
      setStyleName("");
      setDescription("");
      setCategory("");
      setStatus("draft");
    }
    setCodeError(null);
    setNameError(null);
  }, [styleToEdit, isOpen]);

  const isDirty = isEdit
    ? styleCode !== styleToEdit.styleCode ||
      styleName !== styleToEdit.styleName ||
      description !== (styleToEdit.description || "") ||
      category !== (styleToEdit.category || "") ||
      status !== styleToEdit.status
    : styleCode.trim() !== "" ||
      styleName.trim() !== "" ||
      description.trim() !== "" ||
      category.trim() !== "";

  const handleRequestClose = () => {
    if (isDirty) setShowUnsavedConfirm(true);
    else onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError(null);
    setNameError(null);

    let hasClientError = false;
    if (!styleCode.trim()) {
      setCodeError("Mã mẫu Fit không được để trống.");
      hasClientError = true;
    }
    if (!styleName.trim()) {
      setNameError("Tên mẫu Fit không được để trống.");
      hasClientError = true;
    }
    if (hasClientError) return;

    onSubmit({
      styleCode: styleCode.trim(),
      styleName: styleName.trim(),
      description: description.trim() || undefined,
      category: category.trim() || undefined,
      status,
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
        <div className="w-full max-w-lg overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {isEdit ? `Chỉnh sửa Mẫu Fit (${styleToEdit?.styleCode})` : "Tạo Mẫu Fit Mới"}
              </h3>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Thêm một mẫu fit mới vào hệ thống.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRequestClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>

          {serverError && !hasCodeConflict && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Style Code Field */}
            <div>
              <label htmlFor="style-code" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Mã mẫu <span className="text-red-500">*</span>
              </label>
              <input
                id="style-code"
                type="text"
                value={styleCode}
                onChange={(e) => {
                  setStyleCode(e.target.value);
                  if (codeError) setCodeError(null);
                }}
                placeholder="STY-000248"
                className={`mt-1 h-10 w-full rounded-lg border px-3 font-mono text-sm text-gray-900 dark:text-white dark:bg-gray-800 transition-colors focus:outline-none focus:ring-2 ${
                  codeError || hasCodeConflict
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-gray-700"
                }`}
              />
              {(codeError || hasCodeConflict) && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                  {codeError || serverError}
                </p>
              )}
            </div>

            {/* Style Name Field */}
            <div>
              <label htmlFor="style-name" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Tên mẫu <span className="text-red-500">*</span>
              </label>
              <input
                id="style-name"
                type="text"
                value={styleName}
                onChange={(e) => {
                  setStyleName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                placeholder="VD: Oversized Tee Classic"
                className={`mt-1 h-10 w-full rounded-lg border px-3 text-sm text-gray-900 dark:text-white dark:bg-gray-800 transition-colors focus:outline-none focus:ring-2 ${
                  nameError
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-gray-700"
                }`}
              />
              {nameError && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">{nameError}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Category Field */}
              <div>
                <label htmlFor="style-category" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Dòng sản phẩm
                </label>
                <input
                  id="style-category"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="VD: Áo thun"
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-colors"
                />
              </div>

              {/* Status Field: chỉ Nháp / Hoạt động */}
              <div>
                <label htmlFor="style-status" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Trạng thái
                </label>
                <select
                  id="style-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StyleStatus)}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-colors"
                >
                  <option value="draft">Nháp</option>
                  <option value="active">Hoạt động</option>
                </select>
              </div>
            </div>

            {/* Description Field */}
            <div>
              <label htmlFor="style-description" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Mô tả
              </label>
              <textarea
                id="style-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập thông tin đặc điểm chi tiết của mẫu Fit..."
                className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-colors"
              />
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-2.5 border-t border-gray-100 pt-4 dark:border-gray-800">
              <button
                type="button"
                onClick={handleRequestClose}
                className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Đang lưu..." : isEdit ? "Lưu mẫu fit" : "Tạo Mới"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <UnsavedChangesDialog
        isOpen={showUnsavedConfirm}
        onConfirmLeave={() => {
          setShowUnsavedConfirm(false);
          onClose();
        }}
        onCancel={() => setShowUnsavedConfirm(false)}
      />
    </>
  );
}
