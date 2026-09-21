import { useState, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Plus, Layers } from "lucide-react";
import { Pagination } from "@/components/shared/Pagination";
import { Toast } from "@/components/shared/Toast";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/useToast";
import { useBoms, useBomStats, useDiscontinueBom } from "@/hooks/useBoms";
import { canCreateBom, canViewBomCost, getCurrentMonthString } from "@/lib/bomAccess";
import type { BomType, BomListItem, QueryBomStatsParams } from "@/types/bom";

import { BomStatsCards, type PeriodMode } from "@/components/features/bom/BomStatsCards";
import { BomFilters } from "@/components/features/bom/BomFilters";
import { BomTable } from "@/components/features/bom/BomTable";
import { BomCreateWizardModal } from "@/components/features/bom/BomCreateWizardModal";

export default function BomPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const { toast, showToast, hideToast } = useToast();

  // Modal create wizard state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingBom, setDeletingBom] = useState<BomListItem | null>(null);

  const discontinueMutation = useDiscontinueBom(deletingBom?.id || "");

  // Permission checks
  const canCreate = canCreateBom(user);
  const canViewCost = canViewBomCost(user);

  // Parse URL search parameters with fallbacks
  const rawType = searchParams.get("type");
  const typeParam: BomType | "all" =
    rawType === "fit" || rawType === "po" ? rawType : "all";
  const statusParam = searchParams.get("status") || "";
  const searchParam = searchParams.get("search") || "";
  
  // Period filter state (default is current month)
  const currentMonth = getCurrentMonthString();
  const currentYear = String(new Date().getFullYear());
  const periodModeParam =
    (searchParams.get("periodMode") as PeriodMode) || "month";
  const monthParam = searchParams.get("month") || currentMonth;
  const yearParam = searchParams.get("year") || currentYear;
  const startDateParam = searchParams.get("startDate") || "";
  const endDateParam = searchParams.get("endDate") || "";

  const pageParam = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limitParam = Math.max(1, parseInt(searchParams.get("limit") || "20", 10));
  const sortByParam =
    (searchParams.get("sortBy") as
      | "bomCode"
      | "createdAt"
      | "updatedAt"
      | "deadline") || "updatedAt";
  const sortOrderParam =
    (searchParams.get("sortOrder") as "ASC" | "DESC") || "DESC";

  // URL state update helper
  const updateQueryParams = useCallback(
    (newParams: Record<string, string | number | undefined | null>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(newParams).forEach(([key, value]) => {
            if (value === undefined || value === null || value === "" || value === "all") {
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

  // Filters change handlers
  const handleTypeChange = (newType: BomType | "all") => {
    updateQueryParams({
      type: newType === "all" ? undefined : newType,
      page: 1, // Reset page
    });
  };

  const handleStatusChange = (newStatus: string) => {
    updateQueryParams({
      status: newStatus || undefined,
      page: 1,
    });
  };

  const handleSearchChange = (newSearch: string) => {
    updateQueryParams({
      search: newSearch.trim() || undefined,
      page: 1,
    });
  };

  const handlePeriodModeChange = (newMode: PeriodMode) => {
    updateQueryParams({
      periodMode: newMode === "month" ? undefined : newMode,
      month: newMode === "month" ? monthParam : undefined,
      year: newMode === "year" ? yearParam : undefined,
      startDate: newMode === "dateRange" ? startDateParam : undefined,
      endDate: newMode === "dateRange" ? endDateParam : undefined,
    });
  };

  const handleMonthChange = (newMonth: string) => {
    updateQueryParams({
      periodMode: undefined,
      month: newMonth || undefined,
    });
  };

  const handleYearChange = (newYear: string) => {
    updateQueryParams({
      periodMode: "year",
      year: newYear || undefined,
    });
  };

  const handleStartDateChange = (date: string) => {
    updateQueryParams({
      periodMode: "dateRange",
      startDate: date || undefined,
    });
  };

  const handleEndDateChange = (date: string) => {
    updateQueryParams({
      periodMode: "dateRange",
      endDate: date || undefined,
    });
  };

  const handleClearFilters = () => {
    updateQueryParams({
      type: undefined,
      status: undefined,
      search: undefined,
      page: 1,
    });
  };

  const handleSort = (field: "bomCode" | "createdAt" | "updatedAt" | "deadline") => {
    let nextOrder: "ASC" | "DESC" = "ASC";
    if (sortByParam === field) {
      nextOrder = sortOrderParam === "ASC" ? "DESC" : "ASC";
    }
    updateQueryParams({
      sortBy: field,
      sortOrder: nextOrder,
    });
  };

  const handlePageChange = (newPage: number) => {
    updateQueryParams({
      page: newPage,
    });
  };

  // Queries
  const {
    data: bomsData,
    isLoading: isLoadingBoms,
    isError: isErrorBoms,
    refetch: refetchBoms,
  } = useBoms({
    type: typeParam !== "all" ? typeParam : undefined,
    status: statusParam || undefined,
    search: searchParam || undefined,
    page: pageParam,
    limit: limitParam,
    sortBy: sortByParam,
    sortOrder: sortOrderParam,
  });

  const statsQueryParams: QueryBomStatsParams = {
    type: typeParam !== "all" ? typeParam : undefined,
  };
  if (periodModeParam === "month") {
    statsQueryParams.month = monthParam;
  } else if (periodModeParam === "year") {
    statsQueryParams.year = yearParam;
  } else if (periodModeParam === "dateRange") {
    if (startDateParam) statsQueryParams.startDate = startDateParam;
    if (endDateParam) statsQueryParams.endDate = endDateParam;
  }

  const { data: statsData, isLoading: isLoadingStats } = useBomStats(statsQueryParams);

  const items = bomsData?.data ?? [];
  const totalItems = bomsData?.meta.total ?? 0;
  const totalPages = bomsData?.meta.totalPages ?? 1;

  const isFiltering =
    typeParam !== "all" || Boolean(statusParam) || Boolean(searchParam);

  const handleViewDetail = (id: string, tab?: string) => {
    navigate(tab ? `/bom/${id}?tab=${tab}` : `/bom/${id}`);
  };

  const handleDuplicate = (item: BomListItem) => {
    setIsCreateOpen(true);
    showToast(`Nhân bản định mức: Tạo mới dựa trên mẫu ${item.bomCode}`, "success");
  };

  const handleDelete = (item: BomListItem) => {
    setDeletingBom(item);
  };

  const handleConfirmDiscontinue = async () => {
    if (!deletingBom) return;
    try {
      await discontinueMutation.mutateAsync({
        reason: "Ngừng sử dụng từ danh sách BOM",
      });
      showToast(
        `Đã ngừng sử dụng bảng định mức ${deletingBom.bomCode}`,
        "success",
      );
      setDeletingBom(null);
    } catch {
      showToast(
        "Không thể ngừng sử dụng bảng BOM này. Vui lòng kiểm tra quyền hạn của bạn.",
        "error",
      );
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 lg:p-8">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="mb-1.5 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Link
              to="/dashboard"
              className="transition-colors hover:text-gray-700 dark:hover:text-gray-300"
            >
              Dashboard
            </Link>
            <span className="text-gray-400">&gt;</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Quản lý Nguyên phụ liệu
            </span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Quản lý Nguyên phụ liệu
            </h1>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {totalItems} bảng NPL
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Theo dõi và quản lý nguyên phụ liệu phục vụ sản xuất
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/bom/aggregate"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-gray-700 shadow-xs transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
          >
            <Layers className="h-4 w-4 text-brand-500" />
            <span>Tổng hợp NPL</span>
          </Link>
          {canCreate && (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              aria-label="Thêm nguyên liệu - Tạo BOM"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm nguyên liệu</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards & Period Selector */}
      <BomStatsCards
        stats={statsData}
        isLoading={isLoadingStats}
        periodMode={periodModeParam}
        onPeriodModeChange={handlePeriodModeChange}
        month={monthParam}
        onMonthChange={handleMonthChange}
        year={yearParam}
        onYearChange={handleYearChange}
        startDate={startDateParam}
        onStartDateChange={handleStartDateChange}
        endDate={endDateParam}
        onEndDateChange={handleEndDateChange}
      />

      {/* Filters Toolbar */}
      <BomFilters
        type={typeParam}
        onTypeChange={handleTypeChange}
        status={statusParam}
        onStatusChange={handleStatusChange}
        search={searchParam}
        onSearchChange={handleSearchChange}
        isFiltering={isFiltering}
        onClearFilters={handleClearFilters}
      />

      {/* Data Table */}
      <BomTable
        items={items}
        isLoading={isLoadingBoms}
        isError={isErrorBoms}
        onRetry={() => void refetchBoms()}
        canViewCost={canViewCost}
        sortBy={sortByParam}
        sortOrder={sortOrderParam}
        onSort={handleSort}
        onViewDetail={handleViewDetail}
        isFiltering={isFiltering}
        onClearFilters={handleClearFilters}
        canCreate={canCreate}
        onCreateClick={() => setIsCreateOpen(true)}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />

      {/* Pagination Footer */}
      {totalPages > 0 && (
        <Pagination
          page={pageParam}
          pageSize={limitParam}
          totalItems={totalItems}
          totalPages={totalPages}
          itemLabel="bảng NPL"
          onPageChange={handlePageChange}
        />
      )}

      {/* Create BOM Wizard Modal */}
      <BomCreateWizardModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {/* Discontinue Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(deletingBom)}
        title="Ngừng sử dụng BOM"
        description={`Bạn có chắc chắn muốn ngừng sử dụng (khóa) bảng định mức "${deletingBom?.bomCode}"? Sau khi ngừng sử dụng, bảng BOM sẽ chuyển sang trạng thái Đã khóa và không thể chỉnh sửa.`}
        confirmLabel="Ngừng sử dụng"
        variant="danger"
        isSubmitting={discontinueMutation.isPending}
        onConfirm={handleConfirmDiscontinue}
        onClose={() => setDeletingBom(null)}
      />

      {/* Global Toast */}
      {toast && (
        <Toast
          open={Boolean(toast)}
          message={toast.message}
          variant={toast.variant}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
