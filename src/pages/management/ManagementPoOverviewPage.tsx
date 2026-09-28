import { useMemo, useState } from "react";
import { CalendarDays, ClockAlert, Package, Timer } from "lucide-react";
import { Alert, Button, Input, Pagination, Table } from "@/components/shared";
import type { TableColumn } from "@/components/shared/Table";
import { ManagementStatCard } from "@/components/features/management-dashboard/ManagementStatCard";
import {
  ManagementPoDeadlineLabel,
  ManagementPoSummaryStatusBadge,
} from "@/components/features/management-dashboard/ManagementPoSummaryStatus";
import PageMeta from "@/components/shared/PageMeta";
import { useManagementPurchaseOrdersOverview } from "@/hooks/useManagementDashboard";
import { managementDashboardMonthSchema } from "@/api/management-dashboard.schema";
import type { ManagementPurchaseOrderItem } from "@/types/management-dashboard";
import {
  getVietnamBusinessDate,
  resolveManagementPoSummary,
} from "@/components/features/management-dashboard/managementPoOverviewPresentation";

const PAGE_SIZE = 10;

function getCurrentMonth(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}`;
}

function formatMonth(month: string): string {
  const [year, monthNumber] = month.split("-");
  return `tháng ${monthNumber}/${year}`;
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

function createColumns(today: string): TableColumn<ManagementPurchaseOrderItem>[] {
  return [
    {
      key: "poCode",
      header: "Mã PO",
      width: "w-[16%]",
      render: (item) => (
        <p className="truncate font-semibold text-gray-900 dark:text-white">{item.poCode}</p>
      ),
    },
    {
      key: "customerNameSnapshot",
      header: "Khách hàng",
      width: "w-[19%]",
      render: (item) => <p className="truncate">{item.customerNameSnapshot}</p>,
    },
    {
      key: "receivedDate",
      header: "Ngày nhận",
      width: "w-[14%]",
      render: (item) => formatDate(item.receivedDate),
    },
    {
      key: "deadline",
      header: "Deadline xuất hàng",
      width: "w-[18%]",
      render: (item) => formatDate(item.deadline),
    },
    {
      key: "daysToDeadline",
      header: "Còn/trễ",
      width: "w-[16%]",
      render: (item) => {
        const summary = resolveManagementPoSummary(item, today);
        return (
          <ManagementPoDeadlineLabel
            status={summary.managementStatus}
            daysToDeadline={summary.daysToDeadline}
          />
        );
      },
    },
    {
      key: "managementStatus",
      header: "Trạng thái",
      width: "w-[17%]",
      render: (item) => (
        <ManagementPoSummaryStatusBadge
          status={resolveManagementPoSummary(item, today).managementStatus}
        />
      ),
    },
  ];
}

export default function ManagementPoOverviewPage() {
  const today = getVietnamBusinessDate();
  const columns = useMemo(() => createColumns(today), [today]);
  const [month, setMonth] = useState(getCurrentMonth);
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isPlaceholderData, isError, refetch } =
    useManagementPurchaseOrdersOverview(month, page, PAGE_SIZE);

  return (
    <section className="space-y-6" aria-labelledby="management-po-overview-title">
      <PageMeta title="Tổng quan PO | TAMI ERP" description="Theo dõi PO theo tháng" />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-theme-xs text-brand-500 font-semibold tracking-wide uppercase">
            Quản lý đơn hàng
          </p>
          <h1
            id="management-po-overview-title"
            className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white"
          >
            Tổng quan PO
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            PO có thời gian thực hiện giao với tháng được chọn.
          </p>
        </div>
        <div className="w-full sm:w-56">
          <Input
            label="Tháng xem báo cáo"
            type="month"
            required
            min="0001-01"
            value={month}
            onChange={(event) => {
              const nextMonth = event.currentTarget.value;
              const parsedMonth = managementDashboardMonthSchema.safeParse(nextMonth);
              if (!parsedMonth.success) return;
              setMonth(parsedMonth.data);
              setPage(1);
            }}
            className="cursor-pointer bg-white focus-visible:ring-3 dark:bg-gray-900 dark:[color-scheme:dark]"
          />
        </div>
      </div>

      {isError && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Alert variant="error" title="Không tải được tổng quan PO">
              Kiểm tra kết nối rồi thử tải lại dữ liệu.
            </Alert>
          </div>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => void refetch()}
          >
            Thử lại
          </Button>
        </div>
      )}

      {isLoading ? (
        <div
          role="status"
          aria-label={`Đang tải tổng quan PO ${formatMonth(month)}`}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          <span className="sr-only">Đang tải tổng quan PO {formatMonth(month)}</span>
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              aria-hidden="true"
              className="h-44 animate-pulse rounded-2xl border border-gray-200 bg-white p-5 motion-reduce:animate-none dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-800" />
              <div className="mt-5 h-4 w-32 rounded bg-gray-100 dark:bg-gray-800" />
              <div className="mt-3 h-8 w-16 rounded bg-gray-100 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      ) : (
        data && (
          <>
            {isFetching && isPlaceholderData && (
              <p className="text-theme-xs text-gray-600 dark:text-gray-300" role="status">
                Đang cập nhật danh sách PO; trang hiện tại được giữ trong lúc tải.
              </p>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <ManagementStatCard
                label="Tổng số PO"
                value={data.totalPurchaseOrders}
                helper={`Có thời gian thực hiện giao với ${formatMonth(data.month)}`}
                icon={<Package className="h-5 w-5" />}
                tone="brand"
              />
              <ManagementStatCard
                label="PO trễ hạn"
                value={data.overduePurchaseOrders}
                helper="Chưa Final, chưa hủy và deadline đã qua"
                icon={<ClockAlert className="h-5 w-5" />}
                tone="danger"
              />
              <ManagementStatCard
                label="PO sắp đến hạn"
                value={data.upcomingPurchaseOrders}
                helper="Chưa Final, chưa hủy và còn dưới 7 ngày"
                icon={<Timer className="h-5 w-5" />}
                tone="warning"
              />
            </div>

            <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-col gap-1 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    Danh sách PO giao trong {formatMonth(data.month)}
                  </h2>
                  <p className="text-theme-xs mt-1 text-gray-500 dark:text-gray-400">
                    Cảnh báo deadline tính theo ngày hiện tại.
                  </p>
                </div>
                <span className="text-theme-sm text-gray-600 dark:text-gray-300">
                  {data.totalPurchaseOrders.toLocaleString("vi-VN")} PO
                </span>
              </div>

              {data.totalPurchaseOrders === 0 ? (
                <div className="flex flex-col items-center px-5 py-12 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    <CalendarDays className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="mt-4 font-medium text-gray-900 dark:text-white">
                    Không có PO giao trong {formatMonth(data.month)}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Chọn tháng khác để xem các PO trong kỳ.
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-100 xl:hidden dark:divide-gray-800">
                    {data.items.map((item) => {
                      const summary = resolveManagementPoSummary(item, today);
                      return (
                        <article key={item.id} className="space-y-3 px-5 py-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate font-semibold text-gray-900 dark:text-white">
                                {item.poCode}
                              </h3>
                              <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                                {item.customerNameSnapshot}
                              </p>
                            </div>
                            <ManagementPoSummaryStatusBadge status={summary.managementStatus} />
                          </div>
                          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                            <div>
                              <dt className="text-theme-xs text-gray-500 dark:text-gray-400">
                                Ngày nhận
                              </dt>
                              <dd className="mt-1 font-medium text-gray-800 dark:text-gray-200">
                                {formatDate(item.receivedDate)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-theme-xs text-gray-500 dark:text-gray-400">
                                Deadline
                              </dt>
                              <dd className="mt-1 font-medium text-gray-800 dark:text-gray-200">
                                {formatDate(item.deadline)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-theme-xs text-gray-500 dark:text-gray-400">
                                Còn/trễ
                              </dt>
                              <dd className="mt-1 text-sm">
                                <ManagementPoDeadlineLabel
                                  status={summary.managementStatus}
                                  daysToDeadline={summary.daysToDeadline}
                                />
                              </dd>
                            </div>
                          </dl>
                        </article>
                      );
                    })}
                  </div>
                  <div className="hidden xl:block">
                    <Table
                      columns={columns}
                      rows={data.items}
                      getRowKey={(item) => item.id}
                      emptyMessage="Không có PO ở trang này."
                    />
                  </div>
                  <Pagination
                    page={data.meta.page}
                    pageSize={data.meta.limit}
                    totalItems={data.meta.total}
                    totalPages={data.meta.totalPages}
                    itemLabel="PO"
                    disabled={isPlaceholderData}
                    onPageChange={setPage}
                  />
                </>
              )}
            </section>
          </>
        )
      )}
    </section>
  );
}
