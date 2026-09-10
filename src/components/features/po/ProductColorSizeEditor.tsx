import { useState, useMemo } from "react";
import { PlusIcon, TrashBinIcon, GridIcon } from "@/icons";
import { Button } from "@/components/shared";
import { useActiveSizeCharts } from "@/hooks/useSizeCharts";
import type { ProductColorItem, ProductColorSizeItem } from "@/types/po";
import type { SizeChart } from "@/types/size-chart";

interface ProductColorSizeEditorProps {
  colors?: ProductColorItem[];
  onChange: (colors: ProductColorItem[]) => void;
  disabled?: boolean;
  allowMultipleColors?: boolean;
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

  return (
    <div className="space-y-4">
      {displayedColors.map((color, colorIdx) => {
        const colorKey = color.id || `color-${colorIdx}`;
        const colorTotal = (color.sizes || []).reduce(
          (sum, s) => sum + (Number(s.quantity) || 0),
          0,
        );

        return (
          <div
            key={colorKey}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-3 relative group"
          >
            {/* Header màu sắc */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex-1 min-w-[200px] flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Tên Màu Sắc <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={disabled}
                    value={color.colorName || ""}
                    onChange={(e) => handleUpdateColor(colorIdx, { colorName: e.target.value })}
                    placeholder="VD: Trắng, Đen, Xanh Navy..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div className="w-28 space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Mã màu (Hex)
                  </label>
                  <input
                    type="text"
                    disabled={disabled}
                    value={color.colorCode || ""}
                    onChange={(e) => handleUpdateColor(colorIdx, { colorCode: e.target.value })}
                    placeholder="#FFFFFF"
                    className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-mono text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  />
                </div>
              </div>

              {allowMultipleColors && displayedColors.length > 1 && !disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveColor(colorIdx)}
                  className="text-gray-400 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  title="Xóa màu này"
                >
                  <TrashBinIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Khung Size Breakdown của màu */}
            <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-3 dark:border-gray-800 dark:bg-gray-800/40 space-y-2.5">
              {/* Thanh chọn Bảng Size mẫu & Thêm size */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <GridIcon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Bảng size &amp; Số lượng
                  </span>
                </div>

                {!disabled && sizeCharts.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-gray-500">Mẫu:</span>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleApplySizeChart(colorIdx, e.target.value);
                          e.target.value = "";
                        }
                      }}
                      className="text-xs rounded-md border border-gray-300 bg-white px-2 py-1 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer"
                    >
                      <option value="" disabled>
                        Áp dụng Bảng Size...
                      </option>
                      {sizeCharts.map((chart: SizeChart) => (
                        <option key={chart.id} value={chart.id}>
                          {chart.name} ({chart.sizes?.join(", ")})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Lưới nhập số lượng theo từng size */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1">
                {(color.sizes || []).map((sizeItem, sizeIdx) => (
                  <div
                    key={`${sizeItem.sizeLabel}-${sizeIdx}`}
                    className="flex flex-col bg-white rounded-lg border border-gray-200 p-2 shadow-2xs dark:border-gray-700 dark:bg-gray-900"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                        Size {sizeItem.sizeLabel}
                      </span>
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSize(colorIdx, sizeIdx)}
                          className="text-gray-400 hover:text-rose-500 transition-colors cursor-pointer text-xs"
                          title="Xóa size này"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        disabled={disabled}
                        value={sizeItem.quantity ?? 0}
                        onChange={(e) => handleUpdateSizeQuantity(colorIdx, sizeIdx, e.target.value)}
                        placeholder="0"
                        className="w-full text-right font-semibold text-xs rounded border border-gray-200 bg-gray-50/50 px-2 py-1 text-gray-900 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                      <span className="text-[10px] text-gray-400">pcs</span>
                    </div>
                  </div>
                ))}

                {/* Nút hoặc input thêm size mới */}
                {!disabled && (
                  <div className="flex items-center">
                    {addingSizeForColor === colorKey ? (
                      <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-brand-300 dark:bg-gray-900 dark:border-brand-700">
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
                          className="w-16 text-xs px-1.5 py-1 uppercase rounded border border-gray-200 font-mono dark:bg-gray-800 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddNewSize(colorIdx, colorKey)}
                          className="text-xs px-2 py-1 bg-brand-600 text-white rounded font-semibold hover:bg-brand-700 cursor-pointer"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddingSizeForColor(null)}
                          className="text-xs px-1.5 py-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAddingSizeForColor(colorKey)}
                        className="flex h-full min-h-[58px] w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 bg-white/50 text-xs font-semibold text-brand-600 hover:border-brand-400 hover:bg-brand-50/50 dark:border-gray-700 dark:bg-gray-900/40 dark:text-brand-400 cursor-pointer transition-colors"
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                        <span>Thêm size</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Tổng số lượng của màu này */}
              <div className="flex items-center justify-end pt-2 border-t border-gray-200/80 dark:border-gray-700/80 text-xs">
                <span className="text-gray-500 dark:text-gray-400 mr-1.5">
                  Tổng màu {color.colorName ? `"${color.colorName}"` : ""}:
                </span>
                <span className="font-bold text-brand-600 dark:text-brand-400 font-mono">
                  {colorTotal.toLocaleString("vi-VN")} pcs
                </span>
              </div>
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
          <span>+ Thêm màu sắc khác</span>
        </Button>
      )}

      {/* Khối tổng hợp toàn bộ sản phẩm */}
      <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50/40 p-3.5 dark:border-brand-900/60 dark:bg-brand-950/20 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Tổng quan Sản lượng theo Size (Toàn bộ {displayedColors.length} màu)
          </span>
          <div className="text-sm font-extrabold text-brand-700 dark:text-brand-300 font-mono">
            Tổng: {grandTotal.toLocaleString("vi-VN")} pcs
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {Object.entries(totalsBySize).length === 0 ? (
            <span className="text-xs text-gray-400 italic">Chưa có size nào</span>
          ) : (
            Object.entries(totalsBySize).map(([sz, qty]) => (
              <span
                key={sz}
                className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-white px-2 py-0.5 text-xs font-semibold text-brand-700 shadow-2xs dark:border-brand-800 dark:bg-gray-800 dark:text-brand-300 font-mono"
              >
                <span>Size {sz}:</span>
                <strong className="font-extrabold">{qty.toLocaleString("vi-VN")}</strong>
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
