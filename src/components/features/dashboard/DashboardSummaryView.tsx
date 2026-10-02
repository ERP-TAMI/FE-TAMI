import { useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  History,
  CheckCircle2,
  ClipboardList,
  ClockAlert,
  PackageCheck,
  RotateCw,
  UsersRound,
  XCircle,
} from "lucide-react";
import { Alert, Button, Input, Select } from "@/components/shared";
import { ManagementStatCard } from "@/components/features/management-dashboard/ManagementStatCard";
import type {
  DashboardBomQueueItem,
  DashboardCustomerCount,
  DashboardPeriod,
  DashboardPeriodType,
  DashboardTrendBucket,
  DashboardPurchaseOrderQueueItem,
  DashboardStatusCount,
  ManagementDashboardSummary,
} from "@/types/management-dashboard";
import {
  changeDashboardPeriodType,
  formatDashboardPeriodLabel,
  getDashboardYearOptions,
} from "@/lib/dashboardDate";

type DashboardSummaryViewProps = {
  period: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
  data?: ManagementDashboardSummary;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  managementView?: boolean;
};

type DashboardPanelProps = {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
  count?: number;
};

const panelClass =
  "min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900";

const poStatusLabels: Record<string, string> = {
  draft: "Nháp",
  pending_rd: "Chờ RD",
  in_progress: "Đang xử lý",
  closed: "Hoàn thành",
  cancelled: "Đã hủy",
};

function getRangeEndDateError(period: DashboardPeriod): string | undefined {
  if (period.periodType !== "range") return undefined;
  if (!period.toDate) return "Chọn ngày kết thúc.";
  if (period.fromDate && period.fromDate > period.toDate) {
    return "Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.";
  }
  return undefined;
}

const bomStatusLabels: Record<string, string> = {
  wait_nvkh: "Chờ NVKH",
  wait_rd: "Chờ RD",
  wait_tpkh_confirm: "Chờ TPKH xác nhận",
  wait_accounting: "Chờ kế toán",
  wait_sa_approve: "Chờ SA duyệt",
  closed: "Đã duyệt",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-400",
  pending_rd: "bg-warning-500",
  in_progress: "bg-brand-500",
  closed: "bg-success-500",
  cancelled: "bg-error-500",
  wait_nvkh: "bg-warning-500",
  wait_rd: "bg-brand-500",
  wait_tpkh_confirm: "bg-purple-500",
  wait_accounting: "bg-orange-500",
  wait_sa_approve: "bg-pink-500",
};

function formatNumber(value: number): string {
  return value.toLocaleString("vi-VN");
}

function formatDay(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function formatTrendLabel(period: string, granularity: "day" | "month" | "year"): string {
  if (granularity === "day") return `${period.slice(8)}/${period.slice(5, 7)}`;
  if (granularity === "month") return `${period.slice(5)}/${period.slice(0, 4)}`;
  return period;
}

function formatCreatedAt(date: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(date));
}

function DashboardLoadingState({ managementView }: { managementView: boolean }) {
  const panelPlaceholders = [
    "xl:col-span-7",
    "xl:col-span-5",
    "xl:col-span-6",
    "xl:col-span-6",
    "xl:col-span-6",
    "xl:col-span-6",
    "xl:col-span-12",
  ];

  return (
    <div role="status" aria-label="Đang tải số liệu dashboard" className="space-y-4">
      <span className="sr-only">Đang tải số liệu dashboard</span>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
        {Array.from({ length: managementView ? 8 : 7 }, (_, index) => (
          <div
            key={index}
            data-testid="dashboard-kpi-skeleton"
            className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="h-4 w-32 rounded bg-gray-100 dark:bg-gray-800" />
            <div className="mt-5 h-8 w-20 rounded bg-gray-100 dark:bg-gray-800" />
            <div className="mt-4 h-3 w-3/4 rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12" aria-hidden="true">
        {panelPlaceholders.map((className, index) => (
          <div
            key={index}
            data-testid="dashboard-panel-skeleton"
            className={`${panelClass} ${className} h-72 animate-pulse`}
          >
            <div className="h-5 w-48 max-w-full rounded bg-gray-100 dark:bg-gray-800" />
            <div className="mt-3 h-3 w-2/3 max-w-full rounded bg-gray-100 dark:bg-gray-800" />
            <div className="mt-7 h-40 rounded-xl bg-gray-100 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Panel({ title, description, children, className, count }: DashboardPanelProps) {
  return (
    <section className={`${panelClass} ${className ?? ""}`} aria-label={title}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{description}</p>
        </div>
        {count !== undefined && (
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {formatNumber(count)}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function PeriodTrendChart({
  items,
  granularity,
}: {
  items: DashboardTrendBucket[];
  granularity: "day" | "month" | "year";
}) {
  const { points, maxValue } = useMemo(() => {
    const max = Math.max(1, ...items.flatMap((item) => [item.received, item.completed]));
    const chartWidth = 660;
    const step = chartWidth / Math.max(items.length, 1);
    const chartHeight = 164;
    const bottom = 184;
    return {
      maxValue: max,
      points: items.map((item, index) => {
        const x = 30 + step * index + step / 2;
        return {
          ...item,
          x,
          receivedY: bottom - (item.received / max) * chartHeight,
          completedY: bottom - (item.completed / max) * chartHeight,
          barWidth: Math.min(22, step * 0.38),
        };
      }),
    };
  }, [items]);
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.completedY}`)
    .join(" ");
  const gridValues = [0, Math.ceil(maxValue / 2), maxValue];
  const labelEvery = Math.max(1, Math.ceil(points.length / 12));

  if (items.length === 0) {
    return <EmptyState message="Chưa có dữ liệu PO trong kỳ được chọn." />;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-600 dark:text-gray-300">
        <span className="inline-flex items-center gap-2">
          <span className="bg-brand-500 h-2.5 w-2.5 rounded-sm" aria-hidden="true" />
          PO tiếp nhận
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="bg-success-500 h-0.5 w-4" aria-hidden="true" />
          PO hoàn thành
        </span>
      </div>
      <svg
        viewBox="0 0 720 224"
        role="img"
        aria-label={`Biểu đồ PO tiếp nhận và hoàn thành theo ${granularity === "day" ? "ngày" : granularity === "month" ? "tháng" : "năm"}`}
        className="h-auto w-full overflow-visible"
        preserveAspectRatio="none"
      >
        {gridValues.map((value, index) => {
          const y = 184 - (value / maxValue) * 164;
          return (
            <g key={`${value}-${index}`}>
              <line
                x1="30"
                x2="690"
                y1={y}
                y2={y}
                stroke="currentColor"
                className="text-gray-200 dark:text-gray-800"
              />
              <text x="25" y={y - 4} textAnchor="end" className="fill-gray-500 text-[10px]">
                {formatNumber(value)}
              </text>
            </g>
          );
        })}
        {points.map((point, index) => (
          <g key={point.period}>
            <rect
              x={point.x - point.barWidth / 2}
              y={point.receivedY}
              width={point.barWidth}
              height={184 - point.receivedY}
              rx="3"
              className="fill-brand-500"
            >
              <title>{`${point.period}: ${formatNumber(point.received)} PO tiếp nhận`}</title>
            </rect>
            {(index % labelEvery === 0 || index === points.length - 1) && (
              <text x={point.x} y="210" textAnchor="middle" className="fill-gray-500 text-[10px]">
                {formatTrendLabel(point.period, granularity)}
              </text>
            )}
          </g>
        ))}
        <path
          d={linePath}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-success-500"
        />
        {points.map((point) => (
          <circle
            key={`completed-${point.period}`}
            cx={point.x}
            cy={point.completedY}
            r="3.5"
            className="fill-success-500"
          >
            <title>{`${point.period}: ${formatNumber(point.completed)} PO hoàn thành`}</title>
          </circle>
        ))}
      </svg>
      <ul className="sr-only">
        {points.map((point) => (
          <li key={`sr-${point.period}`}>
            {point.period}: {formatNumber(point.received)} PO tiếp nhận,{" "}
            {formatNumber(point.completed)} PO hoàn thành
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusBreakdown({
  items,
  labels,
  order,
}: {
  items: DashboardStatusCount[];
  labels: Record<string, string>;
  order: string[];
}) {
  const counts = new Map(items.map((item) => [item.status, item.count]));
  const rows = order.map((status) => ({ status, count: counts.get(status) ?? 0 }));
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.status}>
          <div className="mb-1.5 flex items-center justify-between gap-4 text-xs">
            <span className="min-w-0 truncate font-medium text-gray-700 dark:text-gray-300">
              {labels[row.status] ?? row.status}
            </span>
            <span className="shrink-0 text-gray-600 tabular-nums dark:text-gray-400">
              {formatNumber(row.count)}
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
            role="img"
            aria-label={`${labels[row.status] ?? row.status}: ${formatNumber(row.count)}`}
          >
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${statusColors[row.status] ?? "bg-gray-400"}`}
              style={{ width: `${(row.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CustomerBreakdown({ items }: { items: DashboardCustomerCount[] }) {
  if (items.length === 0) return <EmptyState message="Chưa có khách hàng trong kỳ được chọn." />;
  const max = Math.max(1, ...items.map((item) => item.count));
  return (
    <ol className="space-y-4">
      {items.map((item, index) => (
        <li key={`${item.customerName}-${index}`}>
          <div className="mb-1.5 flex items-center justify-between gap-4 text-xs">
            <span className="min-w-0 truncate font-medium text-gray-700 dark:text-gray-300">
              <span className="mr-2 text-gray-500 dark:text-gray-400">{index + 1}.</span>
              {item.customerName}
            </span>
            <span className="shrink-0 font-semibold text-gray-900 tabular-nums dark:text-white">
              {formatNumber(item.count)} PO
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="bg-brand-500 h-full rounded-full"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
      {message}
    </p>
  );
}

function PurchaseOrderQueue({
  items,
  type,
  managementView,
}: {
  items: DashboardPurchaseOrderQueueItem[];
  type: "overdue" | "upcoming";
  managementView: boolean;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        message={
          type === "overdue"
            ? "Không có PO có sản phẩm quá hạn."
            : "Không có PO sắp đến hạn trong 7 ngày tới."
        }
      />
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[460px] text-left text-xs">
        <thead className="text-gray-500 dark:text-gray-400">
          <tr>
            <th scope="col" className="pr-3 pb-3 font-medium">
              Mã PO
            </th>
            <th scope="col" className="pr-3 pb-3 font-medium">
              Khách hàng
            </th>
            <th scope="col" className="pr-3 pb-3 font-medium">
              Hạn gần nhất
            </th>
            <th scope="col" className="pb-3 text-right font-medium">
              Sản phẩm
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {items.map((item) => (
            <tr key={item.purchaseOrderId}>
              <td className="py-3 pr-3">
                <Link
                  to={
                    managementView
                      ? `/management/purchase-orders/${item.purchaseOrderId}`
                      : `/po/${item.purchaseOrderId}`
                  }
                  className="text-brand-600 hover:text-brand-700 focus-visible:outline-brand-500 dark:text-brand-400 dark:hover:text-brand-300 cursor-pointer rounded-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2"
                  aria-label={`Mở đơn hàng ${item.poCode}`}
                >
                  {item.poCode}
                </Link>
              </td>
              <td className="max-w-40 truncate py-3 pr-3 text-gray-700 dark:text-gray-300">
                {item.customerName}
              </td>
              <td
                className={`py-3 pr-3 tabular-nums ${type === "overdue" ? "text-error-600 dark:text-error-400 font-medium" : "text-gray-700 dark:text-gray-300"}`}
              >
                {formatDay(item.deadline)}
              </td>
              <td className="py-3 text-right text-gray-700 tabular-nums dark:text-gray-300">
                {formatNumber(item.productCount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BomQueue({ items }: { items: DashboardBomQueueItem[] }) {
  if (items.length === 0) return <EmptyState message="Không có BOM chờ xử lý." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-xs">
        <thead className="text-gray-500 dark:text-gray-400">
          <tr>
            <th scope="col" className="pr-3 pb-3 font-medium">
              Mã BOM
            </th>
            <th scope="col" className="pr-3 pb-3 font-medium">
              Sản phẩm
            </th>
            <th scope="col" className="pr-3 pb-3 font-medium">
              Loại
            </th>
            <th scope="col" className="pr-3 pb-3 font-medium">
              Trạng thái
            </th>
            <th scope="col" className="pb-3 text-right font-medium">
              Tạo ngày
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {items.map((item) => (
            <tr key={item.bomId}>
              <td className="py-3 pr-3">
                <Link
                  to={`/bom/${item.bomId}`}
                  className="text-brand-600 hover:text-brand-700 focus-visible:outline-brand-500 dark:text-brand-400 dark:hover:text-brand-300 cursor-pointer rounded-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2"
                  aria-label={`Mở BOM ${item.bomCode}`}
                >
                  {item.bomCode}
                </Link>
              </td>
              <td className="max-w-48 truncate py-3 pr-3 text-gray-700 dark:text-gray-300">
                {item.productName}
              </td>
              <td className="py-3 pr-3 text-gray-600 dark:text-gray-400">
                {item.bomType.toUpperCase()}
              </td>
              <td className="py-3 pr-3">
                <span className="bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-300 inline-flex rounded-full px-2 py-1 font-medium whitespace-nowrap">
                  {bomStatusLabels[item.status]}
                </span>
              </td>
              <td className="py-3 text-right text-gray-600 tabular-nums dark:text-gray-400">
                {formatCreatedAt(item.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DashboardSummaryView({
  period,
  onPeriodChange,
  data,
  isLoading,
  isError,
  onRetry,
  managementView = false,
}: DashboardSummaryViewProps) {
  const periodLabel = formatDashboardPeriodLabel(period);
  const periodNoun =
    period.periodType === "month"
      ? "tháng"
      : period.periodType === "year"
        ? "năm"
        : period.periodType === "range"
          ? "khoảng ngày"
          : "toàn bộ thời gian";
  const periodScopeLabel =
    period.periodType === "all" ? "toàn bộ dữ liệu" : `${periodNoun} ${periodLabel}`;
  const monthError =
    period.periodType === "month" && !period.month ? "Chọn tháng tiếp nhận PO." : undefined;
  const yearError =
    period.periodType === "year" && !period.year ? "Chọn năm tiếp nhận PO." : undefined;
  const fromDateError =
    period.periodType === "range" && !period.fromDate ? "Chọn ngày bắt đầu." : undefined;
  const toDateError = getRangeEndDateError(period);
  const periodTypeOptions: { label: string; value: DashboardPeriodType }[] = [
    { label: "Tháng", value: "month" },
    { label: "Năm", value: "year" },
    { label: "Khoảng ngày", value: "range" },
    { label: "Toàn thời gian", value: "all" },
  ];
  const updatePeriod = (key: "month" | "year" | "fromDate" | "toDate", value: string) => {
    if (period.periodType === "month" && key === "month") {
      onPeriodChange({ ...period, month: value });
    }
    if (period.periodType === "year" && key === "year") {
      onPeriodChange({ ...period, year: value });
    }
    if (period.periodType === "range" && (key === "fromDate" || key === "toDate")) {
      onPeriodChange({ ...period, [key]: value });
    }
  };
  const cards = data
    ? [
        {
          label:
            period.periodType === "month"
              ? "Tổng PO tháng"
              : period.periodType === "year"
                ? "Tổng PO năm"
                : period.periodType === "range"
                  ? "Tổng PO trong khoảng ngày"
                  : "Tổng PO",
          value: data.totalPurchaseOrders,
          helper: `Tiếp nhận trong ${periodScopeLabel}, không gồm PO đã hủy`,
          icon: <ClipboardList />,
          tone: "brand" as const,
        },
        {
          label: "PO hoàn thành",
          value: data.completedPurchaseOrders,
          helper: `Đã hoàn thành trong nhóm PO tiếp nhận ${periodScopeLabel}`,
          icon: <CheckCircle2 />,
          tone: "success" as const,
        },
        {
          label: "PO đang xử lý",
          value: data.processingPurchaseOrders,
          helper: `Đang mở trong nhóm PO tiếp nhận ${periodScopeLabel}`,
          icon: <PackageCheck />,
          tone: "neutral" as const,
        },
        {
          label: "PO có sản phẩm quá hạn",
          value: data.overdueProductPurchaseOrders,
          helper: `Nhóm PO tiếp nhận ${periodScopeLabel} có ít nhất một sản phẩm quá hạn`,
          icon: <ClockAlert />,
          tone: "danger" as const,
        },
        {
          label: "PO sắp đến hạn",
          value: data.upcomingProductPurchaseOrders,
          helper: `Trong nhóm PO tiếp nhận ${periodScopeLabel}, có sản phẩm đến hạn 7 ngày tới`,
          icon: <CalendarClock />,
          tone: "warning" as const,
        },
        {
          label: "BOM chờ xử lý",
          value: data.pendingBomCount,
          helper: `Revision được tạo trong ${periodScopeLabel}, hiện đang chờ duyệt`,
          icon: <RotateCw />,
          tone: "brand" as const,
        },
        {
          label: "PO đã hủy",
          value: data.cancelledPurchaseOrders,
          helper: `Tiếp nhận trong ${periodScopeLabel}`,
          icon: <XCircle />,
          tone: "neutral" as const,
        },
        ...(managementView && data.activeEmployees !== undefined
          ? [
              {
                label: "Nhân viên hoạt động",
                value: data.activeEmployees,
                helper: `Tài khoản tạo trong ${periodScopeLabel}, hiện đang hoạt động`,
                icon: <UsersRound />,
                tone: "success" as const,
              },
            ]
          : []),
      ]
    : [];

  return (
    <section className="space-y-6" aria-labelledby="dashboard-title" aria-busy={isLoading}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="text-theme-xs text-brand-600 dark:text-brand-400 font-semibold tracking-wide uppercase">
            Tổng quan vận hành
          </p>
          <h1
            id="dashboard-title"
            className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
          >
            {managementView ? "Dashboard quản lý" : "Dashboard"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
            Theo dõi đơn hàng, hạn sản phẩm và tiến độ xử lý BOM trên toàn hệ thống.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 items-end gap-3 xl:w-auto xl:shrink-0 xl:grid-cols-[10rem_26rem]">
          <Select
            label="Kỳ thống kê"
            options={periodTypeOptions}
            value={period.periodType}
            onChange={(event) =>
              onPeriodChange(
                changeDashboardPeriodType(period, event.target.value as DashboardPeriodType),
              )
            }
            className="cursor-pointer bg-white focus-visible:ring-3 dark:bg-gray-900 dark:focus-visible:ring-3"
          />

          <div className="min-w-0 xl:w-[26rem]">
            {period.periodType === "month" && (
              <Input
                className="cursor-pointer bg-white focus-visible:ring-3 dark:bg-gray-900 dark:[color-scheme:dark]"
                label="Tháng tiếp nhận PO"
                type="month"
                min="0001-01"
                value={period.month}
                onChange={(event) => updatePeriod("month", event.target.value)}
                error={monthError}
              />
            )}
            {period.periodType === "year" && (
              <Select
                className="cursor-pointer bg-white tabular-nums focus-visible:ring-3 dark:bg-gray-900 dark:focus-visible:ring-3"
                label="Năm tiếp nhận PO"
                options={getDashboardYearOptions(period.year).map((year) => ({
                  label: year,
                  value: year,
                }))}
                value={period.year}
                onChange={(event) => updatePeriod("year", event.target.value)}
                error={yearError}
              />
            )}
            {period.periodType === "range" && (
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                <Input
                  label="Từ ngày"
                  type="date"
                  value={period.fromDate}
                  error={fromDateError}
                  onChange={(event) => updatePeriod("fromDate", event.target.value)}
                  className="cursor-pointer bg-white focus-visible:ring-3 dark:bg-gray-900 dark:[color-scheme:dark]"
                />
                <Input
                  label="Đến ngày"
                  type="date"
                  value={period.toDate}
                  error={toDateError}
                  onChange={(event) => updatePeriod("toDate", event.target.value)}
                  className="cursor-pointer bg-white focus-visible:ring-3 dark:bg-gray-900 dark:[color-scheme:dark]"
                />
              </div>
            )}
            {period.periodType === "all" && (
              <div className="space-y-2">
                <p className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Phạm vi
                </p>
                <div
                  aria-label="Phạm vi dữ liệu: từ dữ liệu cũ nhất đến mới nhất"
                  className="flex h-11 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  <History aria-hidden="true" className="size-4 shrink-0" />
                  <span className="truncate">Từ dữ liệu cũ nhất đến mới nhất</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
        <span className="bg-success-500 inline-flex h-2 w-2 rounded-full" aria-hidden="true" />
        <span>
          PO lọc theo ngày tiếp nhận; BOM theo ngày tạo revision trong {periodScopeLabel}. Trạng
          thái và deadline phản ánh tình trạng hiện tại của dữ liệu đã lọc.
        </span>
      </div>

      {isLoading && <DashboardLoadingState managementView={managementView} />}

      {isError && (
        <div className="space-y-3">
          <Alert variant="error" title="Không thể tải số liệu">
            Đã xảy ra lỗi khi tải dashboard. Vui lòng thử lại.
          </Alert>
          <Button
            variant="outline"
            className="cursor-pointer focus-visible:ring-3"
            onClick={onRetry}
          >
            Thử lại
          </Button>
        </div>
      )}

      {!isLoading && !isError && data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <ManagementStatCard key={card.label} {...card} compact />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <Panel
              title={`Xu hướng PO theo ${data.trendGranularity === "day" ? "ngày" : data.trendGranularity === "month" ? "tháng" : "năm"}`}
              description={`PO tiếp nhận trong ${periodScopeLabel}; đường hoàn thành là trạng thái hiện tại của nhóm PO đó`}
              className="xl:col-span-7"
            >
              <PeriodTrendChart items={data.trend} granularity={data.trendGranularity} />
            </Panel>

            <Panel
              title="Trạng thái PO trong kỳ"
              description={`Trạng thái hiện tại của các PO tiếp nhận ${periodScopeLabel}`}
              count={data.purchaseOrderStatuses.reduce((total, row) => total + row.count, 0)}
              className="xl:col-span-5"
            >
              <StatusBreakdown
                items={data.purchaseOrderStatuses}
                labels={poStatusLabels}
                order={["in_progress", "pending_rd", "draft", "closed", "cancelled"]}
              />
            </Panel>

            <Panel
              title="Khách hàng có nhiều PO"
              description={`Xếp theo số PO tiếp nhận ${periodScopeLabel}`}
              className="xl:col-span-6"
            >
              <CustomerBreakdown items={data.topCustomers} />
            </Panel>

            <Panel
              title="Trạng thái revision BOM"
              description={`Trạng thái hiện tại của revision tạo trong ${periodScopeLabel}, không gồm BOM đã ngừng`}
              count={data.bomRevisionStatuses.reduce((total, row) => total + row.count, 0)}
              className="xl:col-span-6"
            >
              <StatusBreakdown
                items={data.bomRevisionStatuses}
                labels={bomStatusLabels}
                order={[
                  "wait_nvkh",
                  "wait_rd",
                  "wait_tpkh_confirm",
                  "wait_accounting",
                  "wait_sa_approve",
                  "closed",
                ]}
              />
            </Panel>

            <Panel
              title="PO có sản phẩm quá hạn"
              description={`Deadline sản phẩm đã qua; PO tiếp nhận ${periodScopeLabel} và sản phẩm chưa đóng hoặc hủy`}
              count={data.overdueProductPurchaseOrders}
              className="xl:col-span-6"
            >
              <PurchaseOrderQueue
                items={data.overdueQueue}
                type="overdue"
                managementView={managementView}
              />
            </Panel>

            <Panel
              title="PO sắp đến hạn"
              description={`PO tiếp nhận ${periodScopeLabel}, có deadline từ hôm nay đến hết 6 ngày tiếp theo`}
              count={data.upcomingProductPurchaseOrders}
              className="xl:col-span-6"
            >
              <PurchaseOrderQueue
                items={data.upcomingQueue}
                type="upcoming"
                managementView={managementView}
              />
            </Panel>

            <Panel
              title="BOM chờ xử lý"
              description={`5 revision tạo trong ${periodScopeLabel} đang chờ lâu nhất`}
              count={data.pendingBomCount}
              className="xl:col-span-12"
            >
              <BomQueue items={data.pendingBomQueue} />
            </Panel>
          </div>
        </>
      )}
    </section>
  );
}
