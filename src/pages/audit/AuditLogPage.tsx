import { useState } from "react";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { Input, PageHeader, Pagination, Select, Table } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { ChevronDownIcon } from "@/icons";
import { useHttpAuditLogs } from "@/hooks/useEntityHistory";
import type { HttpAuditLog } from "@/api/audit.api";

const PAGE_SIZE = 20;

// Chỉ còn POST/PUT/PATCH/DELETE — GET không đổi dữ liệu nên không còn được
// ghi log nữa (xem HttpAuditLogMiddleware), giữ lại đây sẽ không khớp gì cả.
const METHOD_OPTIONS = [
  { value: "", label: "Tất cả thao tác" },
  { value: "POST", label: "Tạo mới" },
  { value: "PUT", label: "Cập nhật" },
  { value: "PATCH", label: "Cập nhật" },
  { value: "DELETE", label: "Xoá" },
];

// Cùng bộ từ vựng + màu với EntityEventBadge (lịch sử theo bản ghi) — một
// request POST thành công về bản chất là "tạo mới", PUT/PATCH là "cập nhật",
// nhất quán xuyên suốt ứng dụng thay vì để nguyên tên kỹ thuật HTTP.
const METHOD_META: Record<string, { label: string; icon: typeof Plus; color: string }> = {
  POST: {
    label: "Tạo mới",
    icon: Plus,
    color:
      "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40",
  },
  PUT: {
    label: "Cập nhật",
    icon: Pencil,
    color:
      "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40",
  },
  PATCH: {
    label: "Cập nhật",
    icon: Pencil,
    color:
      "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40",
  },
  DELETE: {
    label: "Xoá",
    icon: Trash2,
    color:
      "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40",
  },
};

function MethodBadge({ method }: { method: string }) {
  const meta = METHOD_META[method];
  if (!meta) {
    return (
      <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
        {method}
      </span>
    );
  }
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.color}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

function StatusBadge({ statusCode }: { statusCode: number | null }) {
  if (statusCode === null) return <span className="text-gray-400">—</span>;
  const color =
    statusCode < 300
      ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40"
      : statusCode < 500
        ? "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40"
        : "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${color}`}
    >
      {statusCode}
    </span>
  );
}

function formatTime(value: string): string {
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Rút gọn chuỗi User-Agent thô (dài, kỹ thuật) thành "Trình duyệt · Hệ điều
 * hành" dễ đọc — chuỗi gốc vẫn xem được qua tooltip khi cần đối chiếu chính
 * xác. HeadlessChrome (Playwright/automation) tách riêng vì đó không phải
 * người dùng thật đang duyệt web. */
function summarizeUserAgent(ua: string | null): string {
  if (!ua) return "—";
  if (/HeadlessChrome/i.test(ua)) return "Trình duyệt tự động (headless)";

  let browser = "Không xác định";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = "Safari";

  let os = "";
  if (/Windows/.test(ua)) os = "Windows";
  else if (/Mac OS X|Macintosh/.test(ua)) os = "macOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iOS/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua)) os = "Linux";

  return os ? `${browser} · ${os}` : browser;
}

function formatParamValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Danh sách key-value gọn thay vì dump nguyên khối JSON — dễ đọc hơn và
 * nhất quán với cách các bảng khác trong hệ thống hiện dữ liệu. */
function KeyValueList({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
      {Object.entries(data).map(([key, value]) => (
        <div
          key={key}
          className="flex flex-wrap items-start gap-x-3 gap-y-0.5 bg-gray-50/60 px-3 py-1.5 dark:bg-gray-800/30"
        >
          <span className="w-36 shrink-0 font-mono text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            {key}
          </span>
          <span className="min-w-0 flex-1 break-all font-mono text-[11px] text-gray-700 dark:text-gray-300">
            {formatParamValue(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/** 1 ô trong lưới chi tiết mở rộng — nhãn nhỏ phía trên, giá trị bên dưới,
 * gọn hơn nhiều so với liệt kê "Nhãn: giá trị" theo từng dòng dài. */
function DetailCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
        {label}
      </p>
      <p className="mt-0.5 truncate text-xs text-gray-700 dark:text-gray-300">{value}</p>
    </div>
  );
}

export default function AuditLogPage() {
  const [emailSearch, setEmailSearch] = useState("");
  const [debouncedEmailSearch, setDebouncedEmailSearch] = useState("");
  const [pathSearch, setPathSearch] = useState("");
  const [debouncedPathSearch, setDebouncedPathSearch] = useState("");
  const [method, setMethod] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const auditLogs = useHttpAuditLogs({
    actorIdentifier: debouncedEmailSearch || undefined,
    path: debouncedPathSearch || undefined,
    method: method || undefined,
    from: dateFrom ? `${dateFrom}T00:00:00.000Z` : undefined,
    to: dateTo ? `${dateTo}T23:59:59.999Z` : undefined,
    page,
    limit: PAGE_SIZE,
  });

  const columns = [
    {
      key: "expand",
      header: "",
      width: "w-[44px]",
      align: "center" as const,
      render: (row: HttpAuditLog) => {
        const isExpanded = expandedIds.has(row.id);
        return (
          <button
            type="button"
            onClick={() => toggleExpanded(row.id)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Thu gọn chi tiết" : "Xem chi tiết"}
            className="hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 focus:ring-brand-500/20 dark:hover:border-brand-700 dark:hover:bg-brand-950/30 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition focus:ring-3 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <ChevronDownIcon
              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        );
      },
    },
    {
      key: "occurredAt",
      header: "Thời gian",
      width: "w-[150px]",
      render: (row: HttpAuditLog) => (
        <span className="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
          {formatTime(row.occurredAt)}
        </span>
      ),
    },
    {
      key: "method",
      header: "Thao tác",
      width: "w-[110px]",
      render: (row: HttpAuditLog) => <MethodBadge method={row.method} />,
    },
    {
      key: "path",
      header: "Đối tượng",
      render: (row: HttpAuditLog) => (
        <span className="font-mono text-xs break-all text-gray-700 dark:text-gray-300">
          {row.path}
        </span>
      ),
    },
    {
      key: "actor",
      header: "Người thực hiện",
      width: "w-[200px]",
      render: (row: HttpAuditLog) => (
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {row.actorIdentifier ?? (row.actorUserId ? row.actorUserId : "Ẩn danh")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Kết quả",
      width: "w-[90px]",
      align: "center" as const,
      render: (row: HttpAuditLog) => <StatusBadge statusCode={row.statusCode} />,
    },
    {
      key: "duration",
      header: "Thời gian xử lý",
      width: "w-[110px]",
      align: "right" as const,
      render: (row: HttpAuditLog) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {row.durationMs !== null ? `${row.durationMs} ms` : "—"}
        </span>
      ),
    },
  ];

  const isFiltering =
    emailSearch !== "" ||
    pathSearch !== "" ||
    method !== "" ||
    dateFrom !== "" ||
    dateTo !== "";

  const clearFilters = () => {
    setEmailSearch("");
    setDebouncedEmailSearch("");
    setPathSearch("");
    setDebouncedPathSearch("");
    setMethod("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  return (
    <>
      <PageMeta title="Nhật ký hệ thống | TAMI ERP" description="Nhật ký hoạt động hệ thống" />
      <PageHeader
        breadcrumb={[{ label: "Dashboard", to: "/dashboard" }, { label: "Nhật ký hệ thống" }]}
        title="Nhật ký hệ thống"
        description="Ghi lại các thao tác làm thay đổi dữ liệu (tạo/sửa/xoá) trong toàn hệ thống — dùng để tra cứu, điều tra sự cố hoặc phát hiện thao tác bất thường."
      />

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="relative w-full max-w-xs">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
            <Search className="h-4 w-4" aria-hidden="true" />
          </span>
          <Input
            type="search"
            aria-label="Tìm theo email người thực hiện"
            placeholder="Tìm theo email người thực hiện..."
            value={emailSearch}
            className="border-gray-300 bg-white pl-9 text-theme-sm dark:border-gray-600 dark:bg-gray-900"
            onChange={(event) => {
              setEmailSearch(event.target.value);
              setPage(1);
            }}
            onBlur={() => setDebouncedEmailSearch(emailSearch)}
            onKeyDown={(event) => {
              if (event.key === "Enter") setDebouncedEmailSearch(emailSearch);
            }}
          />
        </div>
        <div className="relative w-full max-w-xs">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
            <Search className="h-4 w-4" aria-hidden="true" />
          </span>
          <Input
            type="search"
            aria-label="Tìm theo đường dẫn"
            placeholder="Tìm theo đường dẫn (VD: /styles...)"
            value={pathSearch}
            className="border-gray-300 bg-white pl-9 text-theme-sm dark:border-gray-600 dark:bg-gray-900"
            onChange={(event) => {
              setPathSearch(event.target.value);
              setPage(1);
            }}
            onBlur={() => setDebouncedPathSearch(pathSearch)}
            onKeyDown={(event) => {
              if (event.key === "Enter") setDebouncedPathSearch(pathSearch);
            }}
          />
        </div>
        <Select
          aria-label="Lọc theo loại thao tác"
          value={method}
          options={METHOD_OPTIONS}
          onChange={(event) => {
            setMethod(event.target.value);
            setPage(1);
          }}
        />
        <input
          type="date"
          aria-label="Từ ngày"
          value={dateFrom}
          onChange={(event) => {
            setDateFrom(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-theme-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-800 dark:text-white"
        />
        <span className="text-theme-xs text-gray-400">đến</span>
        <input
          type="date"
          aria-label="Đến ngày"
          value={dateTo}
          onChange={(event) => {
            setDateTo(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-theme-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-800 dark:text-white"
        />
        {isFiltering && (
          <button
            type="button"
            onClick={clearFilters}
            className="cursor-pointer text-theme-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Xóa lọc
          </button>
        )}
      </div>

      <div className="mt-4">
        <Table
          columns={columns}
          rows={auditLogs.data?.items ?? []}
          getRowKey={(row) => row.id}
          loading={auditLogs.isLoading}
          emptyMessage="Không có thao tác nào khớp bộ lọc."
          renderExpandedRow={(row) =>
            !expandedIds.has(row.id) ? undefined : (
              <div className="space-y-3 px-4 py-4 text-xs">
              {row.errorMessage && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
                  <span className="font-semibold">Lỗi:</span> {row.errorMessage}
                </p>
              )}

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
                <DetailCell
                  label="Người thực hiện"
                  value={row.actorIdentifier ?? row.actorUserId ?? "Ẩn danh"}
                />
                <DetailCell label="Vai trò" value={row.actorRole ?? "—"} />
                <DetailCell label="Địa chỉ IP" value={row.ipAddress ?? "—"} />
                <DetailCell
                  label="Trình duyệt/thiết bị"
                  value={
                    <span title={row.userAgent ?? undefined}>
                      {summarizeUserAgent(row.userAgent)}
                    </span>
                  }
                />
                <DetailCell label="Mã yêu cầu" value={row.requestId ?? "—"} />
                <DetailCell
                  label="Thời gian xử lý"
                  value={row.durationMs !== null ? `${row.durationMs} ms` : "—"}
                />
              </div>

              {row.queryParams && Object.keys(row.queryParams).length > 0 && (
                <div>
                  <p className="mb-1 font-semibold text-gray-600 dark:text-gray-400">
                    Tham số truy vấn
                  </p>
                  <KeyValueList data={row.queryParams} />
                </div>
              )}
              {row.requestBody && Object.keys(row.requestBody).length > 0 && (
                <div>
                  <p className="mb-1 font-semibold text-gray-600 dark:text-gray-400">
                    Nội dung yêu cầu
                  </p>
                  <KeyValueList data={row.requestBody} />
                </div>
              )}
              </div>
            )
          }
        />
      </div>

      {auditLogs.data && auditLogs.data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={auditLogs.data.total}
            totalPages={auditLogs.data.totalPages}
            itemLabel="thao tác"
            onPageChange={setPage}
          />
        </div>
      )}
    </>
  );
}
