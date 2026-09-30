import { Fragment, useEffect, useState, type ReactNode } from "react";
import { ChevronRight, RefreshCw, Search, ScrollText } from "lucide-react";
import { PageHeader, Pagination } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { USER_ROLE_OPTIONS } from "@/components/features/user-management/userRoleOptions";
import {
  BADGE_AMBER,
  BADGE_BASE,
  BADGE_BLUE,
  BADGE_GREEN,
  BADGE_NEUTRAL,
  BADGE_PURPLE,
  BADGE_RED,
  CONTROL_CLASS,
  DATE_PRESET_OPTIONS,
  formatClock,
  formatDay,
  useDateRange,
  type DatePreset,
} from "@/components/features/audit/auditShared";
import { useHttpAuditLogs } from "@/hooks/useEntityHistory";
import type { HttpAuditLog } from "@/api/audit.api";

const PAGE_SIZE = 20;

const ACTION_FILTER_OPTIONS = [
  { value: "", label: "Tất cả hành động" },
  { value: "login", label: "Đăng nhập" },
  { value: "login_failed", label: "Đăng nhập thất bại" },
  { value: "create", label: "Tạo mới" },
  { value: "update", label: "Cập nhật" },
  { value: "delete", label: "Xoá" },
  { value: "upload", label: "Tải tệp lên" },
  { value: "status_change", label: "Đổi trạng thái" },
  { value: "approve", label: "Phê duyệt" },
  { value: "reject", label: "Từ chối" },
  { value: "password_change", label: "Đổi mật khẩu" },
];

// Đăng nhập/đăng xuất chiếm phần lớn số dòng nên để xám trung tính — màu
// dành cho thao tác thật sự đổi dữ liệu và cho những gì cần chú ý (đỏ).
const ACTION_COLORS: Record<string, string> = {
  login: BADGE_NEUTRAL,
  logout: BADGE_NEUTRAL,
  login_failed: BADGE_RED,
  create: BADGE_GREEN,
  update: BADGE_BLUE,
  delete: BADGE_RED,
  upload: BADGE_PURPLE,
  status_change: BADGE_AMBER,
  approve: BADGE_GREEN,
  reject: BADGE_RED,
  password_change: BADGE_AMBER,
  password_reset: BADGE_AMBER,
  password_reset_request: BADGE_AMBER,
  password_setup: BADGE_AMBER,
};
const DEFAULT_ACTION_COLOR = BADGE_BLUE;

const ROLE_LABELS = new Map(USER_ROLE_OPTIONS.map((option) => [option.value, option.label]));

function roleLabel(roleCode: string | null): string {
  if (!roleCode) return "—";
  return ROLE_LABELS.get(roleCode as never) ?? roleCode;
}

function resourceLabelOf(log: HttpAuditLog): string {
  return log.resourceLabel ?? "—";
}

function isSuccess(log: HttpAuditLog): boolean {
  return log.statusCode !== null && log.statusCode < 400;
}

function browserOf(ua: string | null): string {
  if (!ua) return "—";
  if (/HeadlessChrome/i.test(ua)) return "Trình duyệt tự động";
  const match =
    ua.match(/Edg\/(\d+)/) ??
    ua.match(/Chrome\/(\d+)/) ??
    ua.match(/Firefox\/(\d+)/) ??
    ua.match(/Version\/(\d+).*Safari/);
  if (!match) return "Không xác định";
  const name = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : "Safari";
  return `${name} ${match[1]}`;
}

function osOf(ua: string | null): string {
  if (!ua) return "—";
  if (/Windows/.test(ua)) return "Windows";
  if (/Mac OS X|Macintosh/.test(ua)) return "macOS";
  if (/Android/.test(ua)) return "Android";
  if (/iPhone|iPad/.test(ua)) return "iOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Không xác định";
}

/** Nhãn tiếng Việt cho các field hay gặp trong dữ liệu gửi lên — field lạ
 * vẫn hiện tên gốc để IT đối chiếu được. */
const BODY_KEY_LABELS: Record<string, string> = {
  email: "Email",
  password: "Mật khẩu",
  styleCode: "Mã mẫu",
  styleName: "Tên mẫu",
  category: "Dòng sản phẩm",
  description: "Mô tả",
  status: "Trạng thái",
  baseImageKey: "Ảnh mẫu",
  steps: "Danh sách công đoạn",
  stepName: "Tên công đoạn",
  as3bCmBaseDays: "Số ngày CM cơ sở",
  fileName: "Tên tệp",
  mimeType: "Loại tệp",
  sizeBytes: "Dung lượng",
  objectKey: "Mã tệp lưu trữ",
  purpose: "Mục đích",
  sampleDate: "Ngày may mẫu",
  feedback: "Phản hồi",
  name: "Tên",
  materialName: "Tên NPL",
  materialCode: "Mã NPL",
  unitName: "Tên đơn vị",
  fullName: "Họ tên",
  roleCode: "Vai trò",
  note: "Ghi chú",
};

function formatBodyValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (Array.isArray(value)) return `${value.length} mục`;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function ActionBadge({ log }: { log: HttpAuditLog }) {
  const color = (log.action && ACTION_COLORS[log.action]) || DEFAULT_ACTION_COLOR;
  return (
    <span
      className={`${BADGE_BASE} ${color}`}
      title={log.actionLabel ?? log.method}
    >
      {log.actionLabel ?? log.method}
    </span>
  );
}

function ResultIndicator({ log }: { log: HttpAuditLog }) {
  if (log.statusCode === null) return <span className="text-gray-400">—</span>;
  const ok = isSuccess(log);
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${ok ? "bg-emerald-500" : "bg-rose-500"}`}
        aria-hidden="true"
      />
      <span className={ok ? "text-gray-700 dark:text-gray-300" : "text-rose-600 dark:text-rose-400"}>
        {ok ? "Thành công" : "Thất bại"}
      </span>
    </span>
  );
}

/** 1 ô trong lưới chi tiết: nhãn nhỏ bên trái, giá trị bên phải, gạch chân. */
function Field({ label, value, title }: { label: string; value: ReactNode; title?: string }) {
  return (
    <div className="flex min-w-0 items-baseline gap-3 border-b border-gray-100 py-2 dark:border-gray-800">
      <span className="w-28 shrink-0 text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span
        className="min-w-0 flex-1 truncate text-sm text-gray-900 dark:text-gray-100"
        title={title ?? (typeof value === "string" ? value : undefined)}
      >
        {value}
      </span>
    </div>
  );
}

/** Lưới 3 cột điền theo cột (giống OneSignal) — mỗi cột đủ số dòng bằng nhau. */
function FieldGrid({ children, count }: { children: ReactNode; count: number }) {
  const rows = Math.ceil(count / 3);
  return (
    <div
      className="grid grid-cols-1 gap-x-8 md:grid-flow-col md:grid-cols-3"
      style={{ gridTemplateRows: `repeat(${rows}, auto)` }}
    >
      {children}
    </div>
  );
}

function LogDetail({ log }: { log: HttpAuditLog }) {
  const fields: { label: string; value: string }[] = [
    { label: "Hành động", value: log.actionLabel ?? "—" },
    { label: "Loại đối tượng", value: resourceLabelOf(log) },
    { label: "Tên đối tượng", value: log.targetName ?? "—" },
    {
      label: "Thuộc",
      value: log.contextName ? `${log.contextLabel ?? ""}: ${log.contextName}` : "—",
    },
    { label: "Mã đối tượng", value: log.resourceId ?? "—" },
    { label: "Người thực hiện", value: log.actorIdentifier ?? "Không xác định" },
    { label: "Vai trò", value: roleLabel(log.actorRole) },
    {
      label: "Thời gian",
      value: `${formatClock(log.occurredAt)} ${formatDay(log.occurredAt)}`,
    },
    {
      label: "Kết quả",
      value:
        log.statusCode === null
          ? "—"
          : `${isSuccess(log) ? "Thành công" : "Thất bại"} (${log.statusCode})`,
    },
    { label: "Thời gian xử lý", value: log.durationMs !== null ? `${log.durationMs} ms` : "—" },
    { label: "Địa chỉ IP", value: log.ipAddress ?? "—" },
    { label: "Trình duyệt", value: browserOf(log.userAgent) },
    { label: "Hệ điều hành", value: osOf(log.userAgent) },
    { label: "Yêu cầu", value: `${log.method} ${log.path}` },
    { label: "Mã yêu cầu", value: log.requestId ?? "—" },
  ];
  const bodyEntries = log.requestBody ? Object.entries(log.requestBody) : [];

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-5 py-3 shadow-xs dark:border-gray-800 dark:bg-gray-900">
      {log.errorMessage && (
        <p className="mb-2 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
          <span className="font-medium">Lỗi:</span> {log.errorMessage}
        </p>
      )}
      <FieldGrid count={fields.length}>
        {fields.map((field) => (
          <Field key={field.label} label={field.label} value={field.value} />
        ))}
      </FieldGrid>

      {bodyEntries.length > 0 && (
        <>
          <p className="mt-4 mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
            Dữ liệu gửi lên
          </p>
          <FieldGrid count={bodyEntries.length}>
            {bodyEntries.map(([key, value]) => (
              <Field key={key} label={BODY_KEY_LABELS[key] ?? key} value={formatBodyValue(value)} />
            ))}
          </FieldGrid>
        </>
      )}
    </div>
  );
}

const COLUMN_COUNT = 8;

export default function AuditLogPage() {
  const [emailSearch, setEmailSearch] = useState("");
  const [debouncedEmail, setDebouncedEmail] = useState("");
  const [action, setAction] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedEmail(emailSearch.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [emailSearch]);

  const { from, to } = useDateRange(datePreset, customFrom, customTo);

  const auditLogs = useHttpAuditLogs({
    actorIdentifier: debouncedEmail || undefined,
    action: action || undefined,
    from,
    to,
    page,
    limit: PAGE_SIZE,
  });

  const rows = auditLogs.data?.items ?? [];
  const isFiltering = emailSearch !== "" || action !== "" || datePreset !== "7d";

  const clearFilters = () => {
    setEmailSearch("");
    setDebouncedEmail("");
    setAction("");
    setDatePreset("7d");
    setCustomFrom("");
    setCustomTo("");
    setPage(1);
  };

  const controlClass = CONTROL_CLASS;

  return (
    <>
      <PageMeta title="Nhật ký hệ thống | TAMI ERP" description="Nhật ký hoạt động hệ thống" />
      <PageHeader
        breadcrumb={[{ label: "Dashboard", to: "/dashboard" }, { label: "Nhật ký hệ thống" }]}
        title="Nhật ký hệ thống"      />

      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <div className="relative w-64">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Tìm theo email"
              placeholder="Tìm theo email..."
              value={emailSearch}
              onChange={(event) => setEmailSearch(event.target.value)}
              className={`${controlClass} w-full pl-9`}
            />
          </div>
          <select
            aria-label="Khoảng thời gian"
            value={datePreset}
            onChange={(event) => {
              setDatePreset(event.target.value as DatePreset);
              setPage(1);
            }}
            className={controlClass}
          >
            {DATE_PRESET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {datePreset === "custom" && (
            <>
              <input
                type="date"
                aria-label="Từ ngày"
                value={customFrom}
                onChange={(event) => {
                  setCustomFrom(event.target.value);
                  setPage(1);
                }}
                className={controlClass}
              />
              <span className="text-xs text-gray-400">đến</span>
              <input
                type="date"
                aria-label="Đến ngày"
                value={customTo}
                onChange={(event) => {
                  setCustomTo(event.target.value);
                  setPage(1);
                }}
                className={controlClass}
              />
            </>
          )}
          <select
            aria-label="Lọc theo hành động"
            value={action}
            onChange={(event) => {
              setAction(event.target.value);
              setPage(1);
            }}
            className={controlClass}
          >
            {ACTION_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {isFiltering && (
            <button
              type="button"
              onClick={clearFilters}
              className="cursor-pointer px-1 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Xóa lọc
            </button>
          )}
          <button
            type="button"
            onClick={() => void auditLogs.refetch()}
            aria-label="Tải lại"
            title="Tải lại"
            className="ml-auto inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            <RefreshCw
              className={`h-4 w-4 ${auditLogs.isFetching ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
          </button>
        </div>

        <table className="w-full table-fixed text-left text-sm">
          <colgroup>
            <col className="w-10" />
            <col className="w-[110px]" />
            <col className="w-[14%]" />
            <col className="w-[19%]" />
            <col className="w-[11%]" />
            <col className="w-[13%]" />
            <col />
            <col className="w-[116px]" />
          </colgroup>
          <thead className="bg-gray-50 text-xs font-medium text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
            <tr>
              <th className="py-2.5" />
              <th className="px-3 py-2.5 font-medium">Thời gian</th>
              <th className="px-3 py-2.5 font-medium">Hành động</th>
              <th className="px-3 py-2.5 font-medium">Người thực hiện</th>
              <th className="px-3 py-2.5 font-medium">Vai trò</th>
              <th className="px-3 py-2.5 font-medium">Loại đối tượng</th>
              <th className="px-3 py-2.5 font-medium">Tên đối tượng</th>
              <th className="px-3 py-2.5 font-medium">Kết quả</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.isLoading ? (
              Array.from({ length: 8 }, (_, index) => (
                <tr key={index} className="border-t border-gray-100 dark:border-gray-800">
                  <td colSpan={COLUMN_COUNT} className="px-4 py-3">
                    <div className="h-5 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-4 py-14 text-center">
                  <ScrollText className="mx-auto h-9 w-9 text-gray-300 dark:text-gray-600" />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Không có thao tác nào trong khoảng này.
                  </p>
                </td>
              </tr>
            ) : (
              rows.map((log) => {
                const isExpanded = expandedId === log.id;
                const itemName = log.targetName ?? log.contextName;
                const itemContext =
                  log.targetName && log.contextName ? `${log.contextLabel}: ${log.contextName}` : null;
                return (
                  <Fragment key={log.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      aria-expanded={isExpanded}
                      className={`cursor-pointer border-t border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/40 ${
                        isExpanded ? "bg-gray-50/70 dark:bg-gray-800/30" : ""
                      }`}
                    >
                      <td className="py-2.5 pl-4">
                        <ChevronRight
                          className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          aria-hidden="true"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="text-gray-900 dark:text-gray-100">{formatClock(log.occurredAt)}</div>
                        <div className="text-xs text-gray-400">{formatDay(log.occurredAt)}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <ActionBadge log={log} />
                      </td>
                      <td className="px-3 py-2.5">
                        <div
                          className="truncate text-gray-700 dark:text-gray-300"
                          title={log.actorIdentifier ?? undefined}
                        >
                          {log.actorIdentifier ?? "Không xác định"}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div
                          className="truncate text-gray-600 dark:text-gray-400"
                          title={roleLabel(log.actorRole)}
                        >
                          {roleLabel(log.actorRole)}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="truncate text-gray-700 dark:text-gray-300">
                          {resourceLabelOf(log)}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div
                          className="truncate text-gray-900 dark:text-gray-100"
                          title={itemName ?? undefined}
                        >
                          {itemName ?? "—"}
                        </div>
                        {itemContext && (
                          <div className="truncate text-xs text-gray-400" title={itemContext}>
                            {itemContext}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <ResultIndicator log={log} />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-50/70 dark:bg-gray-800/30">
                        <td colSpan={COLUMN_COUNT} className="px-4 pt-1 pb-4">
                          <LogDetail log={log} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>

        {auditLogs.data && auditLogs.data.total > 0 && (
          <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              totalItems={auditLogs.data.total}
              totalPages={auditLogs.data.totalPages}
              itemLabel="thao tác"
              onPageChange={(next) => {
                setPage(next);
                setExpandedId(null);
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}
