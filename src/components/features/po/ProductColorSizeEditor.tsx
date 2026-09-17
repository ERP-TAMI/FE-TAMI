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
  // Chỉ tính qty của các màu ĐÃ đặt tên — khớp với điều kiện chặn submit ở
  // component cha (namedColors.some(qty>0)), nếu không cảnh báo này có thể
  // tắt/bật sai lệch với lý do form thực sự bị chặn.
  const namedColorsTotal = useMemo(
    () => calcTotalFromColors(displayedColors.filter((c) => c.colorName.trim())),
    [displayedColors],
  );
  const showZeroQuantityWarning = showValidationErrors && namedColorsTotal === 0 && !anyNameMissing;

  // Tên trùng chỉ tính khi đã có tên (khác lỗi "thiếu tên" ở trên) — BE từ
  // chối UNIQUE(product_id, color_name) đúng theo tên đã trim, so khớp y hệt
  // ở đây để báo đỏ ngay tại chỗ thay vì để rớt xuống lỗi 400 sau khi lưu.
  const duplicateColorNames = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of displayedColors) {
      const name = c.colorName.trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) || 0) + 1);
    }
    return new Set([...counts.entries()].filter(([, n]) => n > 1).map(([name]) => name));
  }, [displayedColors]);

  return (
    <div className="space-y-3">
      {displayedColors.map((color, colorIdx) => {
        const colorKey = color.id || `color-${colorIdx}`;
        const colorTotal = (color.sizes || []).reduce(
          (sum, s) => sum + (Number(s.quantity) || 0),
          0,
        );
        const trimmedName = color.colorName.trim();
        const nameMissing = showValidationErrors && !trimmedName;
        const nameDuplicate =
          showValidationErrors && !nameMissing && duplicateColorNames.has(trimmedName);

        // So khớp uppercase vì mọi size label đều được viết hoa trước khi
        // gửi lên BE (xem cleanColors ở các trang gọi component này) — trùng
        // theo đúng dạng sẽ được submit, không phải theo chữ người dùng gõ.
        const sizeLabelCounts = new Map<string, number>();
        for (const s of color.sizes || []) {
          const label = s.sizeLabel.trim().toUpperCase();
          if (!label) continue;
          sizeLabelCounts.set(label, (sizeLabelCounts.get(label) || 0) + 1);
        }
        const hasDuplicateSize =
          showValidationErrors &&
          [...sizeLabelCounts.values()].some((n) => n > 1);

        return (
          <div
            key={colorKey}
            className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 space-y-3"
          >
            {/* Tên màu + xóa — trên 1 hàng */}
            <div className="flex items-center gap-2.5">
              <input
                type="text"
                disabled={disabled}
                value={color.colorName || ""}
                onChange={(e) => handleUpdateColor(colorIdx, { colorName: e.target.value })}
                placeholder="Tên màu — VD: Trắng, Đen, Xanh Navy..."
                className={`min-w-0 flex-1 rounded-lg border bg-white px-3 py-2 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:ring-1 dark:bg-gray-800 dark:text-white ${
                  nameMissing || nameDuplicate
                    ? "border-error-400 focus:border-error-500 focus:ring-error-500 dark:border-error-500"
                    : "border-gray-300 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-700"
                }`}
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
            {nameDuplicate && (
              <p className="-mt-2 text-xs font-medium text-error-600 dark:text-error-400">
                Tên màu "{trimmedName}" bị trùng — mỗi màu chỉ được khai báo một lần.
              </p>
            )}

            {/* Size + số lượng: mỗi size 1 khối nhỏ gọn, không lồng khung phụ */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(color.sizes || []).map((sizeItem, sizeIdx) => {
                const sizeDuplicate =
                  showValidationErrors &&
                  (sizeLabelCounts.get(sizeItem.sizeLabel.trim().toUpperCase()) || 0) > 1;
                return (
                <div
                  key={`${sizeItem.sizeLabel}-${sizeIdx}`}
                  className={`flex items-stretch overflow-hidden rounded-lg border ${
                    sizeDuplicate
                      ? "border-error-400 dark:border-error-500"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center px-2 font-mono text-xs font-bold ${
                      sizeDuplicate
                        ? "bg-error-50 text-error-600 dark:bg-error-950/40 dark:text-error-400"
                        : "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                    }`}
                  >
                    {sizeItem.sizeLabel}
                  </span>
                  <input
                    type="number"
                    min="0"
                    disabled={disabled}
                    value={sizeItem.quantity ?? 0}
                    onChange={(e) => handleUpdateSizeQuantity(colorIdx, sizeIdx, e.target.value)}
                    className="w-12 border-l border-gray-300 bg-white px-1.5 py-1 text-center text-xs font-semibold text-gray-900 focus:bg-brand-50/40 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:bg-gray-800 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSize(colorIdx, sizeIdx)}
                      className="flex items-center justify-center border-l border-gray-200 px-1.5 text-gray-300 hover:bg-rose-50 hover:text-rose-500 transition-colors cursor-pointer dark:border-gray-700 dark:hover:bg-rose-950/30"
                      title="Xóa size này"
                    >
                      ×
                    </button>
                  )}
                </div>
                );
              })}

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
            {hasDuplicateSize && (
              <p className="-mt-2 text-xs font-medium text-error-600 dark:text-error-400">
                Size bị trùng trong cùng một màu — mỗi size chỉ được khai báo một lần.
              </p>
            )}

            <div
              className={`flex items-center justify-end gap-1.5 text-xs ${
                showZeroQuantityWarning ? "text-error-600 dark:text-error-400" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {showZeroQuantityWarning && displayedColors.length === 1 && (
                <span className="font-medium">Vui lòng nhập số lượng (pcs) cho ít nhất một size.</span>
              )}
              Tổng{" "}
              <strong
                className={`mx-1 font-mono font-bold ${
                  showZeroQuantityWarning ? "text-error-600 dark:text-error-400" : "text-brand-600 dark:text-brand-400"
                }`}
              >
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
          className={`rounded-2xl border p-4 space-y-3 ${
            showZeroQuantityWarning
              ? "border-error-300 bg-error-50/60 dark:border-error-800 dark:bg-error-950/20"
              : "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Tổng theo size
              <span className="ml-1.5 font-normal text-gray-400 dark:text-gray-500">
                ({displayedColors.length} màu)
              </span>
            </span>
            <div
              className={`rounded-full px-3 py-1 text-sm font-bold font-mono ${
                showZeroQuantityWarning
                  ? "bg-error-100 text-error-700 dark:bg-error-950/50 dark:text-error-400"
                  : "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
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
          <div className="flex flex-wrap gap-2">
            {Object.entries(totalsBySize).map(([sz, qty]) => (
              <div
                key={sz}
                className="flex min-w-[4.5rem] flex-col items-center gap-0.5 rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  {sz}
                </span>
                <span className="font-mono text-lg font-bold leading-none text-gray-900 dark:text-white">
                  {qty.toLocaleString("vi-VN")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
