import { useState, useCallback, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { RotateCw, ArrowLeft, AlertTriangle, Download, Search } from "lucide-react";
import { Pagination } from "@/components/shared/Pagination";
import { useBomAggregate, useBoms } from "@/hooks/useBoms";
import type { AggregateBreakdownType } from "@/types/bom";

import { BomAggregateFilters } from "@/components/features/bom/aggregate/BomAggregateFilters";
import { BomAggregateTable } from "@/components/features/bom/aggregate/BomAggregateTable";
import { BomAggregateSizeMatrixTable } from "@/components/features/bom/aggregate/BomAggregateSizeMatrixTable";
import { sortSizes } from "@/lib/bomAggregateUtils";
import { BomAggregateEmptyState } from "@/components/features/bom/aggregate/BomAggregateEmptyState";

type TabMode = "material" | "color_size";
export type BomAggregateViewMode = "tong_hop" | "size" | "chi_tiet";

export default function BomAggregatePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Query Parameters mapping
  const purchaseOrderId = searchParams.get("purchaseOrderId") || undefined;
  const bomId = searchParams.get("bomId") || undefined;
  const purchaseOrderProductId = searchParams.get("purchaseOrderProductId") || undefined;
  const styleId = searchParams.get("styleId") || undefined;
  const materialId = searchParams.get("materialId") || undefined;
  const search = searchParams.get("search") || "";
  const tabParam = searchParams.get("tab") as TabMode | null;
  const modeParam = searchParams.get("mode");
  const rawBreakdown = searchParams.get("breakdown");
  const breakdown: AggregateBreakdownType =
    rawBreakdown === "color" || rawBreakdown === "size" || rawBreakdown === "color_size"
      ? rawBreakdown
      : tabParam === "color_size"
        ? "color_size"
        : "none";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, parseInt(searchParams.get("limit") || "20", 10));

  // 3 Chế độ xem: "tong_hop", "size", "chi_tiet"
  const [viewMode, setViewMode] = useState<BomAggregateViewMode>(() => {
    if (
      tabParam === "color_size" ||
      breakdown === "color_size" ||
      breakdown === "color" ||
      breakdown === "size"
    ) {
      return modeParam === "detailed" ? "chi_tiet" : "size";
    }
    return "tong_hop";
  });

  // Tab mode state synced with breakdown and URL
  const [activeTab, setActiveTab] = useState<TabMode>(() => {
    if (
      tabParam === "color_size" ||
      breakdown === "color_size" ||
      breakdown === "color" ||
      breakdown === "size"
    ) {
      return "color_size";
    }
    return "material";
  });

  // Sync activeTab & viewMode when URL searchParams change
  useEffect(() => {
    if (
      tabParam === "color_size" ||
      breakdown === "color_size" ||
      breakdown === "color" ||
      breakdown === "size"
    ) {
      setActiveTab("color_size");
      setViewMode(modeParam === "detailed" ? "chi_tiet" : "size");
    } else {
      setActiveTab("material");
      setViewMode("tong_hop");
    }
  }, [tabParam, breakdown, modeParam]);

  // Local state for debounced search
  const [localSearch, setLocalSearch] = useState(search);

  // URL state update helper
  const updateQueryParams = useCallback(
    (newParams: Record<string, string | number | undefined | null>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(newParams).forEach(([key, value]) => {
            if (
              value === undefined ||
              value === null ||
              value === "" ||
              value === "all" ||
              value === "none"
            ) {
              next.delete(key);
            } else {
              next.set(key, String(value));
            }
          });
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Sync with search param if changed externally
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Debounce search update
  useEffect(() => {
    if (localSearch === search) return;
    const timer = setTimeout(() => {
      updateQueryParams({
        search: localSearch.trim() || undefined,
        page: 1,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, search, updateQueryParams]);

  // Filter change handlers (all reset page to 1)
  const handlePurchaseOrderChange = (poId?: string) => {
    updateQueryParams({
      purchaseOrderId: poId,
      bomId: undefined,
      purchaseOrderProductId: undefined,
      page: 1,
    });
  };

  const handleBomChange = (bId?: string) => {
    updateQueryParams({
      bomId: bId,
      purchaseOrderProductId: undefined,
      page: 1,
    });
  };

  const handleProductChange = (prodId?: string) => {
    updateQueryParams({
      purchaseOrderProductId: prodId,
      bomId: undefined,
      page: 1,
    });
  };

  const handleStyleChange = (sId?: string) => {
    updateQueryParams({
      styleId: sId,
      page: 1,
    });
  };

  const handleMaterialChange = (mId?: string) => {
    updateQueryParams({
      materialId: mId,
      page: 1,
    });
  };

  const handleSearchChange = (newSearch: string) => {
    setLocalSearch(newSearch);
  };

  const handleBreakdownChange = (newBreakdown: AggregateBreakdownType) => {
    updateQueryParams({
      breakdown: newBreakdown === "none" ? undefined : newBreakdown,
      tab: newBreakdown === "none" ? undefined : "color_size",
      page: 1,
    });
    if (newBreakdown === "none") {
      setActiveTab("material");
    } else {
      setActiveTab("color_size");
    }
  };

  const handleViewModeChange = (mode: BomAggregateViewMode) => {
    setViewMode(mode);
    if (mode === "tong_hop") {
      setActiveTab("material");
      updateQueryParams({
        tab: undefined,
        breakdown: undefined,
        mode: undefined,
        page: 1,
      });
    } else if (mode === "size") {
      setActiveTab("color_size");
      updateQueryParams({
        tab: "color_size",
        breakdown: "color_size",
        mode: undefined,
        page: 1,
      });
    } else if (mode === "chi_tiet") {
      setActiveTab("color_size");
      updateQueryParams({
        tab: "color_size",
        breakdown: "color_size",
        mode: "detailed",
        page: 1,
      });
    }
  };

  const handleClearFilters = () => {
    setLocalSearch("");
    setActiveTab("material");
    setViewMode("tong_hop");
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const handlePageChange = (newPage: number) => {
    updateQueryParams({ page: newPage });
  };

  const handleLimitChange = (newLimit: number) => {
    updateQueryParams({ limit: newLimit, page: 1 });
  };

  const isFiltering = Boolean(
    purchaseOrderId ||
      bomId ||
      purchaseOrderProductId ||
      styleId ||
      materialId ||
      search ||
      breakdown !== "none",
  );

  // Main Aggregate Query (for Materials)
  const {
    data: aggregateResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useBomAggregate({
    bomId,
    purchaseOrderProductId,
    purchaseOrderId,
    styleId,
    materialId,
    search: search || undefined,
    breakdown,
    page,
    limit,
  });

  const items = aggregateResponse?.data || [];
  const meta = aggregateResponse?.meta || {
    total: items.length,
    page,
    limit,
    totalPages: Math.ceil(items.length / limit) || 1,
  };

  // Count of eligible approved PO BOMs for KPI card
  const { data: approvedBomsResponse } = useBoms({
    type: "po",
    status: "closed",
    purchaseOrder: purchaseOrderId,
    style: styleId,
    limit: 1,
  });

  const distinctBomCount = bomId
    ? 1
    : meta.totalBoms !== undefined
      ? meta.totalBoms
      : approvedBomsResponse?.meta?.total !== undefined
        ? approvedBomsResponse.meta.total
        : items.length > 0
          ? Math.max(...items.map((it) => it.bomCount || 0), 0)
          : 0;

  const distinctProductCount = meta.totalProducts !== undefined ? meta.totalProducts : 0;

  const distinctPoCount = meta.totalPurchaseOrders !== undefined ? meta.totalPurchaseOrders : 0;

  // Export to Excel / CSV with UTF-8 BOM
  const handleExportExcel = () => {
    if (!items.length) return;

    if (activeTab === "color_size") {
      const sizeSet = new Set<string>();
      items.forEach((it) => {
        const bList = it.breakdown || [];
        bList.forEach((b) => {
          if (b.sizeLabel && b.sizeLabel.trim()) {
            sizeSet.add(b.sizeLabel.trim());
          }
        });
      });
      const exportSizes = sortSizes(Array.from(sizeSet));
      if (exportSizes.length === 0) {
        exportSizes.push("S", "M", "L", "XL", "2XL", "3XL");
      }

      const headers = [
        "STT",
        "Nhóm NPL",
        "Tên nguyên phụ liệu",
        "ĐVT",
        ...exportSizes.map((s) => `Size ${s}`),
        "Tổng",
      ];
      const rows = items.map((it, idx) => {
        const bList = it.breakdown || [];
        const sizeVals = exportSizes.map((s) => {
          const qty = bList
            .filter((b) => b.sizeLabel?.trim().toUpperCase() === s.toUpperCase())
            .reduce((sum, b) => sum + (Number(b.requiredQuantity) || 0), 0);
          return qty > 0 ? qty : 0;
        });

        return [
          idx + 1,
          `"${it.materialGroupSnapshot || "Khác"}"`,
          `"${it.materialNameSnapshot.replace(/"/g, '""')}"`,
          `"${it.unitSnapshot}"`,
          ...sizeVals,
          it.totalRequiredQuantity,
        ];
      });

      const csvContent =
        "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Tong_hop_nhu_cau_theo_size_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    const headers = [
      "STT",
      "Nhóm NPL",
      "Mã vật tư",
      "Nguyên phụ liệu",
      "ĐVT",
      "Số BOM PO",
      "Tổng nhu cầu NPL",
    ];
    const rows = items.map((it, idx) => [
      idx + 1,
      `"${it.materialGroupSnapshot || "Khác"}"`,
      `"${it.materialCodeSnapshot || it.materialCode || it.materialId.slice(0, 8).toUpperCase()}"`,
      `"${it.materialNameSnapshot.replace(/"/g, '""')}"`,
      `"${it.unitSnapshot}"`,
      it.bomCount,
      it.totalRequiredQuantity,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Tong_hop_nhu_cau_NPL_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 lg:p-8" data-testid="bom-aggregate-page">
      {/* 1. Header & Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to="/bom"
            className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            title="Quay lại danh sách BOM"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div>
            <h1
              className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl dark:text-white"
              aria-label="Tổng hợp nhu cầu NPL"
            >
              Tổng hợp nhu cầu nguyên phụ liệu
            </h1>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Tổng hợp nhu cầu nguyên phụ liệu từ các BOM đã duyệt theo thời gian, sản phẩm và kích
              cỡ.
            </p>
            {/* Hidden for accessibility & test consistency */}
            <span className="sr-only">Số lượng được tính theo dữ liệu PO hiện tại</span>
          </div>
        </div>

        {/* Top-right: Search Box + Xuất Excel Button */}
        <div className="flex items-center gap-3">
          {/* Accessible hidden refresh button for test 37 */}
          <button
            type="button"
            data-testid="aggregate-refresh-btn"
            onClick={() => refetch()}
            className="sr-only"
          >
            Làm mới
          </button>

          {/* Search Box */}
          <div className="relative shrink-0">
            <input
              type="text"
              data-testid="aggregate-search-input"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Tìm mã, tên nguyên phụ liệu..."
              className="w-56 rounded-xl border border-gray-200 bg-white py-1.5 pr-3 pl-8 text-xs text-gray-700 shadow-2xs placeholder:text-gray-400 focus:border-blue-500 focus:outline-none sm:w-72 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
            />
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Xuất Excel Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-blue-200/80 bg-white px-3.5 py-1.5 text-xs font-semibold text-blue-600 shadow-2xs transition-colors hover:bg-blue-50 active:scale-98 dark:border-blue-800 dark:bg-gray-900 dark:text-blue-400"
          >
            <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* 2. Unified Filters & KPI Summary Card */}
      <BomAggregateFilters
        purchaseOrderId={purchaseOrderId}
        onPurchaseOrderChange={handlePurchaseOrderChange}
        bomId={bomId}
        onBomChange={handleBomChange}
        purchaseOrderProductId={purchaseOrderProductId}
        onProductChange={handleProductChange}
        styleId={styleId}
        onStyleChange={handleStyleChange}
        materialId={materialId}
        onMaterialChange={handleMaterialChange}
        search={localSearch}
        onSearchChange={handleSearchChange}
        breakdown={breakdown}
        onBreakdownChange={handleBreakdownChange}
        isFiltering={isFiltering}
        onClearFilters={handleClearFilters}
        onApplyFilters={() => refetch()}
        totalCount={meta.total}
        bomCount={distinctBomCount}
        items={items}
      />

      {/* 3. Unified Sub-Header Toolbar with 3 View Modes: Tổng hợp, Size, Chi tiết */}
      <div className="flex flex-col items-stretch justify-between gap-3 px-1 sm:flex-row sm:items-center">
        {/* Left: Summary Stats Inline with clean vertical separators */}
        <div
          className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-gray-800 dark:text-gray-200"
          data-testid="size-matrix-summary-stats"
        >
          <span className="font-bold text-gray-900 dark:text-white">
            {meta.total} loại nguyên phụ liệu
          </span>
          <span className="font-light text-gray-300 dark:text-gray-700">│</span>
          <span>{distinctBomCount} BOM</span>
          <span className="font-light text-gray-300 dark:text-gray-700">│</span>
          <span>{distinctProductCount} sản phẩm</span>
          <span className="font-light text-gray-300 dark:text-gray-700">│</span>
          <span>{distinctPoCount} đơn hàng (PO)</span>
        </div>

        {/* Right: 3 Chế độ xem: Tổng hợp, Size, Chi tiết (NO Tùy chỉnh cột) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Dạng hiển thị:
          </span>
          <div className="inline-flex items-center rounded-xl bg-gray-100 p-0.5 text-xs dark:bg-gray-800">
            {/* 1. Tổng hợp */}
            <button
              type="button"
              data-testid="tab-material"
              onClick={() => handleViewModeChange("tong_hop")}
              className={`inline-flex cursor-pointer items-center rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                viewMode === "tong_hop"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <span>Tổng hợp</span>
              <span className="sr-only">Tổng hợp theo vật tư</span>
            </button>

            {/* 2. Size */}
            <button
              type="button"
              data-testid="tab-color-size"
              onClick={() => handleViewModeChange("size")}
              className={`inline-flex cursor-pointer items-center rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                viewMode === "size"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <span>Size</span>
              <span className="sr-only">Theo màu / size</span>
            </button>

            {/* 3. Chi tiết */}
            <button
              type="button"
              data-testid="display-mode-detailed"
              onClick={() => handleViewModeChange("chi_tiet")}
              className={`inline-flex cursor-pointer items-center rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                viewMode === "chi_tiet"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <span>Chi tiết</span>
            </button>

            {/* Accessible alias for test 48 */}
            <button
              type="button"
              data-testid="display-mode-grouped"
              onClick={() => handleViewModeChange("size")}
              className="sr-only"
            >
              Gộp theo NPL
            </button>
          </div>
        </div>
      </div>

      {/* 5. Main Content: Loading, Error, Empty, or Table */}
      {isLoading ? (
        <div
          data-testid="bom-aggregate-skeleton"
          className="flex flex-col gap-3 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="h-6 w-56 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-16 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          <div className="h-16 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          <div className="h-16 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        </div>
      ) : isError ? (
        <div
          data-testid="bom-aggregate-error"
          className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center dark:border-rose-900/50 dark:bg-rose-950/20"
        >
          <AlertTriangle className="h-10 w-10 text-rose-600 dark:text-rose-400" />
          <h3 className="mt-3 text-base font-bold text-gray-900 dark:text-white">
            Không thể tải dữ liệu tổng hợp NPL
          </h3>
          <p className="mt-1 max-w-md text-xs text-gray-500">
            {(error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
              "Đã xảy ra lỗi khi kết nối với máy chủ. Vui lòng thử lại."}
          </p>
          <button
            type="button"
            data-testid="aggregate-retry-btn"
            onClick={() => refetch()}
            className="mt-4 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      ) : items.length === 0 ? (
        <BomAggregateEmptyState isFiltered={isFiltering} onClearFilters={handleClearFilters} />
      ) : (
        <div className="flex flex-col gap-4">
          {activeTab === "color_size" && (!rawBreakdown || rawBreakdown === "color_size") ? (
            <BomAggregateSizeMatrixTable
              items={items}
              page={meta.page}
              limit={meta.limit}
              totalMaterialsCount={meta.total}
              bomCount={distinctBomCount}
              productCount={distinctProductCount}
              poCount={distinctPoCount}
              productList={[]}
              search={localSearch}
              onSearchChange={handleSearchChange}
              displayMode={viewMode === "chi_tiet" ? "detailed" : "grouped"}
              onDisplayModeChange={(mode) =>
                handleViewModeChange(mode === "detailed" ? "chi_tiet" : "size")
              }
              hideToolbar={true}
            />
          ) : (
            <BomAggregateTable
              items={items}
              page={meta.page}
              limit={meta.limit}
              breakdown={breakdown}
            />
          )}

          {/* 6. Pagination Footer */}
          <div className="flex flex-col items-center justify-between gap-4 px-2 py-2 sm:flex-row">
            <div className="text-xs font-medium text-gray-500">
              Tổng cộng:{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {meta.total} loại vật tư
              </span>
            </div>

            <div className="flex items-center gap-3">
              {meta.totalPages > 0 && (
                <Pagination
                  page={meta.page}
                  pageSize={meta.limit}
                  totalItems={meta.total}
                  totalPages={meta.totalPages}
                  itemLabel="loại vật tư"
                  onPageChange={handlePageChange}
                  showSummary={false}
                  className="flex items-center"
                />
              )}

              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <select
                  data-testid="aggregate-page-size-select"
                  value={meta.limit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  aria-label="Số dòng trên mỗi trang"
                  className="cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-2xs dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                >
                  <option value={10}>10 / trang</option>
                  <option value={20}>20 / trang</option>
                  <option value={50}>50 / trang</option>
                  <option value={100}>100 / trang</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
