import { useState } from "react";
import type { CopyMode } from "@/types/production-doc";
import type { Style } from "@/types/style";

interface Props {
  currentStyleId: string;
  styles: Style[];
  isPending: boolean;
  onCopy: (targetStyleId: string, mode: CopyMode, excludeSections?: string[]) => void;
  onClose: () => void;
}

export function CopyDialog({
  currentStyleId,
  styles,
  isPending,
  onCopy,
  onClose,
}: Props) {
  const [targetStyleId, setTargetStyleId] = useState("");
  const [mode, setMode] = useState<CopyMode>("FULL");
  const [excludeSections, setExcludeSections] = useState<string[]>([]);

  const availableStyles = styles.filter((s) => s.id !== currentStyleId);

  const handleSubmit = () => {
    if (!targetStyleId) return;
    onCopy(
      targetStyleId,
      mode,
      mode === "EXCLUDE" ? excludeSections : undefined,
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 space-y-4 border border-gray-200 dark:border-gray-800">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Sao chép tài liệu sản xuất
        </h3>

        <div className="space-y-4 text-xs">
          {/* Target Style Selection */}
          <div className="space-y-1">
            <label className="block font-medium text-gray-700 dark:text-gray-300">
              Chọn Style đích
            </label>
            <select
              value={targetStyleId}
              onChange={(e) => setTargetStyleId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">-- Chọn Style đích --</option>
              {availableStyles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.styleCode} — {s.styleName}
                </option>
              ))}
            </select>
          </div>

          {/* Copy Mode Radio Options */}
          <div className="space-y-1.5">
            <label className="block font-medium text-gray-700 dark:text-gray-300">
              Chế độ sao chép
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-800 dark:text-gray-200">
                <input
                  type="radio"
                  name="copyMode"
                  checked={mode === "FULL"}
                  onChange={() => setMode("FULL")}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>Toàn bộ (Full)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-800 dark:text-gray-200">
                <input
                  type="radio"
                  name="copyMode"
                  checked={mode === "EXCLUDE"}
                  onChange={() => setMode("EXCLUDE")}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>Loại trừ (Exclude)</span>
              </label>
            </div>
          </div>

          {/* Progressive Disclosure: Checkboxes for Exclude Mode */}
          {mode === "EXCLUDE" && (
            <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-800">
              <label className="block font-semibold text-gray-700 dark:text-gray-300">
                Chọn phần KHÔNG copy:
              </label>
              <div className="space-y-1.5 pl-1">
                {[
                  { key: "section1", label: "Section 1: Mô tả hình dáng" },
                  { key: "section2", label: "Section 2: Phụ liệu" },
                  { key: "section3", label: "Section 3: Lưu ý trải cắt" },
                  { key: "section4", label: "Section 4: Comment khách hàng" },
                  { key: "sizeData", label: "Section 5: Thông số Full Size" },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"
                  >
                    <input
                      type="checkbox"
                      checked={excludeSections.includes(item.key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setExcludeSections([...excludeSections, item.key]);
                        } else {
                          setExcludeSections(
                            excludeSections.filter((k) => k !== item.key),
                          );
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !targetStyleId}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-50"
          >
            {isPending ? "Đang copy..." : "Sao chép ngay"}
          </button>
        </div>
      </div>
    </div>
  );
}
