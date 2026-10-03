import type { ReactNode } from "react";
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
import { DashboardPeriodTrendChart } from "./DashboardPeriodTrendChart";
import { HorizontalCountChart, PoStatusDonut } from "./DashboardCharts";
import type {
  DashboardBomQueueItem,
  DashboardCustomerCount,
  DashboardPeriod,
  DashboardPeriodType,
  DashboardPurchaseOrderQueueItem,
  DashboardStatusCount,
  ManagementDashboardSummary,
} from "@/types/management-dashboard";
import { changeDashboardPeriodType, getDashboardYearOptions } from "@/lib/dashboardDate";

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

const poStatusChartColors: Record<string, string> = {
  draft: "#9ca3af",
  pending_rd: "#f59e0b",
  in_progress: "#465fff",
  closed: "#12b76a",
  cancelled: "#f04438",
};

function formatNumber(value: number): string {
  return value.toLocaleString("vi-VN");
}

function formatDay(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
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

function Panel({ title, children, className, count }: DashboardPanelProps) {
  return (
    <section className={`${panelClass} ${className ?? ""}`} aria-label={title}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
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
  return (
    <HorizontalCountChart
      label="Trạng thái"
      unit="NPL"
      rows={order.map((status) => ({
        key: status,
        label: labels[status] ?? status,
        count: counts.get(status) ?? 0,
      }))}
    />
  );
}

function PurchaseOrderStatusDonut({
  items,
  order,
}: {
  items: DashboardStatusCount[];
  order: string[];
}) {
  const counts = new Map(items.map((item) => [item.status, item.count]));
  return (
    <PoStatusDonut
      rows={order.map((status) => ({
        key: status,
        label: poStatusLabels[status] ?? status,
        count: counts.get(status) ?? 0,
        color: poStatusChartColors[status] ?? "#9ca3af",
      }))}
    />
  );
}

function CustomerBreakdown({ items }: { items: DashboardCustomerCount[] }) {
  if (items.length === 0) return <EmptyState message="Chưa có khách hàng trong kỳ được chọn." />;
  return (
    <HorizontalCountChart
      label="Khách hàng"
      unit="PO"
      rows={items.map((item, index) => ({
        key: `${item.customerName}-${index}`,
        label: item.customerName,
        count: item.count,
      }))}
    />
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
              {type === "upcoming" ? "Hạn PO" : "Hạn sản phẩm"}
            </th>
            <th scope="col" className="pb-3 text-right font-medium">
              {type === "upcoming" ? "SP đang mở" : "SP quá hạn"}
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
  if (items.length === 0) return <EmptyState message="Không có NPL chờ xử lý." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-xs">
        <thead className="text-gray-500 dark:text-gray-400">
          <tr>
            <th scope="col" className="pr-3 pb-3 font-medium">
              Mã NPL
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
                  aria-label={`Mở NPL ${item.bomCode}`}
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
          icon: <ClipboardList />,
          tone: "brand" as const,
        },
        {
          label: "PO hoàn thành",
          value: data.completedPurchaseOrders,
          icon: <CheckCircle2 />,
          tone: "success" as const,
        },
        {
          label: "PO đang xử lý",
          value: data.processingPurchaseOrders,
          icon: <PackageCheck />,
          tone: "neutral" as const,
        },
        {
          label: "PO có sản phẩm quá hạn",
          value: data.overdueProductPurchaseOrders,
          icon: <ClockAlert />,
          tone: "danger" as const,
        },
        {
          label: "PO sắp đến hạn",
          value: data.upcomingProductPurchaseOrders,
          icon: <CalendarClock />,
          tone: "warning" as const,
        },
        {
          label: "NPL chờ xử lý",
          value: data.pendingBomCount,
          icon: <RotateCw />,
          tone: "brand" as const,
        },
        {
          label: "PO đã hủy",
          value: data.cancelledPurchaseOrders,
          icon: <XCircle />,
          tone: "neutral" as const,
        },
        ...(managementView && data.activeEmployees !== undefined
          ? [
              {
                label: "Nhân viên hoạt động",
                value: data.activeEmployees,
                icon: <UsersRound />,
                tone: "success" as const,
              },
            ]
          : []),
      ]
    : [];

  return (
    <section className="space-y-6" aria-labelledby="dashboard-title" aria-busy={isLoading}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <h1
            id="dashboard-title"
            className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
          >
            {managementView ? "Dashboard quản lý" : "Dashboard"}
          </h1>
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
            <Panel title="PO tiếp nhận" className="xl:col-span-7">
              <DashboardPeriodTrendChart
                items={data.trend}
                granularity={data.trendGranularity}
                periodType={data.periodType}
                periodStart={data.periodStart}
                periodEnd={data.periodEnd}
                comparison={data.comparison}
              />
            </Panel>

            <Panel
              title="Trạng thái PO trong kỳ"
              count={data.purchaseOrderStatuses.reduce((total, row) => total + row.count, 0)}
              className="xl:col-span-5"
            >
              <PurchaseOrderStatusDonut
                items={data.purchaseOrderStatuses}
                order={["in_progress", "pending_rd", "draft", "closed", "cancelled"]}
              />
            </Panel>

            <Panel title="Khách hàng có nhiều PO" className="xl:col-span-6">
              <CustomerBreakdown items={data.topCustomers} />
            </Panel>

            <Panel
              title="Trạng thái NPL"
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
              count={data.upcomingProductPurchaseOrders}
              className="xl:col-span-6"
            >
              <PurchaseOrderQueue
                items={data.upcomingQueue}
                type="upcoming"
                managementView={managementView}
              />
            </Panel>

            <Panel title="NPL chờ xử lý" count={data.pendingBomCount} className="xl:col-span-12">
              <BomQueue items={data.pendingBomQueue} />
            </Panel>
          </div>
        </>
      )}
    </section>
  );
}
