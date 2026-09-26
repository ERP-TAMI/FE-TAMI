import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Eye,
  Edit2,
  MoreHorizontal,
  Box,
  PackageOpen,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  History,
  Download,
  Trash2,
} from "lucide-react";
import type { BomListItem } from "@/types/bom";
import { BomTypeBadge } from "./BomTypeBadge";
import { BomStatusBadge } from "./BomStatusBadge";
import { formatUSD, formatDate, BOM_STATUS_CONFIG } from "@/lib/bomAccess";

interface BomTableProps {
  items: BomListItem[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  canViewCost: boolean;
  sortBy: string;
  sortOrder: "ASC" | "DESC";
  onSort: (field: "bomCode" | "createdAt" | "updatedAt" | "deadline") => void;
  onViewDetail: (id: string, tab?: string) => void;
  isFiltering: boolean;
  onClearFilters: () => void;
  canCreate?: boolean;
  onCreateClick?: () => void;
  onOpenBom?: (item: BomListItem) => void;
  onDelete?: (item: BomListItem) => void;
}

function getColorHex(colorName?: string | null): string {
  if (!colorName) return "#cbd5e1";
  const lower = colorName.toLowerCase();
  if (lower.includes("den") || lower.includes("black")) return "#0f172a";
  if (lower.includes("trang") || lower.includes("white")) return "#e2e8f0";
  if (lower.includes("do") || lower.includes("red")) return "#ef4444";
  if (lower.includes("xanh duong") || lower.includes("blue")) return "#3b82f6";
  if (lower.includes("xanh la") || lower.includes("green")) return "#22c55e";
  if (lower.includes("xanh")) return "#0284c7";
  if (lower.includes("vang") || lower.includes("yellow")) return "#eab308";
  if (lower.includes("xam") || lower.includes("gray") || lower.includes("grey")) return "#64748b";
  if (lower.includes("cam") || lower.includes("orange")) return "#f97316";
  if (lower.includes("hong") || lower.includes("pink")) return "#ec4899";
  if (lower.includes("tim") || lower.includes("purple")) return "#a855f7";
  return "#94a3b8";
}

function exportBomToCsv(item: BomListItem) {
  const isFit = item.type === "fit";
  const objectType = isFit ? "Fit" : "PO";
  const productName = isFit
    ? item.style?.styleName || item.style?.styleCode || "Mẫu Fit"
    : item.product?.productName || item.product?.productCode || "PO";
  const poCode = isFit ? "—" : item.purchaseOrder?.poCode || item.bomCode;
  const color = isFit
    ? "—"
    : item.product?.colors?.join(", ") || item.colorNameSnapshot || "—";
  const statusLabel = BOM_STATUS_CONFIG[item.status]?.label || item.status;
  const created = formatDate(item.createdAt || item.updatedAt);

  const headers = [
    "Mã BOM",
    "Đối tượng",
    "Sản phẩm / Mẫu",
    "Mã PO",
    "Màu sắc",
    "Trạng thái",
    "Ngày tạo",
  ];
  const row = [
    item.bomCode,
    objectType,
    productName,
    poCode,
    color,
    statusLabel,
    created,
  ];

  const csvContent =
    "\uFEFF" +
    [
      headers.join(","),
      row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
    ].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `BOM_${item.bomCode}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function BomTable({
  items,
  isLoading,
  isError,
  onRetry,
  canViewCost,
  sortBy,
  sortOrder,
  onSort,
  onViewDetail,
  isFiltering,
  onClearFilters,
  canCreate,
  onCreateClick,
  onOpenBom,
  onDelete,
}: BomTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [menuState, setMenuState] = useState<{
    id: string;
    item: BomListItem;
    top: number;
    right: number;
    isDropUp: boolean;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const activeTriggerRef = useRef<HTMLElement | null>(null);

  const colCount = canViewCost ? 9 : 8;

  // Close menu on click outside, scroll or resize
  useEffect(() => {
    if (!menuState) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current?.contains(target) ||
        activeTriggerRef.current?.contains(target)
      ) {
        return;
      }
      setMenuState(null);
    };

    const handleScrollOrResize = () => {
      setMenuState(null);
    };

    document.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [menuState]);

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length && items.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />;
    }
    return sortOrder === "ASC" ? (
      <ArrowUp className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
    );
  };

  return (
    <div className="relative rounded-2xl border border-gray-200/80 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
          <thead className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-400">
            <tr>
              <th scope="col" className="w-10 px-4 py-3.5 text-center">
                <input
                  type="checkbox"
                  checked={items.length > 0 && selectedIds.size === items.length}
                  onChange={toggleSelectAll}
                  aria-label="Chọn tất cả"
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
              </th>
              <th scope="col" className="px-4 py-3.5 font-semibold">
                ĐỐI TƯỢNG
              </th>
              <th
                scope="col"
                className="cursor-pointer px-4 py-3.5 font-semibold select-none hover:text-gray-900 dark:hover:text-white"
                onClick={() => onSort("bomCode")}
              >
                <div className="flex items-center gap-1.5">
                  <span>SẢN PHẨM</span>
                  {renderSortIcon("bomCode")}
                </div>
              </th>
              <th scope="col" className="px-4 py-3.5 font-semibold">
                MÃ PO
              </th>
              <th scope="col" className="px-4 py-3.5 font-semibold">
                MÀU
              </th>
              <th scope="col" className="px-4 py-3.5 font-semibold">
                TRẠNG THÁI
              </th>
              {canViewCost && (
                <th scope="col" className="px-4 py-3.5 font-semibold text-right">
                  GIÁ THÀNH / SP ($)
                </th>
              )}
              <th
                scope="col"
                className="cursor-pointer px-4 py-3.5 font-semibold select-none hover:text-gray-900 dark:hover:text-white"
                onClick={() => onSort("createdAt")}
              >
                <div className="flex items-center gap-1.5">
                  <span>NGÀY TẠO</span>
                  {renderSortIcon("createdAt")}
                </div>
              </th>
              <th scope="col" className="px-4 py-3.5 text-center font-semibold">
                THAO TÁC
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td colSpan={colCount} className="px-4 py-4">
                    <div className="h-5 rounded-lg bg-gray-100 dark:bg-gray-800" />
                  </td>
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={colCount} className="py-10 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-sm font-medium text-rose-600">
                      Không thể tải dữ liệu danh sách BOM
                    </p>
                    <p className="text-xs text-gray-500">
                      Vui lòng kiểm tra kết nối mạng hoặc thử lại
                    </p>
                    <button
                      type="button"
                      onClick={onRetry}
                      className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
                    >
                      Thử lại
                    </button>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <PackageOpen className="h-8 w-8 text-gray-400" />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {isFiltering
                        ? "Không tìm thấy BOM phù hợp với bộ lọc"
                        : "Chưa có bảng BOM nào trong hệ thống"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {isFiltering
                        ? "Thử xóa bộ lọc hoặc tìm kiếm với từ khóa khác"
                        : "Bắt đầu bằng việc tạo BOM cho Mẫu Fit hoặc Đơn hàng PO"}
                    </p>
                    {isFiltering ? (
                      <button
                        type="button"
                        onClick={onClearFilters}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                      >
                        Xóa bộ lọc
                      </button>
                    ) : (
                      canCreate &&
                      onCreateClick && (
                        <button
                          type="button"
                          onClick={onCreateClick}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-600"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Tạo BOM mới
                        </button>
                      )
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isFit = item.type === "fit";
                const isSelected = selectedIds.has(item.id);

                // Product / Style info
                const mainCode = isFit
                  ? item.style?.styleCode || item.bomCode
                  : item.product?.productCode || item.bomCode;

                // Color display
                const colorName = isFit
                  ? null
                  : item.product?.colors && item.product.colors.length > 0
                    ? item.product.colors[0]
                    : item.colorNameSnapshot || null;

                const colorHex = getColorHex(colorName);
                const isMenuOpen = menuState?.id === item.id;

                return (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/50"
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.id)}
                        aria-label={`Chọn ${item.bomCode}`}
                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                    </td>

                    {/* Đối tượng */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <BomTypeBadge type={item.type} />
                    </td>

                    {/* Sản phẩm */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          <Box className="h-4 w-4" />
                        </div>
                        <button
                          type="button"
                          onClick={() => onViewDetail(item.id)}
                          className="truncate text-left font-semibold text-gray-900 hover:text-brand-600 hover:underline dark:text-white dark:hover:text-brand-400"
                        >
                          {mainCode}
                        </button>
                      </div>
                    </td>

                    {/* Mã PO */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {isFit ? (
                        <span className="text-gray-400 font-medium">—</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onViewDetail(item.id)}
                          className="text-left font-mono text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400"
                        >
                          {item.purchaseOrder?.poCode || item.bomCode}
                        </button>
                      )}
                    </td>

                    {/* Màu */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {colorName ? (
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full border border-gray-300/60"
                            style={{ backgroundColor: colorHex }}
                          />
                          <span className="text-xs text-gray-700 dark:text-gray-300">
                            {colorName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Trạng thái */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <BomStatusBadge status={item.status} />
                    </td>

                    {/* Giá thành / SP (Conditional) */}
                    {canViewCost && (
                      <td className="px-4 py-3.5 text-right font-mono whitespace-nowrap">
                        {isFit ? (
                          <span className="text-gray-400">—</span>
                        ) : item.costPerUnit !== null ? (
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {formatUSD(item.costPerUnit)}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    )}

                    {/* Ngày tạo */}
                    <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap dark:text-gray-400">
                      {formatDate(item.createdAt || item.updatedAt)}
                    </td>

                    {/* Thao tác */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onViewDetail(item.id)}
                          title="Xem chi tiết"
                          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-brand-400"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onViewDetail(item.id)}
                          title="Chỉnh sửa"
                          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-brand-400"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (menuState?.id === item.id) {
                              setMenuState(null);
                              activeTriggerRef.current = null;
                            } else {
                              activeTriggerRef.current = e.currentTarget;
                              const rect = e.currentTarget.getBoundingClientRect();
                              const menuHeight = 170;
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const spaceAbove = rect.top;
                              const isDropUp =
                                spaceBelow < menuHeight && spaceAbove >= menuHeight;
                              setMenuState({
                                id: item.id,
                                item,
                                top: isDropUp ? rect.top - 4 : rect.bottom + 4,
                                right: Math.max(8, window.innerWidth - rect.right),
                                isDropUp,
                              });
                            }
                          }}
                          title="Thao tác khác"
                          className={`rounded-lg p-1.5 transition-colors ${
                            isMenuOpen
                              ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white ring-2 ring-brand-500/20"
                              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                          }`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Action Dropdown Menu via React Portal to prevent table overflow clipping */}
      {menuState &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: menuState.top,
              right: menuState.right,
              transform: menuState.isDropUp ? "translateY(-100%)" : "none",
              zIndex: 99999,
            }}
            className="w-40 rounded-xl border border-gray-200/90 bg-white p-1 shadow-xl animate-in fade-in zoom-in-95 duration-100 dark:border-gray-800 dark:bg-gray-900"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const item = menuState.item;
                setMenuState(null);
                if (onOpenBom) onOpenBom(item);
                else onViewDetail(item.id);
              }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Eye className="h-3.5 w-3.5 text-gray-400" />
              <span>Mở BOM</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const item = menuState.item;
                setMenuState(null);
                onViewDetail(item.id, "history");
              }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <History className="h-3.5 w-3.5 text-gray-400" />
              <span>Xem lịch sử</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const item = menuState.item;
                setMenuState(null);
                exportBomToCsv(item);
              }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Download className="h-3.5 w-3.5 text-gray-400" />
              <span>Xuất dữ liệu</span>
            </button>
            <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const item = menuState.item;
                setMenuState(null);
                if (onDelete) onDelete(item);
              }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Xóa</span>
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
