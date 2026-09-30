import { useState } from "react";
import { Search } from "lucide-react";
import { Input, PageHeader, Pagination, Select, Table } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { useHttpAuditLogs } from "@/hooks/useEntityHistory";
import type { HttpAuditLog } from "@/api/audit.api";

const PAGE_SIZE = 20;

const METHOD_OPTIONS = [
  { value: "", label: "Tất cả phương thức" },
  { value: "GET", label: "GET" },
  { value: "POST", label: "POST" },
  { value: "PATCH", label: "PATCH" },
  { value: "PUT", label: "PUT" },
  { value: "DELETE", label: "DELETE" },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40",
  POST: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40",
  PATCH:
    "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40",
  PUT: "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40",
  DELETE:
    "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40",
};

function MethodBadge({ method }: { method: string }) {
  const color =
    METHOD_COLORS[method] ??
    "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${color}`}
    >
      {method}
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

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [method, setMethod] = useState("");
  const [page, setPage] = useState(1);

  const auditLogs = useHttpAuditLogs({
    path: debouncedSearch || undefined,
    method: method || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const columns = [
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
      header: "Phương thức",
      width: "w-[130px]",
      render: (row: HttpAuditLog) => <MethodBadge method={row.method} />,
    },
    {
      key: "path",
      header: "Đường dẫn",
      render: (row: HttpAuditLog) => (
        <span className="font-mono text-xs break-all text-gray-700 dark:text-gray-300">
          {row.path}
        </span>
      ),
    },
    {
      key: "actor",
      header: "Người thực hiện",
      width: "w-[180px]",
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

  return (
    <>
      <PageMeta title="Nhật ký hệ thống | TAMI ERP" description="Nhật ký hoạt động hệ thống" />
      <PageHeader
        breadcrumb={[{ label: "Dashboard", to: "/dashboard" }, { label: "Nhật ký hệ thống" }]}
        title="Nhật ký hệ thống"
        description="Nhật ký toàn bộ yêu cầu trong hệ thống — dùng để tra cứu, điều tra sự cố hoặc hoạt động bất thường."
      />

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(280px,1fr)_200px]">
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3.5 z-10 -translate-y-1/2 text-gray-400">
            <Search className="h-5 w-5" aria-hidden="true" />
          </span>
          <Input
            type="search"
            aria-label="Tìm theo đường dẫn"
            placeholder="Tìm theo đường dẫn (VD: /styles, /auth/login...)"
            value={search}
            className="border-gray-300 bg-white pl-11 dark:border-gray-600 dark:bg-gray-900"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            onBlur={() => setDebouncedSearch(search)}
            onKeyDown={(event) => {
              if (event.key === "Enter") setDebouncedSearch(search);
            }}
          />
        </div>
        <Select
          aria-label="Lọc theo phương thức"
          value={method}
          options={METHOD_OPTIONS}
          onChange={(event) => {
            setMethod(event.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="mt-4">
        <Table
          columns={columns}
          rows={auditLogs.data?.items ?? []}
          getRowKey={(row) => row.id}
          loading={auditLogs.isLoading}
          emptyMessage="Không có request nào khớp bộ lọc."
          renderExpandedRow={(row) => (
            <div className="space-y-2 px-4 py-3 text-xs">
              {row.errorMessage && (
                <p className="text-rose-600 dark:text-rose-400">
                  <span className="font-semibold">Lỗi:</span> {row.errorMessage}
                </p>
              )}
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
              <p className="text-gray-400 dark:text-gray-500">
                IP: {row.ipAddress ?? "—"} · Trình duyệt/thiết bị:{" "}
                <span title={row.userAgent ?? undefined}>
                  {summarizeUserAgent(row.userAgent)}
                </span>
              </p>
            </div>
          )}
        />
      </div>

      {auditLogs.data && auditLogs.data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={auditLogs.data.total}
            totalPages={auditLogs.data.totalPages}
            itemLabel="yêu cầu"
            onPageChange={setPage}
          />
        </div>
      )}
    </>
  );
}
