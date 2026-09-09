import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Toast, Button, Pagination } from "@/components/shared";
import { PoStatusBadge } from "@/components/features/po/PoStatusBadge";
import { PoCreateModal } from "@/components/features/po/PoCreateModal";
import type { UploadProgress } from "@/components/features/po/PoCreateModal";
import {
  usePurchaseOrders,
  useCreatePurchaseOrder,
} from "@/hooks/usePurchaseOrders";
import { poApi } from "@/api/po.api";
import { useToast } from "@/hooks/useToast";
import { getApiError } from "@/lib/apiError";
import type { CreatePoInput, PoStatus, AttachedDocItem } from "@/types/po";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("vi-VN");
}

export default function PoListPage() {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PoStatus | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  const queryParams = {
    search: search.trim() || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    limit: 10,
  };

  const { data, isLoading, isError, refetch } = usePurchaseOrders(queryParams);
  const createMutation = useCreatePurchaseOrder();

  const handleCreateSubmit = async (input: CreatePoInput, files: AttachedDocItem[]) => {
    try {
      const created = await createMutation.mutateAsync(input);
      let successCount = 0;
      const failedFiles: string[] = [];

      if (files && files.length > 0) {
        setUploadProgress({ total: files.length, completed: 0 });
        for (let i = 0; i < files.length; i++) {
          const item = files[i];
          setUploadProgress({
            total: files.length,
            completed: i,
            currentFileName: item.file.name,
          });
          try {
            await poApi.uploadDocument(created.id, item.file, item.purpose);
            successCount++;
          } catch (uploadErr) {
            console.error("Lỗi khi tải tệp đính kèm:", uploadErr);
            failedFiles.push(item.file.name);
          }
        }
        setUploadProgress({ total: files.length, completed: files.length });
      }

      if (failedFiles.length > 0) {
        if (successCount === 0) {
          showToast(
            `Đã tạo PO ${created.poCode} nhưng không thể tải lên ${failedFiles.length} tài liệu đính kèm. Vui lòng tải lại trong trang chi tiết.`,
            "error"
          );
        } else {
          showToast(
            `Đã tạo PO ${created.poCode}, đính kèm thành công ${successCount}/${files.length} tài liệu. Có ${failedFiles.length} tệp thất bại: ${failedFiles.join(", ")}.`,
            "error"
          );
        }
      } else {
        showToast(
          files && files.length > 0
            ? `Đã tạo đơn hàng PO ${created.poCode} và đính kèm ${files.length} tài liệu phân loại thành công.`
            : `Đã tạo đơn hàng PO ${created.poCode} thành công.`
        );
      }
      setUploadProgress(null);
      setIsCreateOpen(false);
    } catch (err: unknown) {
      setUploadProgress(null);
      const apiErr = getApiError(err, "Tạo đơn hàng PO thất bại.");
      showToast(apiErr.message, "error");
      throw new Error(apiErr.message);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const isFiltering = search.trim() !== "" || statusFilter !== "all" || dateFrom !== "" || dateTo !== "";

  const draftCount = items.filter((i) => i.status === "draft").length;
  const inProgressCount = items.filter(
    (i) => i.status === "in_progress" || i.status === "pending_rd",
  ).length;
  const closedCount = items.filter((i) => i.status === "closed").length;

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          open={!!toast}
          message={toast.message}
          variant={toast.variant}
          onClose={hideToast}
        />
      )}

      <PageHeader
        breadcrumb={[
          { label: "Trang chủ", to: "/" },
          { label: "Quản lý Purchase Orders" },
        ]}
        title="Quản lý Purchase Orders"
        stats={[{ label: "đơn hàng", value: total }]}
        action={{
          label: "+ Tạo PO mới",
          onClick: () => setIsCreateOpen(true),
        }}
      />

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <span className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
            Tổng đơn hàng PO
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {total}
            </span>
            <span className="text-theme-xs text-gray-400">tất cả</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <span className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
            Nháp
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {draftCount}
            </span>
            <span className="text-theme-xs text-gray-400">đơn hàng</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <span className="text-theme-xs font-medium text-blue-600 dark:text-blue-400">
            Đang xử lý
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {inProgressCount}
            </span>
            <span className="text-theme-xs text-blue-500 font-medium">đơn hàng</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <span className="text-theme-xs font-medium text-success-600 dark:text-success-400">
            Khóa
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {closedCount}
            </span>
            <span className="text-theme-xs text-success-500 font-medium">đã khóa</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="min-w-64 flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm theo mã PO, mã PO KH, tên khách hàng..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-theme-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as PoStatus | "all");
              setPage(1);
            }}
            className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-theme-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="draft">Nháp</option>
            <option value="in_progress">Đang xử lý</option>
            <option value="closed">Khóa</option>
          </select>

          {/* Date Range Picker */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-theme-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-800 dark:text-white"
            />
            <span className="text-theme-xs text-gray-400">đến</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-theme-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {isFiltering && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              Xóa lọc
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-theme-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
          Đang tải danh sách đơn hàng PO...
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-error-200 bg-error-50 p-6 text-center text-theme-sm text-error-700 dark:border-error-900/40 dark:bg-error-950/30 dark:text-error-300">
          Có lỗi khi tải dữ liệu PO.{" "}
          <button
            type="button"
            onClick={() => void refetch()}
            className="font-semibold underline hover:text-error-800"
          >
            Thử lại
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-theme-base font-semibold text-gray-900 dark:text-white">
            Không tìm thấy đơn hàng PO phù hợp.
          </p>
          <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
            Thử thay đổi bộ lọc tìm kiếm hoặc nhấn nút tạo PO mới ở trên.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full text-left text-theme-sm text-gray-700 dark:text-gray-300">
            <thead className="border-b border-gray-200 bg-gray-50/80 text-theme-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400">
              <tr>
                <th className="px-5 py-3.5">Mã PO</th>
                <th className="px-5 py-3.5">Mã PO Khách hàng</th>
                <th className="px-5 py-3.5">Khách hàng</th>
                <th className="px-5 py-3.5 text-center">Số SP</th>
                <th className="px-5 py-3.5">Ngày nhận</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((po) => (
                <tr
                  key={po.id}
                  className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                >
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => navigate(`/po/${po.id}`)}
                      className="font-mono font-semibold text-brand-600 hover:underline dark:text-brand-400"
                    >
                      {po.poCode}
                    </button>
                  </td>
                  <td className="px-5 py-4 font-mono text-theme-xs text-gray-500 dark:text-gray-400">
                    {po.customerPoCode || "—"}
                  </td>
                  <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">
                    {po.customerNameSnapshot}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-2.5 py-0.5 font-mono text-theme-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {po.productsCount ?? 0}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-theme-xs text-gray-500 dark:text-gray-400">
                    {formatDate(po.receivedDate)}
                  </td>
                  <td className="px-5 py-4">
                    <PoStatusBadge status={po.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/po/${po.id}`)}
                    >
                      Xem chi tiết →
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Clean Standard Pagination */}
          <Pagination
            page={page}
            pageSize={10}
            totalItems={total}
            totalPages={totalPages}
            itemLabel="đơn hàng PO"
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      {/* Create Modal */}
      <PoCreateModal
        isOpen={isCreateOpen}
        isPending={createMutation.isPending}
        uploadProgress={uploadProgress}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />
    </div>
  );
}

