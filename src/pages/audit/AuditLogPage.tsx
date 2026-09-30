import { useState } from "react";
import { Search } from "lucide-react";
import { Input, PageHeader, Pagination, Select, Table } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { useHttpAuditLogs } from "@/hooks/useEntityHistory";
import type { HttpAuditLog } from "@/api/audit.api";

const PAGE_SIZE = 20;

const METHOD_OPTIONS = [
  { value: "", label: "Tất cả method" },
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
      header: "Method",
      width: "w-[90px]",
      render: (row: HttpAuditLog) => <MethodBadge method={row.method} />,
    },
    {
      key: "path",
      header: "Đường dẫn",
      render: (row: HttpAuditLog) => (
        <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{row.path}</span>
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
      <PageMeta title="Audit log | TAMI ERP" description="Nhật ký hoạt động hệ thống" />
      <PageHeader
        breadcrumb={[{ label: "Dashboard", to: "/dashboard" }, { label: "Audit log" }]}
        title="Audit log"
        description="Nhật ký toàn bộ request trong hệ thống — dùng để tra cứu, điều tra sự cố hoặc hoạt động bất thường."
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
          aria-label="Lọc theo method"
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
                  <p className="font-semibold text-gray-600 dark:text-gray-400">Query params</p>
                  <pre className="mt-1 overflow-x-auto rounded-lg bg-gray-50 p-2 dark:bg-gray-800/50">
                    {JSON.stringify(row.queryParams, null, 2)}
                  </pre>
                </div>
              )}
              {row.requestBody && Object.keys(row.requestBody).length > 0 && (
                <div>
                  <p className="font-semibold text-gray-600 dark:text-gray-400">Request body</p>
                  <pre className="mt-1 overflow-x-auto rounded-lg bg-gray-50 p-2 dark:bg-gray-800/50">
                    {JSON.stringify(row.requestBody, null, 2)}
                  </pre>
                </div>
              )}
              <p className="text-gray-400 dark:text-gray-500">
                IP: {row.ipAddress ?? "—"} · User-Agent: {row.userAgent ?? "—"}
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
            itemLabel="request"
            onPageChange={setPage}
          />
        </div>
      )}
    </>
  );
}
