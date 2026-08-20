import { useState, useEffect } from "react";
import type { Style, StyleStatus, CreateStylePayload, UpdateStylePayload } from "@/types/style";
import { stylesApi } from "@/features/styles/api/stylesApi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  styleToEdit?: Style | null;
}

export function StyleFormModal({ isOpen, onClose, onSuccess, styleToEdit }: Props) {
  const [styleCode, setStyleCode] = useState("");
  const [styleName, setStyleName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<StyleStatus>("draft");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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
    setErrorMsg(null);
  }, [styleToEdit, isOpen]);

  const isDirty = isEdit
    ? styleCode !== styleToEdit.styleCode ||
      styleName !== styleToEdit.styleName ||
      description !== (styleToEdit.description || "") ||
      category !== (styleToEdit.category || "") ||
      status !== styleToEdit.status
    : styleCode.trim() !== "" || styleName.trim() !== "" || description.trim() !== "";

  const handleClose = () => {
    if (isDirty && !showUnsavedConfirm) {
      setShowUnsavedConfirm(true);
      return;
    }
    setShowUnsavedConfirm(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!styleCode.trim()) {
      setErrorMsg("Mã mẫu Fit không được để trống.");
      return;
    }
    if (!styleName.trim()) {
      setErrorMsg("Tên mẫu Fit không được để trống.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEdit && styleToEdit) {
        const payload: UpdateStylePayload = {
          styleCode: styleCode.trim(),
          styleName: styleName.trim(),
          description: description.trim() || undefined,
          category: category.trim() || undefined,
          status,
        };
        await stylesApi.updateStyle(styleToEdit.id, payload);
      } else {
        const payload: CreateStylePayload = {
          styleCode: styleCode.trim(),
          styleName: styleName.trim(),
          description: description.trim() || undefined,
          category: category.trim() || undefined,
          status,
        };
        await stylesApi.createStyle(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const serverMessage = err.response?.data?.message;
      if (Array.isArray(serverMessage)) {
        setErrorMsg(serverMessage.join(", "));
      } else if (serverMessage) {
        setErrorMsg(serverMessage);
      } else {
        setErrorMsg("Có lỗi xảy ra khi lưu thông tin mẫu Fit.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEdit ? `Chỉnh sửa Mẫu Fit (${styleToEdit?.styleCode})` : "Tạo Mẫu Fit Mới"}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mã mẫu Fit <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={styleCode}
              onChange={(e) => setStyleCode(e.target.value)}
              placeholder="VD: FIT-2026-001"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tên mẫu Fit <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={styleName}
              onChange={(e) => setStyleName(e.target.value)}
              placeholder="VD: Áo Polo Nam Cotton"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nhóm mẫu (Category)
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="VD: Áo Polo, Áo Sơ Mi"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Trạng thái
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StyleStatus)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="draft">Draft (Nháp)</option>
              <option value="approved">Approved (Đã duyệt)</option>
              <option value="active">Active (Hoạt động)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mô tả
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập thông tin chi tiết hoặc lưu ý cho mẫu Fit..."
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo Mới"}
            </button>
          </div>
        </form>

        {/* Modal cảnh báo dữ liệu chưa lưu */}
        {showUnsavedConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl dark:bg-gray-800">
              <h4 className="text-base font-bold text-amber-600 dark:text-amber-400">
                ⚠️ Dữ liệu chưa lưu!
              </h4>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Bạn đã thay đổi một số thông tin trên biểu mẫu. Bạn có chắc chắn muốn thoát mà không lưu?
              </p>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUnsavedConfirm(false)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200"
                >
                  Quay lại sửa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUnsavedConfirm(false);
                    onClose();
                  }}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                >
                  Bỏ qua & Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
