import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Pagination } from "@/components/shared/Pagination";
import { Toast } from "@/components/shared/Toast";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/useToast";
import { useBoms, useDiscontinueBom, useRestoreBom } from "@/hooks/useBoms";
import {
  canCreateBom,
  canDiscontinueBom,
  canRestoreBom,
  canViewBomCost,
  getCurrentMonthString,
} from "@/lib/bomAccess";
import type { BomType, BomListItem } from "@/types/bom";

import type { PeriodMode } from "@/components/features/bom/BomStatsCards";
import { BomFilters } from "@/components/features/bom/BomFilters";
import { BomTable } from "@/components/features/bom/BomTable";
import { BomCreateWizardModal } from "@/components/features/bom/BomCreateWizardModal";
import { bomsApi } from "@/api/boms.api";

export default function BomPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const { toast, showToast, hideToast } = useToast();

  // Modal create wizard state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [discontinuingBom, setDiscontinuingBom] = useState<BomListItem | null>(null);
  const [restoringBom, setRestoringBom] = useState<BomListItem | null>(null);

  const discontinueMutation = useDiscontinueBom(discontinuingBom?.id || "");
  const restoreMutation = useRestoreBom(restoringBom?.id || "");

  // Permission checks
  const canCreate = canCreateBom(user);
  const canViewCost = canViewBomCost(user);

  // Parse URL search parameters with fallbacks
  const rawType = searchParams.get("type");
  const typeParam: BomType | "all" = rawType === "fit" || rawType === "po" ? rawType : "all";
  const statusParam = searchParams.get("status") || "";
  const searchParam = searchParams.get("search") || "";

  // Local debounced search text, synced with the URL param
  const [localSearch, setLocalSearch] = useState(searchParam);

  useEffect(() => {
    setLocalSearch(searchParam);
  }, [searchParam]);

  // Period filter (month/year/date range) — only takes effect once the user
  // actually picks a period; on first load nothing is sent to the BE and the
  // full list shows, same as the other filters' "Tất cả" default.
  const currentMonth = getCurrentMonthString();
  const currentYear = String(new Date().getFullYear());
  const hasPeriodFilter = Boolean(
    searchParams.get("periodMode") ||
      searchParams.get("month") ||
      searchParams.get("year") ||
      searchParams.get("startDate") ||
      searchParams.get("endDate"),
  );
  const periodModeParam = (searchParams.get("periodMode") as PeriodMode) || "month";
  const monthParam = searchParams.get("month") || currentMonth;
  const yearParam = searchParams.get("year") || currentYear;
  const startDateParam = searchParams.get("startDate") || "";
  const endDateParam = searchParams.get("endDate") || "";

  const pageParam = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limitParam = Math.max(1, parseInt(searchParams.get("limit") || "20", 10));
  const sortByParam =
    (searchParams.get("sortBy") as "bomCode" | "createdAt" | "updatedAt" | "deadline") ||
    "updatedAt";
  const sortOrderParam = (searchParams.get("sortOrder") as "ASC" | "DESC") || "DESC";

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
    setLocalSearch(newSearch);
  };

  // Debounce the free-text search before pushing it into the URL/query.
  useEffect(() => {
    if (localSearch === searchParam) return;
    const timer = setTimeout(() => {
      updateQueryParams({
        search: localSearch.trim() || undefined,
        page: 1,
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [localSearch, searchParam, updateQueryParams]);

  const handlePeriodModeChange = (newMode: PeriodMode) => {
    updateQueryParams({
      periodMode: newMode,
      month: newMode === "month" ? monthParam : undefined,
      year: newMode === "year" ? yearParam : undefined,
      startDate: newMode === "dateRange" ? startDateParam : undefined,
      endDate: newMode === "dateRange" ? endDateParam : undefined,
      page: 1,
    });
  };

  const handleMonthChange = (newMonth: string) => {
    updateQueryParams({
      periodMode: "month",
      month: newMonth || undefined,
      page: 1,
    });
  };

  const handleYearChange = (newYear: string) => {
    updateQueryParams({
      periodMode: "year",
      year: newYear || undefined,
      page: 1,
    });
  };

  const handleStartDateChange = (date: string) => {
    updateQueryParams({
      periodMode: "dateRange",
      startDate: date || undefined,
      page: 1,
    });
  };

  const handleEndDateChange = (date: string) => {
    updateQueryParams({
      periodMode: "dateRange",
      endDate: date || undefined,
      page: 1,
    });
  };

  const handleClearFilters = () => {
    setLocalSearch("");
    updateQueryParams({
      type: undefined,
      status: undefined,
      search: undefined,
      periodMode: undefined,
      month: undefined,
      year: undefined,
      startDate: undefined,
      endDate: undefined,
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
    month: hasPeriodFilter && periodModeParam === "month" ? monthParam : undefined,
    year: hasPeriodFilter && periodModeParam === "year" ? yearParam : undefined,
    startDate: hasPeriodFilter && periodModeParam === "dateRange" ? startDateParam : undefined,
    endDate: hasPeriodFilter && periodModeParam === "dateRange" ? endDateParam : undefined,
    page: pageParam,
    limit: limitParam,
    sortBy: sortByParam,
    sortOrder: sortOrderParam,
  });

  const items = bomsData?.data ?? [];
  const totalItems = bomsData?.meta.total ?? 0;
  const totalPages = bomsData?.meta.totalPages ?? 1;

  const isFiltering =
    typeParam !== "all" || Boolean(statusParam) || Boolean(searchParam) || hasPeriodFilter;

  const handleViewDetail = (id: string, tab?: string) => {
    navigate(tab ? `/bom/${id}?tab=${tab}` : `/bom/${id}`);
  };

  const handleOpenBom = (item: BomListItem) => handleViewDetail(item.id);

  const handleDiscontinue = (item: BomListItem) => {
    setDiscontinuingBom(item);
  };

  const handleConfirmDiscontinue = async () => {
    if (!discontinuingBom) return;
    try {
      const detail = await bomsApi.getBomById(discontinuingBom.id);
      await discontinueMutation.mutateAsync({
        reason: "Ngừng sử dụng từ danh sách NPL",
        expectedRowVersion: detail.rowVersion,
      });
      showToast(`Đã ngừng sử dụng bảng định mức ${discontinuingBom.bomCode}`, "success");
      setDiscontinuingBom(null);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: unknown } } };
      const message = apiError.response?.data?.message;
      showToast(
        typeof message === "string"
          ? message
          : "Không thể ngừng sử dụng bảng NPL. Vui lòng thử lại.",
        "error",
      );
    }
  };

  const handleConfirmRestore = async () => {
    if (!restoringBom) return;
    try {
      const detail = await bomsApi.getBomById(restoringBom.id);
      await restoreMutation.mutateAsync({ expectedRowVersion: detail.rowVersion });
      showToast(`Đã mở khóa NPL ${restoringBom.bomCode}`, "success");
      setRestoringBom(null);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: unknown } } };
      const message = apiError.response?.data?.message;
      showToast(
        typeof message === "string" ? message : "Không thể mở khóa NPL. Vui lòng thử lại.",
        "error",
      );
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Quản lý Nguyên phụ liệu" },
        ]}
        title="Quản lý Nguyên phụ liệu"
        stats={[{ label: "bảng NPL", value: totalItems }]}
      />

      {/* Filters Toolbar */}
      <BomFilters
        type={typeParam}
        onTypeChange={handleTypeChange}
        status={statusParam}
        onStatusChange={handleStatusChange}
        search={localSearch}
        onSearchChange={handleSearchChange}
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
        canCreate={canCreate}
        onCreateClick={() => setIsCreateOpen(true)}
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
        canDiscontinue={(item) => canDiscontinueBom(user, item) && !item.discontinuedAt}
        canRestore={(item) => canRestoreBom(user) && Boolean(item.discontinuedAt)}
        onOpenBom={handleOpenBom}
        onDiscontinue={handleDiscontinue}
        onRestore={setRestoringBom}
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
      <BomCreateWizardModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      {/* Discontinue Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(discontinuingBom)}
        title="Ngừng sử dụng NPL"
        description={`Bạn có chắc chắn muốn ngừng sử dụng (khóa) bảng định mức "${discontinuingBom?.bomCode}"? NPL đã khóa chỉ có thể được TPKH hoặc Quản trị hệ thống mở khóa.`}
        confirmLabel="Ngừng sử dụng"
        closeOnClickOutside
        variant="danger"
        isSubmitting={discontinueMutation.isPending}
        onConfirm={handleConfirmDiscontinue}
        onClose={() => setDiscontinuingBom(null)}
      />

      <ConfirmDialog
        open={Boolean(restoringBom)}
        title="Mở khóa NPL"
        description={`Khôi phục sử dụng bảng định mức "${restoringBom?.bomCode}"? NPL sẽ quay lại trạng thái theo phiên bản hiện tại.`}
        confirmLabel="Mở khóa"
        closeOnClickOutside
        isSubmitting={restoreMutation.isPending}
        onConfirm={handleConfirmRestore}
        onClose={() => setRestoringBom(null)}
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
