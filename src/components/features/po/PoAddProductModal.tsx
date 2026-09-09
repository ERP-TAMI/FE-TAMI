import { useState } from "react";
import { Modal, Button } from "@/components/shared";
import { useStyles } from "@/hooks/useStyles";
import type { CreatePoProductInput } from "@/types/po";

interface Props {
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (input: CreatePoProductInput) => Promise<void>;
}

export function PoAddProductModal({ isOpen, isPending, onClose, onSubmit }: Props) {
  const [mode, setMode] = useState<"select" | "manual">("select");
  const [selectedStyleId, setSelectedStyleId] = useState("");
  const [styleCode, setStyleCode] = useState("");
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [colorName, setColorName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("Hoạt động");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: stylesData } = useStyles({ limit: 100 });
  const styleList = stylesData?.data || [];

  const handleSelectStyle = (id: string) => {
    setSelectedStyleId(id);
    const found = styleList.find((s) => s.id === id);
    if (found) {
      setStyleCode(found.styleCode);
      setProductName(found.styleName);
      setCategory(found.category || "");
    }
  };

  const handleReset = () => {
    setSelectedStyleId("");
    setStyleCode("");
    setProductName("");
    setCategory("");
    setColorName("");
    setDeadline("");
    setStatus("Hoạt động");
    setErrorMsg(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!styleCode.trim()) {
      setErrorMsg("Mã Style/Sản phẩm không được để trống.");
      return;
    }
    if (!productName.trim()) {
      setErrorMsg("Tên sản phẩm không được để trống.");
      return;
    }

    try {
      await onSubmit({
        styleCode: styleCode.trim(),
        productName: productName.trim(),
        category: category.trim() || undefined,
        colorName: colorName.trim() || undefined,
        deadline: deadline || undefined,
        status: status.trim() || "Hoạt động",
        styleId: selectedStyleId || undefined,
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
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="rounded-xl border border-error-200 bg-error-50 p-3 text-theme-xs font-medium text-error-700 dark:border-error-900/40 dark:bg-error-950/40 dark:text-error-300">
            {errorMsg}
          </div>
        )}

        {/* Tab switch mode */}
        <div className="flex rounded-lg border border-gray-200 bg-gray-50/80 p-0.5 dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            onClick={() => setMode("select")}
            className={`flex-1 rounded-md py-1.5 text-theme-xs font-medium transition-colors ${
              mode === "select"
                ? "bg-white text-brand-600 shadow-xs dark:bg-gray-800 dark:text-brand-400 font-semibold"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Chọn từ danh mục Mẫu Fit
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`flex-1 rounded-md py-1.5 text-theme-xs font-medium transition-colors ${
              mode === "manual"
                ? "bg-white text-brand-600 shadow-xs dark:bg-gray-800 dark:text-brand-400 font-semibold"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Nhập thủ công
          </button>
        </div>

        {mode === "select" && (
          <div>
            <label className="block text-theme-xs font-semibold text-gray-700 dark:text-gray-300">
              Chọn mẫu Fit
            </label>
            <select
              value={selectedStyleId}
              onChange={(e) => handleSelectStyle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-theme-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
            >
              <option value="">-- Chọn mẫu sản phẩm từ hệ thống --</option>
              {styleList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.styleCode} - {st.styleName} {st.category ? `(${st.category})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label className="block text-theme-xs font-semibold text-gray-700 dark:text-gray-300">
              Mã Style / SP <span className="text-error-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: ST-2026-001"
              value={styleCode}
              onChange={(e) => setStyleCode(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-theme-sm font-mono text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
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
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-theme-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label className="block text-theme-xs font-semibold text-gray-700 dark:text-gray-300">
              Danh mục / Dòng
            </label>
            <input
              type="text"
              placeholder="VD: Áo thun, Quần Khaki..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-theme-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-theme-xs font-semibold text-gray-700 dark:text-gray-300">
              Màu sắc
            </label>
            <input
              type="text"
              placeholder="VD: Navy, White, Đen..."
              value={colorName}
              onChange={(e) => setColorName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-theme-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label className="block text-theme-xs font-semibold text-gray-700 dark:text-gray-300">
              Hạn giao (Deadline)
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-theme-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-theme-xs font-semibold text-gray-700 dark:text-gray-300">
              Trạng thái dòng SP
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-theme-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
            >
              <option value="Hoạt động">Hoạt động</option>
              <option value="Đang may mẫu">Đang may mẫu</option>
              <option value="Chờ duyệt">Chờ duyệt</option>
              <option value="Đã duyệt">Đã duyệt</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button variant="outline" size="sm" onClick={handleClose} disabled={isPending}>
            Hủy
          </Button>
          <Button size="sm" type="submit" disabled={isPending}>
            {isPending ? "Đang thêm..." : "+ Thêm vào PO"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
