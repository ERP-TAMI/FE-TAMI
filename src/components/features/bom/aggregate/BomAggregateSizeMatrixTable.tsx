import { useState, useMemo, useEffect, Fragment } from "react";
import { ChevronDown, ChevronRight, Package } from "lucide-react";
import type { BomAggregateItem } from "@/types/bom";

interface ProductInfo {
  id?: string;
  productName?: string;
  productCode?: string;
  styleCode?: string;
}

export interface BomAggregateSizeMatrixTableProps {
  items: BomAggregateItem[];
  page: number;
  limit: number;
  totalMaterialsCount?: number;
  bomCount?: number;
  productCount?: number;
  poCount?: number;
  productList?: ProductInfo[];
  search?: string;
  onSearchChange?: (value: string) => void;
  displayMode?: "grouped" | "detailed";
  onDisplayModeChange?: (mode: "grouped" | "detailed") => void;
  hideToolbar?: boolean;
}

import { sortSizes, getColorDotClass } from "@/lib/bomAggregateUtils";

function formatQty(value: number): string {
  if (value === 0) return "—";
  return Number(value).toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

interface ProductColorBreakdown {
  colorName: string;
  total: number;
  sizes: Record<string, number>;
}

interface ProductGroup {
  productId: string;
  productName: string;
  productCode?: string;
  colors: ProductColorBreakdown[];
  sizes: Record<string, number>;
  total: number;
}

function groupBreakdownByProduct(
  item: BomAggregateItem,
  productList: ProductInfo[] = []
): ProductGroup[] {
  const bList = item.breakdown || [];
  if (bList.length === 0) return [];

  // 1. Group directly from breakdown items if they have product info
  const hasProductInfo = bList.some(
    (b) => Boolean(b.productCode) || Boolean(b.productName) || Boolean(b.productId)
  );

  if (hasProductInfo) {
    const map = new Map<string, ProductGroup>();
    bList.forEach((b) => {
      const prodCode = b.productCode?.trim() || "";
      const prodName = b.productName?.trim() || prodCode || "Sản phẩm";
      const groupKey = b.productId || prodCode || prodName;

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          productId: b.productId || groupKey,
          productName: prodName,
          productCode: prodCode || undefined,
          colors: [],
          sizes: {},
          total: 0,
        });
      }
      const prod = map.get(groupKey)!;
      const colorName = b.colorName || "Mặc định";
      const size = b.sizeLabel?.trim().toUpperCase() || "";
      const qty = Number(b.requiredQuantity) || 0;

      prod.total += qty;
      if (size) {
        prod.sizes[size] = (prod.sizes[size] || 0) + qty;
      }

      let colorObj = prod.colors.find(
        (c) => c.colorName.toLowerCase() === colorName.toLowerCase()
      );
      if (!colorObj) {
        colorObj = { colorName, total: 0, sizes: {} };
        prod.colors.push(colorObj);
      }
      colorObj.total += qty;
      if (size) {
        colorObj.sizes[size] = (colorObj.sizes[size] || 0) + qty;
      }
    });
    return Array.from(map.values());
  }

  // 2. If breakdown doesn't carry product info, check if productList was provided from PO filter
  if (productList.length > 0) {
    const p = productList[0];
    const code = p.productCode || p.styleCode;
    const name = p.productName || code || "Sản phẩm";
    const group: ProductGroup = {
      productId: p.id || p.productCode || "product",
      productName: name,
      productCode: code,
      colors: [],
      sizes: {},
      total: 0,
    };
    bList.forEach((b) => {
      const colorName = b.colorName || "Mặc định";
      const size = b.sizeLabel?.trim().toUpperCase() || "";
      const qty = Number(b.requiredQuantity) || 0;

      group.total += qty;
      if (size) group.sizes[size] = (group.sizes[size] || 0) + qty;

      let colorObj = group.colors.find(
        (c) => c.colorName.toLowerCase() === colorName.toLowerCase()
      );
      if (!colorObj) {
        colorObj = { colorName, total: 0, sizes: {} };
        group.colors.push(colorObj);
      }
      colorObj.total += qty;
      if (size) colorObj.sizes[size] = (colorObj.sizes[size] || 0) + qty;
    });
    return [group];
  }

  // 3. Fallback without ANY mock names: single group with generic "Sản phẩm"
  const defaultGroup: ProductGroup = {
    productId: "default",
    productName: "Sản phẩm",
    productCode: undefined,
    colors: [],
    sizes: {},
    total: 0,
  };
  bList.forEach((b) => {
    const colorName = b.colorName || "Mặc định";
    const size = b.sizeLabel?.trim().toUpperCase() || "";
    const qty = Number(b.requiredQuantity) || 0;

    defaultGroup.total += qty;
    if (size) defaultGroup.sizes[size] = (defaultGroup.sizes[size] || 0) + qty;

    let colorObj = defaultGroup.colors.find(
      (c) => c.colorName.toLowerCase() === colorName.toLowerCase()
    );
    if (!colorObj) {
      colorObj = { colorName, total: 0, sizes: {} };
      defaultGroup.colors.push(colorObj);
    }
    colorObj.total += qty;
    if (size) colorObj.sizes[size] = (colorObj.sizes[size] || 0) + qty;
  });
  return [defaultGroup];
}

export { sortSizes } from "@/lib/bomAggregateUtils";

export function BomAggregateSizeMatrixTable({
  items,
  page,
  limit,
  totalMaterialsCount,
  bomCount: _bomCount = 0,
  productCount: _productCount = 0,
  poCount: _poCount = 0,
  productList = [],
  displayMode: externalDisplayMode,
  onDisplayModeChange: _onDisplayModeChange,
  hideToolbar: _hideToolbar = false,
}: BomAggregateSizeMatrixTableProps) {
  // Display mode: "grouped" (Gộp theo NPL) or "detailed" (Hiển thị chi tiết)
  const [internalDisplayMode] = useState<"grouped" | "detailed">("grouped");
  const displayMode = externalDisplayMode ?? internalDisplayMode;

  // Expanded rows state for drill-down into products and colors
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // Collect and sort all distinct size labels across items
  const sizeKeys = useMemo(() => {
    const sizeSet = new Set<string>();
    items.forEach((item) => {
      const bList = item.breakdown || [];
      bList.forEach((b) => {
        if (b.sizeLabel && b.sizeLabel.trim()) {
          sizeSet.add(b.sizeLabel.trim());
        }
      });
    });

    const sorted = sortSizes(Array.from(sizeSet));
    if (sorted.length === 0) {
      return ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
    }
    return sorted;
  }, [items]);

  // Sync displayMode: when detailed, expand all rows with breakdowns
  useEffect(() => {
    if (displayMode === "detailed") {
      const allKeys = new Set<string>();
      items.forEach((it, idx) => {
        const bList = it.breakdown || [];
        if (bList.length > 0) {
          allKeys.add(`${it.materialId}-${it.unitSnapshot}-${idx}`);
        }
      });
      setExpandedKeys(allKeys);
    } else {
      setExpandedKeys(new Set());
    }
  }, [displayMode, items]);

  const toggleRow = (rowKey: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
      }
      return next;
    });
  };

  // Helper to compute quantity of an item for a specific size
  const getItemQtyForSize = (item: BomAggregateItem, size: string): number => {
    const bList = item.breakdown || [];
    return bList
      .filter((b) => b.sizeLabel?.trim().toUpperCase() === size.toUpperCase())
      .reduce((sum, b) => sum + (Number(b.requiredQuantity) || 0), 0);
  };

  // Calculate column totals for each size
  const sizeColumnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    sizeKeys.forEach((s) => {
      totals[s] = items.reduce((sum, it) => sum + getItemQtyForSize(it, s), 0);
    });
    return totals;
  }, [items, sizeKeys]);

  // Grand total
  const grandTotal = useMemo(() => {
    return items.reduce(
      (sum, it) => sum + (Number(it.totalRequiredQuantity) || 0),
      0
    );
  }, [items]);

  const matCount = totalMaterialsCount ?? items.length;

  return (
    <div className="flex flex-col gap-3">
      {/* 2. Main Matrix Table (Without Mã NPL column) */}
      <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse text-left text-xs"
            data-testid="bom-aggregate-size-matrix-table"
          >
            <thead>
              {/* Top Header Row */}
              <tr className="border-b border-gray-200/80 bg-gray-50/75 text-[11px] font-semibold text-gray-600 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-300">
                <th
                  rowSpan={2}
                  className="w-14 py-3 px-2 text-center text-gray-400 font-medium"
                >
                  #
                </th>
                <th
                  rowSpan={2}
                  className="w-32 px-3.5 py-3 font-semibold"
                >
                  Nhóm NPL
                </th>
                <th
                  rowSpan={2}
                  className="px-3.5 py-3 font-semibold min-w-[220px]"
                >
                  Tên nguyên phụ liệu
                </th>
                <th
                  rowSpan={2}
                  className="w-16 px-3 py-3 text-center font-semibold"
                >
                  ĐVT
                </th>

                {/* Spanning Header: Size (Số lượng nhu cầu) */}
                <th
                  colSpan={sizeKeys.length}
                  className="py-2 px-3 text-center font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200/80 dark:border-gray-800"
                >
                  Size (Số lượng nhu cầu)
                </th>

                <th
                  rowSpan={2}
                  className="w-28 px-4 py-3 text-right font-bold text-gray-900 dark:text-white"
                >
                  Tổng
                </th>
              </tr>

              {/* Sub Header Row for Sizes */}
              <tr className="border-b border-gray-200/80 bg-gray-50/75 text-[11px] font-bold text-gray-700 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-300">
                {sizeKeys.map((size) => (
                  <th
                    key={size}
                    className="min-w-[65px] py-2 px-2 text-center font-bold text-gray-700 dark:text-gray-200"
                  >
                    {size}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((item, idx) => {
                const rowKey = `${item.materialId}-${item.unitSnapshot}-${idx}`;
                const isExpanded = expandedKeys.has(rowKey);
                const stt = (page - 1) * limit + idx + 1;
                const bList = item.breakdown || [];
                const hasBreakdown = bList.length > 0;
                const productGroups = groupBreakdownByProduct(item, productList);

                return (
                  <Fragment key={rowKey}>
                    {/* Main Material Row with real <td> elements for perfect alignment */}
                    <tr
                      className={`group transition-colors border-b border-gray-100 dark:border-gray-800 ${
                        isExpanded
                          ? "bg-blue-50/20 dark:bg-blue-950/10"
                          : "hover:bg-gray-50/60 dark:hover:bg-gray-800/40"
                      }`}
                    >
                      {/* 1. STT with chevron */}
                      <td className="w-14 py-3 px-2 text-center">
                        <button
                          type="button"
                          aria-label={
                            isExpanded
                              ? "Thu gọn chi tiết"
                              : "Xem phân bổ chi tiết"
                          }
                          data-testid={`expand-btn-${idx}`}
                          onClick={() => toggleRow(rowKey)}
                          className="cursor-pointer text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors p-0.5 inline-flex items-center justify-center gap-1"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-700 dark:text-gray-200 stroke-[2.2]" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400 stroke-[2.2]" />
                          )}
                          <span className="font-medium text-gray-600 dark:text-gray-400 text-xs">
                            {stt}
                          </span>
                        </button>
                      </td>

                      {/* 2. Nhóm NPL badge */}
                      <td className="w-32 px-3.5 py-3">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold uppercase text-blue-700 border border-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/50">
                          {item.materialGroupSnapshot || "Khác"}
                        </span>
                      </td>

                      {/* 3. Tên nguyên phụ liệu */}
                      <td className="px-3.5 py-3 min-w-[220px]">
                        <span className="font-semibold text-xs text-gray-900 dark:text-white line-clamp-1">
                          {item.materialNameSnapshot}
                        </span>
                      </td>

                      {/* 4. ĐVT */}
                      <td className="w-16 px-3 py-3 text-center text-xs text-gray-600 dark:text-gray-300">
                        {item.unitSnapshot}
                      </td>

                      {/* 5. Size Columns */}
                      {sizeKeys.map((size) => {
                        const qty = getItemQtyForSize(item, size);
                        return (
                          <td
                            key={size}
                            className="min-w-[65px] px-2 py-3 text-center font-mono text-xs text-gray-800 dark:text-gray-200 font-medium"
                          >
                            {formatQty(qty)}
                          </td>
                        );
                      })}

                      {/* 6. Tổng */}
                      <td className="w-28 px-4 py-3 text-right font-mono text-xs font-bold text-gray-900 dark:text-white">
                        {Number(item.totalRequiredQuantity).toLocaleString(
                          "vi-VN",
                          { minimumFractionDigits: 0, maximumFractionDigits: 2 }
                        )}
                      </td>
                    </tr>

                    {/* Expandable Rows directly inside the same tbody for 100% column alignment */}
                    {isExpanded && hasBreakdown && productGroups.length > 0 && (
                      productGroups.map((pg) => (
                        <Fragment key={`${rowKey}-${pg.productId}`}>
                          {/* Product Header Row */}
                          <tr className="bg-blue-50/60 dark:bg-blue-950/30 border-b border-blue-100/70 dark:border-blue-900/50 text-xs">
                            <td className="w-14 py-2 px-2" />
                            <td className="w-32 px-3.5 py-2">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 dark:text-blue-300">
                                <Package className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                Sản phẩm
                              </span>
                            </td>
                            {/* Spans column 3 (Tên NPL) and column 4 (ĐVT) so ĐVT is removed and not repeated */}
                            <td colSpan={2} className="px-3.5 py-2">
                              <div className="flex items-center gap-2">
                                {pg.productCode ? (
                                  <>
                                    <span className="rounded bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 font-mono text-xs font-bold text-blue-800 dark:text-blue-200 border border-blue-200/60 dark:border-blue-800">
                                      {pg.productCode}
                                    </span>
                                    {pg.productName && pg.productName !== pg.productCode && pg.productName !== "Sản phẩm" && (
                                      <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
                                        {pg.productName}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="font-bold text-gray-900 dark:text-white">
                                    {pg.productName}
                                  </span>
                                )}
                              </div>
                            </td>
                            {/* Sizes align directly down into the outer table columns */}
                            {sizeKeys.map((size) => (
                              <td
                                key={size}
                                className="min-w-[65px] px-2 py-2 text-center font-mono text-xs font-bold text-blue-700 dark:text-blue-300"
                              >
                                {pg.sizes[size] > 0
                                  ? formatQty(pg.sizes[size])
                                  : "—"}
                              </td>
                            ))}
                            <td className="w-28 px-4 py-2 text-right font-mono text-xs font-bold text-blue-700 dark:text-blue-300">
                              {formatQty(pg.total)}
                            </td>
                          </tr>

                          {/* Color rows under this Product */}
                          {pg.colors.map((c) => (
                            <tr
                              key={`${rowKey}-${pg.productId}-${c.colorName}`}
                              className="text-xs hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors bg-white/70 dark:bg-gray-900/40 border-b border-gray-100/80 dark:border-gray-800/60"
                            >
                              <td className="w-14 py-2 px-2" />
                              <td className="w-32 px-3.5 py-2" />
                              {/* Spans column 3 (Tên NPL) and column 4 (ĐVT) with color dot & name */}
                              <td colSpan={2} className="px-3.5 py-2">
                                <div className="pl-5 flex items-center gap-2.5 font-medium text-gray-800 dark:text-gray-200">
                                  <span
                                    className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${getColorDotClass(
                                      c.colorName
                                    )}`}
                                  />
                                  <span>{c.colorName}</span>
                                </div>
                              </td>
                              {/* Sizes align directly down into the outer table columns */}
                              {sizeKeys.map((size) => (
                                <td
                                  key={size}
                                  className="min-w-[65px] px-2 py-2 text-center font-mono text-xs text-gray-700 dark:text-gray-300"
                                >
                                  {c.sizes[size] > 0
                                    ? formatQty(c.sizes[size])
                                    : "—"}
                                </td>
                              ))}
                              <td className="w-28 px-4 py-2 text-right font-mono text-xs font-bold text-gray-900 dark:text-white">
                                {formatQty(c.total)}
                              </td>
                            </tr>
                          ))}
                        </Fragment>
                      ))
                    )}
                    {isExpanded && (!hasBreakdown || productGroups.length === 0) && (
                      <tr className="bg-gray-50/40 dark:bg-gray-800/30 border-b border-gray-200/80 dark:border-gray-800">
                        <td
                          colSpan={4 + sizeKeys.length + 1}
                          className="py-3 text-center text-xs text-gray-400 italic"
                        >
                          Không có dữ liệu phân rã chi tiết cho nguyên phụ liệu này
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>

            {/* 3. Footer Row: Tổng cộng ({matCount} loại NPL) */}
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-blue-50/30 text-xs font-bold text-gray-900 dark:border-gray-700 dark:bg-blue-950/20 dark:text-white">
                <td
                  colSpan={4}
                  className="py-3.5 px-4 font-bold text-gray-900 dark:text-white"
                >
                  <span>Tổng cộng</span>{" "}
                  <span className="text-gray-500 dark:text-gray-400 font-normal text-[11px]">
                    ({matCount} loại NPL)
                  </span>
                </td>

                {/* Totals per size */}
                {sizeKeys.map((size) => (
                  <td
                    key={size}
                    className="py-3.5 px-2 text-center font-mono text-xs font-bold text-gray-900 dark:text-white"
                  >
                    {Number(sizeColumnTotals[size] || 0).toLocaleString(
                      "vi-VN",
                      { minimumFractionDigits: 0, maximumFractionDigits: 2 }
                    )}
                  </td>
                ))}

                {/* Grand Total */}
                <td className="py-3.5 px-4 text-right font-mono text-xs font-bold text-gray-900 dark:text-white">
                  {Number(grandTotal).toLocaleString("vi-VN", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
