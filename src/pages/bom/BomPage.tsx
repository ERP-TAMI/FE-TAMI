import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  Package,
  Clock,
  CheckCircle2,
  Search,
  RotateCw,
  Eye,
  Edit2,
  MoreHorizontal,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Copy,
  History,
  Download,
  Trash2,
} from "lucide-react";
import { Toast } from "@/components/shared";
import { useToast } from "@/hooks/useToast";
import { useNplList } from "@/hooks/useNplList";
import { useAuthStore } from "@/store/authStore";
import { canViewNplCost } from "@/lib/nplAccess";
import { NplStatusBadge } from "@/components/features/npl/NplStatusBadge";
import { NplObjectTypeBadge } from "@/components/features/npl/NplObjectTypeBadge";
import type { NplListItem, NplObjectType, NplStatus } from "@/types/npl";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("vi-VN");
}

function formatVND(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMonthLabel(monthStr: string): string {
  if (monthStr === "all") return "Toàn thời gian";
  const parts = monthStr.split("-");
  if (parts.length === 2) {
    return `Tháng ${parts[1]}/${parts[0]}`;
  }
  return monthStr;
}

function getColorHex(colorName: string | null | undefined): string {
  if (!colorName) return "#94a3b8";
  const lower = colorName.toLowerCase().trim();
  if (lower.includes("navy")) return "#1e293b";
  if (lower.includes("đen") || lower.includes("black")) return "#18181b";
  if (lower.includes("trắng") || lower.includes("white")) return "#ffffff";
  if (lower.includes("xanh nhạt") || lower.includes("sky")) return "#7dd3fc";
  if (lower.includes("xanh lá") || lower.includes("green")) return "#22c55e";
  if (lower.includes("xanh") || lower.includes("blue")) return "#3b82f6";
  if (lower.includes("xám") || lower.includes("gray") || lower.includes("grey")) return "#71717a";
  if (lower.includes("đỏ") || lower.includes("red")) return "#ef4444";
  if (lower.includes("vàng") || lower.includes("yellow")) return "#eab308";
  if (lower.includes("cam") || lower.includes("orange")) return "#f97316";
  return "#64748b";
}

const NPL_STATUS_OPTIONS: { value: NplStatus | "all"; label: string }[] = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "Draft", label: "Nháp" },
  { value: "Wait_RD", label: "Chờ R&D" },
  { value: "Wait_Price", label: "Chờ nhập giá" },
  { value: "Wait_TP_Approve", label: "Chờ TP duyệt" },
  { value: "Wait_SA_Approve", label: "Chờ GĐ duyệt" },
  { value: "Approved", label: "Đã duyệt" },
  { value: "Locked", label: "Đã khóa" },
];

const PENDING_STATUSES = new Set<NplStatus>([
  "Wait_RD",
  "Wait_Price",
  "Wait_TP_Approve",
  "Wait_SA_Approve",
]);

// ─── Page Component ─────────────────────────────────────────────────────────

export default function BomPage() {
  const user = useAuthStore((s) => s.user);
  const showCost = canViewNplCost(user);
  const { toast, showToast, hideToast } = useToast();

  // Filters
  const [objectTypeFilter, setObjectTypeFilter] = useState<NplObjectType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<NplStatus | "all">("all");
  const [poCodeSearch, setPoCodeSearch] = useState("");
  const [search, setSearch] = useState("");
  const [colorSearch, setColorSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Close kebab menu on outside click
  useEffect(() => {
    if (!activeMenuId) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-kebab-menu]")) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [activeMenuId]);

  const handleMenuAction = (
    action: "duplicate" | "history" | "export" | "delete",
    item: NplListItem,
  ) => {
    setActiveMenuId(null);
    switch (action) {
      case "duplicate":
        showToast(`Đã nhân bản bảng nguyên phụ liệu: ${item.styleCode}`, "success");
        break;
      case "history":
        showToast(`Mở lịch sử phiên bản của: ${item.styleCode}`, "success");
        break;
      case "export":
        showToast(`Đã xuất dữ liệu bảng NPL: ${item.styleCode}`, "success");
        break;
      case "delete":
        showToast(`Đã xóa bảng nguyên phụ liệu: ${item.styleCode}`, "success");
        break;
    }
  };

  const { data: allItems, isLoading, isError, refetch } = useNplList();

  // Client-side filtering
  const filtered = useMemo(() => {
    if (!allItems) return [];
    return allItems.filter((item) => {
      if (objectTypeFilter !== "all" && item.objectType !== objectTypeFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;

      const poQ = poCodeSearch.trim().toLowerCase();
      if (
        poQ &&
        !item.objectCode.toLowerCase().includes(poQ) &&
        !item.poId.toLowerCase().includes(poQ)
      ) {
        return false;
      }

      const q = search.trim().toLowerCase();
      if (
        q &&
        !item.styleCode.toLowerCase().includes(q) &&
        !item.productName.toLowerCase().includes(q) &&
        !item.objectCode.toLowerCase().includes(q)
      ) {
        return false;
      }

      const cq = colorSearch.trim().toLowerCase();
      if (cq && !(item.colorName ?? "").toLowerCase().includes(cq)) {
        return false;
      }

      return true;
    });
  }, [allItems, objectTypeFilter, statusFilter, poCodeSearch, search, colorSearch]);

  // Stats period (defaults to current month: YYYY-MM)
  const [period, setPeriod] = useState<string>(() => getCurrentMonthString());

  // Stats filtered by selected period (month)
  const statsItems = useMemo(() => {
    if (!allItems) return [];
    if (period === "all") return allItems;
    return allItems.filter((i) => (i.createdAt ?? "").startsWith(period));
  }, [allItems, period]);

  const total = statsItems.length;
  const draftCount = statsItems.filter((i) => i.status === "Draft").length;
  const pendingCount = statsItems.filter((i) => PENDING_STATUSES.has(i.status)).length;
  const approvedCount =
    statsItems.filter((i) => i.status === "Approved" || i.status === "Locked").length;

  // Pagination
  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const isFiltering =
    objectTypeFilter !== "all" ||
    statusFilter !== "all" ||
    poCodeSearch.trim() !== "" ||
    search.trim() !== "" ||
    colorSearch.trim() !== "";

  const handleClearFilters = () => {
    setObjectTypeFilter("all");
    setStatusFilter("all");
    setPoCodeSearch("");
    setSearch("");
    setColorSearch("");
    setPage(1);
    void refetch();
  };

  // Row selection
  const isAllSelected =
    paginated.length > 0 && paginated.every((i) => selectedIds.has(i.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((i) => i.id)));
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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

      {/* ─── Breadcrumb & Header ───────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="mb-1.5 flex items-center gap-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
            <Link to="/dashboard" className="transition hover:text-brand-500">
              Dashboard
            </Link>
            <span>&gt;</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Quản lý Nguyên phụ liệu
            </span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Quản lý Nguyên phụ liệu
            </h1>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-theme-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {total} bảng NPL
            </span>
          </div>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Theo dõi và quản lý nguyên phụ liệu phục vụ sản xuất
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-theme-sm font-semibold text-white shadow-xs transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm nguyên liệu</span>
        </button>
      </div>

      {/* ─── Stat Header & Period Selector ──────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-theme-sm font-semibold text-gray-900 dark:text-white">
            Tổng quan tổng kết
          </span>
          <span className="text-theme-xs font-normal text-gray-500 dark:text-gray-400">
            • {formatMonthLabel(period)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Month picker */}
          <div className="relative flex items-center">
            <Calendar className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-brand-500" />
            <input
              type="month"
              value={period === "all" ? "" : period}
              onChange={(e) => setPeriod(e.target.value || "all")}
              className="h-8.5 cursor-pointer rounded-xl border border-gray-200 bg-white pr-3 pl-8 text-xs font-medium text-gray-700 shadow-2xs outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200"
              title="Chọn tháng tổng kết"
            />
          </div>

          {/* Quick toggle: Toàn thời gian / Tháng hiện tại */}
          <button
            type="button"
            onClick={() =>
              setPeriod((prev) => (prev === "all" ? getCurrentMonthString() : "all"))
            }
            className={`h-8.5 rounded-xl border px-3 text-xs font-medium shadow-2xs transition ${
              period === "all"
                ? "border-brand-300 bg-brand-50 text-brand-600 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-400 font-semibold"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            {period === "all" ? "Về tháng này" : "Tất cả thời gian"}
          </button>
        </div>
      </div>

      {/* ─── Stat Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Layers className="h-6 w-6 text-brand-500" />}
          iconBg="bg-brand-50 border border-brand-100 dark:bg-brand-950/40 dark:border-brand-900/40"
          label="Tổng NPL"
          value={total}
          sublabel={period === "all" ? "tất cả" : "tháng này"}
          tone="brand"
        />
        <StatCard
          icon={<Package className="h-6 w-6 text-gray-400 dark:text-gray-500" />}
          iconBg="bg-gray-50 dark:bg-gray-800/40"
          label="Nháp"
          value={draftCount}
          sublabel="bảng"
        />
        <StatCard
          icon={<Clock className="h-6 w-6 text-amber-600/80 dark:text-amber-400/80" />}
          iconBg="bg-amber-50/50 dark:bg-amber-950/20"
          label="Chờ duyệt"
          value={pendingCount}
          sublabel="bảng"
        />
        <StatCard
          icon={<CheckCircle2 className="h-6 w-6 text-brand-500 dark:text-brand-400" />}
          iconBg="bg-brand-50 border border-brand-100 dark:bg-brand-950/40 dark:border-brand-900/40"
          label="Đã duyệt"
          value={approvedCount}
          sublabel="đã duyệt"
          tone="brand"
        />
      </div>

      {/* ─── Filters Toolbar ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-3.5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Object type segmented filter */}
            <div className="inline-flex items-center rounded-xl border border-gray-200/80 bg-gray-50/80 p-1 dark:border-gray-800 dark:bg-gray-800/60">
              {(
                [
                  { key: "all", label: "Tất cả" },
                  { key: "fit", label: "Mẫu Fit" },
                  { key: "po", label: "Sản phẩm PO" },
                ] as const
              ).map((opt) => {
                const isSelected = objectTypeFilter === opt.key;
                const activeClass =
                  opt.key === "fit"
                    ? "bg-[#6370A0] text-white shadow-xs font-semibold"
                    : "bg-brand-500 text-white shadow-xs font-semibold";
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setObjectTypeFilter(opt.key);
                      setPage(1);
                    }}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                      isSelected
                        ? activeClass
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Status select */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as NplStatus | "all");
                  setPage(1);
                }}
                className="cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white py-2 pr-8 pl-3.5 text-xs font-medium text-gray-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200"
              >
                {NPL_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-gray-400">
                ▾
              </span>
            </div>

            {/* PO code filter with search icon */}
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Mã PO..."
                value={poCodeSearch}
                onChange={(e) => {
                  setPoCodeSearch(e.target.value);
                  setPage(1);
                }}
                className="w-32 rounded-xl border border-gray-200 bg-white py-2 pr-3 pl-8 text-xs text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Fit/Style/Product search */}
            <div className="relative min-w-[220px] flex-1 sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Mã Fit / Style / Sản phẩm..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pr-3 pl-8 text-xs text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Color filter */}
            <div className="relative">
              <input
                type="text"
                placeholder="Màu..."
                value={colorSearch}
                onChange={(e) => {
                  setColorSearch(e.target.value);
                  setPage(1);
                }}
                className="w-28 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          {/* Action right: Làm mới / Xóa lọc */}
          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-2xs transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <RotateCw className="h-3.5 w-3.5 text-gray-400" />
            <span>{isFiltering ? "Xóa lọc" : "Làm mới"}</span>
          </button>
        </div>
      </div>

      {/* ─── Content / Table ──────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 w-full animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800/60"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-error-200 bg-error-50 p-6 text-center text-theme-sm text-error-700 dark:border-error-900/40 dark:bg-error-950/30 dark:text-error-300">
          Có lỗi khi tải dữ liệu Nguyên phụ liệu.{" "}
          <button
            type="button"
            onClick={() => void refetch()}
            className="font-semibold underline hover:text-error-800"
          >
            Thử lại
          </button>
        </div>
      ) : paginated.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-theme-base font-semibold text-gray-900 dark:text-white">
            {isFiltering
              ? "Không tìm thấy Nguyên phụ liệu phù hợp"
              : "Chưa có Nguyên phụ liệu nào"}
          </p>
          <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
            {isFiltering
              ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
              : "Nguyên phụ liệu sẽ hiển thị khi có dữ liệu BOM từ hệ thống."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-theme-sm text-gray-700 dark:text-gray-300">
              <thead className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-400">
                <tr>
                  <th className="w-10 px-4 py-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleToggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
                      aria-label="Chọn tất cả"
                    />
                  </th>
                  <th className="px-4 py-3.5">Đối tượng</th>
                  <th className="px-4 py-3.5">Mã Fit/PO</th>
                  <th className="px-4 py-3.5">Sản phẩm / Mẫu</th>
                  <th className="px-4 py-3.5">Màu</th>
                  {showCost && <th className="px-4 py-3.5 text-right">Giá thành/SP</th>}
                  <th className="px-4 py-3.5">Trạng thái</th>
                  <th className="px-4 py-3.5">Ngày tạo</th>
                  <th className="px-4 py-3.5 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginated.map((item) => (
                  <NplRow
                    key={item.id}
                    item={item}
                    showCost={showCost}
                    isSelected={selectedIds.has(item.id)}
                    onToggleSelect={() => handleToggleRow(item.id)}
                    isMenuOpen={activeMenuId === item.id}
                    onToggleMenu={() =>
                      setActiveMenuId((prev) => (prev === item.id ? null : item.id))
                    }
                    onMenuAction={handleMenuAction}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* ─── Pagination Footer ─────────────────────────────────── */}
          <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-5 py-3.5 sm:flex-row dark:border-gray-800">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Hiển thị {(safePage - 1) * pageSize + 1}–
              {Math.min(safePage * pageSize, totalFiltered)} trên {totalFiltered} bảng NPL
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span>Hiển thị</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>mỗi trang</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  const isActive = p === safePage;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition ${
                        isActive
                          ? "bg-brand-500 text-white font-semibold shadow-xs"
                          : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
                  aria-label="Trang sau"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function NplRow({
  item,
  showCost,
  isSelected,
  onToggleSelect,
  isMenuOpen,
  onToggleMenu,
  onMenuAction,
}: {
  item: NplListItem;
  showCost: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onMenuAction: (action: "duplicate" | "history" | "export" | "delete", item: NplListItem) => void;
}) {
  const displayCode =
    item.objectCode && item.objectCode.length > 20
      ? item.objectCode.slice(0, 8)
      : item.objectCode || "—";

  const colorHex = getColorHex(item.colorName);

  return (
    <tr
      className={`transition-colors ${
        isSelected
          ? "bg-brand-50/40 dark:bg-brand-950/20"
          : "hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
      }`}
    >
      <td className="w-10 px-4 py-3.5 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
        />
      </td>

      <td className="px-4 py-3.5">
        <NplObjectTypeBadge objectType={item.objectType} />
      </td>

      <td className="px-4 py-3.5">
        <span
          className={`font-mono text-xs font-semibold transition hover:underline cursor-pointer ${
            item.objectType === "po"
              ? "text-brand-600 hover:text-brand-700 dark:text-brand-400"
              : "text-[#6370A0] hover:text-[#4f5b85] dark:text-slate-300"
          }`}
        >
          {displayCode}
        </span>
      </td>

      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt=""
              className="h-10 w-10 shrink-0 rounded-xl border border-gray-200/80 bg-gray-50 object-cover dark:border-gray-800"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200/80 bg-gray-50 text-gray-400 dark:border-gray-800 dark:bg-gray-800">
              <Package className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900 dark:text-white">
              {item.styleCode}
            </p>
            <p className="text-theme-xs text-gray-500 line-clamp-1 dark:text-gray-400">
              {item.productName}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3.5">
        {item.colorName ? (
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 shrink-0 rounded-full border border-gray-300/80 shadow-2xs dark:border-gray-600"
              style={{ backgroundColor: colorHex }}
            />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {item.colorName}
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>

      {showCost && (
        <td className="px-4 py-3.5 text-right">
          <span className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">
            {formatVND(item.totalCostPerUnit)}
          </span>
        </td>
      )}

      <td className="px-4 py-3.5">
        <NplStatusBadge status={item.status} />
      </td>

      <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400">
        {formatDate(item.createdAt)}
      </td>

      <td className="px-4 py-3.5 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-gray-800 dark:hover:text-brand-400"
            title="Xem chi tiết"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-gray-800 dark:hover:text-brand-400"
            title="Chỉnh sửa"
          >
            <Edit2 className="h-4 w-4" />
          </button>

          {/* Kebab action menu */}
          <div className="relative" data-kebab-menu>
            <button
              type="button"
              onClick={onToggleMenu}
              className={`rounded-lg p-1.5 transition ${
                isMenuOpen
                  ? "border border-brand-500 bg-brand-50 text-brand-600 shadow-2xs dark:border-brand-500 dark:bg-brand-950/40 dark:text-brand-400"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              }`}
              title="Thêm hành động"
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {isMenuOpen && (
              <div
                className="absolute right-0 top-full z-40 mt-1.5 w-44 rounded-2xl border border-gray-200/90 bg-white p-1.5 shadow-lg dark:border-gray-800 dark:bg-gray-900"
                role="menu"
              >
                <button
                  type="button"
                  onClick={() => onMenuAction("duplicate", item)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800/60"
                  role="menuitem"
                >
                  <Copy className="h-3.5 w-3.5 text-gray-400" />
                  <span>Nhân bản</span>
                </button>

                <button
                  type="button"
                  onClick={() => onMenuAction("history", item)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800/60"
                  role="menuitem"
                >
                  <History className="h-3.5 w-3.5 text-gray-400" />
                  <span>Xem lịch sử</span>
                </button>

                <button
                  type="button"
                  onClick={() => onMenuAction("export", item)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800/60"
                  role="menuitem"
                >
                  <Download className="h-3.5 w-3.5 text-gray-400" />
                  <span>Xuất dữ liệu</span>
                </button>

                <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

                <button
                  type="button"
                  onClick={() => onMenuAction("delete", item)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-error-600 transition hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-950/30"
                  role="menuitem"
                >
                  <Trash2 className="h-3.5 w-3.5 text-error-500" />
                  <span>Xóa</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

function StatCard({
  icon,
  iconBg,
  label,
  value,
  sublabel,
  tone,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number;
  sublabel: string;
  tone?: "brand";
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-2xl border p-4 shadow-xs transition-all ${
        tone === "brand"
          ? "border-brand-200/80 bg-brand-50/20 dark:border-brand-900/40 dark:bg-brand-950/10"
          : "border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900"
      }`}
    >
      <div className="flex items-center gap-3.5">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
          {icon}
        </div>
        <div>
          <span
            className={`text-theme-xs font-medium ${
              tone === "brand"
                ? "text-brand-600 dark:text-brand-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {label}
          </span>
          <p
            className={`text-2xl font-bold tracking-tight ${
              tone === "brand"
                ? "text-brand-600 dark:text-brand-400"
                : "text-gray-900 dark:text-white"
            }`}
          >
            {value}
          </p>
        </div>
      </div>
      <span
        className={`self-end text-theme-xs font-normal ${
          tone === "brand"
            ? "text-brand-400 dark:text-brand-500 font-medium"
            : "text-gray-400"
        }`}
      >
        {sublabel}
      </span>
    </div>
  );
}
