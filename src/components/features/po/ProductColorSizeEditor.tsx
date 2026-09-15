import { useState, useMemo } from "react";
import { PlusIcon, TrashBinIcon } from "@/icons";
import { Button } from "@/components/shared";
import { useActiveSizeCharts } from "@/hooks/useSizeCharts";
import type { ProductColorItem, ProductColorSizeItem } from "@/types/po";
import type { SizeChart } from "@/types/size-chart";

interface ProductColorSizeEditorProps {
  colors?: ProductColorItem[];
  onChange: (colors: ProductColorItem[]) => void;
  disabled?: boolean;
  allowMultipleColors?: boolean;
  /** Khi true: viền đỏ + cảnh báo ngay tại từng dòng màu còn thiếu tên/số lượng,
   * thay vì chỉ báo lỗi chung chung ở nơi khác. Bật lên sau khi validate thất bại. */
  showValidationErrors?: boolean;
}

function generateTempId(prefix = "c") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Input màu gốc chỉ chấp nhận đúng dạng #rrggbb — mã người dùng gõ tay có
// thể chưa đủ hoặc chưa hợp lệ trong lúc đang gõ, lúc đó show swatch trắng
// trung tính thay vì để trình duyệt tự ý reset giá trị.
function normalizeHexForPicker(code?: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(code || "") ? (code as string).toLowerCase() : "#ffffff";
}

export function calcTotalBySize(colors: ProductColorItem[] = []): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const color of colors) {
    for (const size of color.sizes || []) {
      if (!size.sizeLabel) continue;
      totals[size.sizeLabel] = (totals[size.sizeLabel] || 0) + (Number(size.quantity) || 0);
    }
  }
  return totals;
}

export function calcTotalFromColors(colors: ProductColorItem[] = []): number {
  return Object.values(calcTotalBySize(colors)).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
}

export function ProductColorSizeEditor({
  colors = [],
  onChange,
  disabled = false,
  allowMultipleColors = true,
  showValidationErrors = false,
}: ProductColorSizeEditorProps) {
  const { data: sizeChartsData } = useActiveSizeCharts();
  const sizeCharts: SizeChart[] = useMemo(
    () => (Array.isArray(sizeChartsData) ? sizeChartsData : []),
    [sizeChartsData],
  );

  const [newSizeNames, setNewSizeNames] = useState<Record<string, string>>({});
  const [addingSizeForColor, setAddingSizeForColor] = useState<string | null>(null);

  // Đảm bảo luôn có ít nhất 1 màu mặc định nếu mảng rỗng
  const displayedColors: ProductColorItem[] = useMemo(() => {
    if (colors.length > 0) return colors;
    return [
      {
        id: generateTempId("color"),
        colorName: "",
        sizes: [
          { sizeLabel: "S", quantity: 0 },
          { sizeLabel: "M", quantity: 0 },
          { sizeLabel: "L", quantity: 0 },
        ],
      },
    ];
  }, [colors]);

  const handleUpdateColor = (index: number, updates: Partial<ProductColorItem>) => {
    const updated = displayedColors.map((col, idx) => (idx === index ? { ...col, ...updates } : col));
    onChange(updated);
  };

  const handleAddColor = () => {
    const newColor: ProductColorItem = {
      id: generateTempId("color"),
      colorName: "",
      sizes: [
        { sizeLabel: "S", quantity: 0 },
        { sizeLabel: "M", quantity: 0 },
        { sizeLabel: "L", quantity: 0 },
      ],
    };
    onChange([...displayedColors, newColor]);
  };

  const handleRemoveColor = (index: number) => {
    if (displayedColors.length <= 1) return;
    onChange(displayedColors.filter((_, idx) => idx !== index));
  };

  const handleApplySizeChart = (colorIndex: number, chartId: string) => {
    const chart = sizeCharts.find((c: SizeChart) => c.id === chartId);
    if (!chart || !chart.sizes) return;

    const color = displayedColors[colorIndex];
    const existingSizesMap = new Map((color.sizes || []).map((s) => [s.sizeLabel, s.quantity]));

    const newSizes: ProductColorSizeItem[] = chart.sizes.map((sz: string, idx: number) => ({
      id: generateTempId("size"),
      sizeLabel: sz,
      quantity: existingSizesMap.get(sz) ?? 0,
      orderIndex: idx,
    }));

    handleUpdateColor(colorIndex, { sizes: newSizes });
  };

  const handleUpdateSizeQuantity = (colorIndex: number, sizeIndex: number, rawValue: string) => {
    const color = displayedColors[colorIndex];
    const val = rawValue === "" ? 0 : Math.max(0, parseInt(rawValue, 10) || 0);
    const updatedSizes = (color.sizes || []).map((s, idx) =>
      idx === sizeIndex ? { ...s, quantity: val } : s,
    );
    handleUpdateColor(colorIndex, { sizes: updatedSizes });
  };

  const handleRemoveSize = (colorIndex: number, sizeIndex: number) => {
    const color = displayedColors[colorIndex];
    const updatedSizes = (color.sizes || []).filter((_, idx) => idx !== sizeIndex);
    handleUpdateColor(colorIndex, { sizes: updatedSizes });
  };

  const handleAddNewSize = (colorIndex: number, colorId: string) => {
    const name = (newSizeNames[colorId] || "").trim().toUpperCase();
    if (!name) return;

    const color = displayedColors[colorIndex];
    const exists = (color.sizes || []).some(
      (s) => s.sizeLabel.toUpperCase() === name,
    );
    if (!exists) {
      const updatedSizes: ProductColorSizeItem[] = [
        ...(color.sizes || []),
        { id: generateTempId("size"), sizeLabel: name, quantity: 0, orderIndex: (color.sizes?.length || 0) },
      ];
      handleUpdateColor(colorIndex, { sizes: updatedSizes });
    }

    setNewSizeNames((prev) => ({ ...prev, [colorId]: "" }));
    setAddingSizeForColor(null);
  };

  const totalsBySize = useMemo(() => calcTotalBySize(displayedColors), [displayedColors]);
  const grandTotal = useMemo(() => calcTotalFromColors(displayedColors), [displayedColors]);
  // Tên màu là lỗi gốc — nếu màu còn chưa có tên thì báo mỗi tổng số lượng
  // là 0 nữa sẽ tạo 2 cảnh báo cho cùng 1 nguyên nhân, rối mắt không cần thiết.
  const anyNameMissing = displayedColors.some((c) => !c.colorName.trim());
  const showZeroQuantityWarning = showValidationErrors && grandTotal === 0 && !anyNameMissing;

  return (
    <div className="space-y-3">
      {displayedColors.map((color, colorIdx) => {
        const colorKey = color.id || `color-${colorIdx}`;
        const colorTotal = (color.sizes || []).reduce(
          (sum, s) => sum + (Number(s.quantity) || 0),
          0,
        );
        const nameMissing = showValidationErrors && !color.colorName.trim();

        return (
          <div
            key={colorKey}
            className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 space-y-3"
          >
            {/* Swatch + tên + mã màu + xóa — tất cả trên 1 hàng */}
            <div className="flex items-center gap-2.5">
              {!disabled ? (
                <label
                  className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-full border border-gray-200 shadow-inner dark:border-gray-700"
                  style={{ backgroundColor: color.colorCode || "#e5e7eb" }}
                  title="Chọn màu"
                >
                  <input
                    type="color"
                    value={normalizeHexForPicker(color.colorCode)}
                    onChange={(e) => handleUpdateColor(colorIdx, { colorCode: e.target.value })}
                    className="absolute -inset-2 cursor-pointer opacity-0"
                  />
                </label>
              ) : (
                <div
                  className="h-9 w-9 shrink-0 rounded-full border border-gray-200 shadow-inner dark:border-gray-700"
                  style={{ backgroundColor: color.colorCode || "#e5e7eb" }}
                />
              )}

              <input
                type="text"
                disabled={disabled}
                value={color.colorName || ""}
                onChange={(e) => handleUpdateColor(colorIdx, { colorName: e.target.value })}
                placeholder="Tên màu — VD: Trắng, Đen, Xanh Navy..."
                className={`min-w-0 flex-1 rounded-lg border bg-white px-3 py-2 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:ring-1 dark:bg-gray-800 dark:text-white ${
                  nameMissing
                    ? "border-error-400 focus:border-error-500 focus:ring-error-500 dark:border-error-500"
                    : "border-gray-300 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-700"
                }`}
              />

              <input
                type="text"
                disabled={disabled}
                value={color.colorCode || ""}
                onChange={(e) => handleUpdateColor(colorIdx, { colorCode: e.target.value })}
                placeholder="#FFFFFF"
                title="Mã màu (hex)"
                className="w-20 shrink-0 rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs font-mono text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              />

              {allowMultipleColors && displayedColors.length > 1 && !disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveColor(colorIdx)}
                  className="shrink-0 text-gray-400 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  title="Xóa màu này"
                >
                  <TrashBinIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            {nameMissing && (
              <p className="-mt-2 text-xs font-medium text-error-600 dark:text-error-400">
                Vui lòng nhập tên màu sắc.
              </p>
            )}

            {/* Size + số lượng: mỗi size 1 khối nhỏ gọn, không lồng khung phụ */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(color.sizes || []).map((sizeItem, sizeIdx) => (
                <div
                  key={`${sizeItem.sizeLabel}-${sizeIdx}`}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50/70 pl-2.5 pr-1 py-1 dark:border-gray-700 dark:bg-gray-800/60"
                >
                  <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                    {sizeItem.sizeLabel}
                  </span>
                  <input
                    type="number"
                    min="0"
                    disabled={disabled}
                    value={sizeItem.quantity ?? 0}
                    onChange={(e) => handleUpdateSizeQuantity(colorIdx, sizeIdx, e.target.value)}
                    className="w-10 rounded border border-gray-200 bg-white px-1 py-1 text-center text-xs font-semibold text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSize(colorIdx, sizeIdx)}
                      className="p-1 text-gray-300 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Xóa size này"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              {!disabled &&
                (addingSizeForColor === colorKey ? (
                  <div className="flex items-center gap-1 rounded-lg border border-brand-300 bg-white p-1 dark:border-brand-700 dark:bg-gray-900">
                    <input
                      autoFocus
                      type="text"
                      placeholder="XL, 2XL..."
                      value={newSizeNames[colorKey] || ""}
                      onChange={(e) =>
                        setNewSizeNames((prev) => ({
                          ...prev,
                          [colorKey]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddNewSize(colorIdx, colorKey);
                        } else if (e.key === "Escape") {
                          setAddingSizeForColor(null);
                        }
                      }}
                      className="w-16 rounded border border-gray-200 px-1.5 py-1 font-mono text-xs uppercase dark:bg-gray-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddNewSize(colorIdx, colorKey)}
                      className="rounded bg-brand-600 px-2 py-1 text-xs font-semibold text-white hover:bg-brand-700 cursor-pointer"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingSizeForColor(null)}
                      className="px-1.5 py-1 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingSizeForColor(colorKey)}
                    className="flex items-center gap-1 rounded-lg border border-dashed border-gray-300 px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:border-brand-400 hover:bg-brand-50/50 dark:border-gray-700 dark:text-brand-400 cursor-pointer transition-colors"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    Size
                  </button>
                ))}

              {!disabled && sizeCharts.length > 0 && (
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleApplySizeChart(colorIdx, e.target.value);
                      e.target.value = "";
                    }
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 cursor-pointer"
                >
                  <option value="" disabled>
                    Dùng mẫu size...
                  </option>
                  {sizeCharts.map((chart: SizeChart) => (
                    <option key={chart.id} value={chart.id}>
                      {chart.name} ({chart.sizes?.join(", ")})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex justify-end text-xs text-gray-500 dark:text-gray-400">
              Tổng{" "}
              <strong className="mx-1 font-mono font-bold text-brand-600 dark:text-brand-400">
                {colorTotal.toLocaleString("vi-VN")}
              </strong>
              pcs
            </div>
          </div>
        );
      })}

      {/* Nút thêm màu mới */}
      {allowMultipleColors && !disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddColor}
          className="w-full border-dashed border-gray-300 text-brand-600 hover:bg-brand-50 dark:border-gray-700 dark:text-brand-400 cursor-pointer flex items-center justify-center gap-2 py-2"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Thêm màu khác</span>
        </Button>
      )}

      {/* Tổng hợp toàn sản phẩm — chỉ cần thiết khi có từ 2 màu trở lên, vì
          với đúng 1 màu con số này y hệt tổng của chính màu đó ở trên. */}
      {displayedColors.length > 1 && (
        <div
          className={`rounded-xl border p-3 space-y-1.5 ${
            showZeroQuantityWarning
              ? "border-error-300 bg-error-50/60 dark:border-error-800 dark:bg-error-950/20"
              : "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              Tổng theo size ({displayedColors.length} màu)
            </span>
            <div
              className={`text-sm font-bold font-mono ${
                showZeroQuantityWarning
                  ? "text-error-600 dark:text-error-400"
                  : "text-brand-600 dark:text-brand-400"
              }`}
            >
              {grandTotal.toLocaleString("vi-VN")} pcs
            </div>
          </div>
          {showZeroQuantityWarning && (
            <p className="text-xs font-medium text-error-600 dark:text-error-400">
              Vui lòng nhập số lượng (pcs) cho ít nhất một size.
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(totalsBySize).map(([sz, qty]) => (
              <span
                key={sz}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-0.5 font-mono text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                {sz}
                <strong className="font-bold text-gray-900 dark:text-white">
                  {qty.toLocaleString("vi-VN")}
                </strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
