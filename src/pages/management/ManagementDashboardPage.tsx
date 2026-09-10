import { useState } from "react";
import { Alert, Button } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { ManagementStatCard } from "@/components/features/management-dashboard/ManagementStatCard";
import { BoxIconLine, CheckCircleIcon, TimeIcon, UserIcon } from "@/icons";
import { useManagementDashboardSummary } from "@/hooks/useManagementDashboard";

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(month: string): string {
  const [year, monthNumber] = month.split("-");
  return `Tháng ${monthNumber}/${year}`;
}

export default function ManagementDashboardPage() {
  const [month, setMonth] = useState(getCurrentMonth);
  const { data, isLoading, isError, refetch } = useManagementDashboardSummary(month);

  const cards = data
    ? [
        {
          label: "Tổng số PO",
          value: data.totalPurchaseOrders,
          helper: `Đã tiếp nhận trong ${formatMonth(data.month).toLowerCase()}`,
          icon: <BoxIconLine className="h-5 w-5" />,
          tone: "brand" as const,
        },
        {
          label: "PO đã hoàn thành",
          value: data.completedPurchaseOrders,
          helper: `Đã đóng trong nhóm PO ${formatMonth(data.month).toLowerCase()}`,
          icon: <CheckCircleIcon className="h-5 w-5" />,
          tone: "success" as const,
        },
        {
          label: "PO trễ hạn",
          value: data.overduePurchaseOrders,
          helper: "Đang xử lý và có sản phẩm quá hạn",
          icon: <TimeIcon className="h-5 w-5" />,
          tone: "danger" as const,
        },
        {
          label: "Nhân viên đang hoạt động",
          value: data.activeEmployees,
          helper: "Số tài khoản active hiện tại",
          icon: <UserIcon className="h-5 w-5" />,
          tone: "neutral" as const,
        },
      ]
    : [];

  return (
    <section className="space-y-6" aria-labelledby="management-dashboard-title">
      <PageMeta
        title="Dashboard quản lý | TAMI ERP"
        description="Số liệu tổng quan PO và nhân sự TAMI ERP"
      />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-theme-xs text-brand-500 font-semibold tracking-wide uppercase">
            Tổng quan vận hành
          </p>
          <h1
            id="management-dashboard-title"
            className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white"
          >
            Dashboard quản lý
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Theo dõi nhanh tình hình đơn hàng và nhân sự đang hoạt động.
          </p>
        </div>

        <label className="block w-full sm:w-52">
          <span className="text-theme-sm mb-1.5 block font-medium text-gray-700 dark:text-gray-300">
            Tháng báo cáo
          </span>
          <input
            type="month"
            min="0001-01"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="focus:border-brand-500 focus:ring-brand-500/10 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 transition outline-none focus:ring-3 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </label>
      </div>

      {isLoading && (
        <div
          role="status"
          aria-label="Đang tải số liệu dashboard"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <span className="sr-only">Đang tải số liệu dashboard</span>
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              aria-hidden="true"
              className="h-48 animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="h-11 w-11 rounded-xl bg-gray-100 dark:bg-gray-800" />
              <div className="mt-5 h-4 w-28 rounded bg-gray-100 dark:bg-gray-800" />
              <div className="mt-3 h-9 w-16 rounded bg-gray-100 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="space-y-3">
          <Alert variant="error" title="Không thể tải số liệu">
            Đã xảy ra lỗi khi tải dashboard. Vui lòng thử lại.
          </Alert>
          <Button variant="outline" onClick={() => void refetch()}>
            Thử lại
          </Button>
        </div>
      )}

      {!isLoading && !isError && data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <ManagementStatCard key={card.label} {...card} />
          ))}
        </div>
      )}
    </section>
  );
}
