import { useState } from "react";
import PageMeta from "@/components/shared/PageMeta";
import { DashboardSummaryView } from "@/components/features/dashboard/DashboardSummaryView";
import { getCurrentDashboardPeriod } from "@/lib/dashboardDate";
import { useDashboardSummary } from "@/hooks/useDashboard";
import type { DashboardPeriod } from "@/types/management-dashboard";

export default function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>(getCurrentDashboardPeriod);
  const { data, isLoading, isError, refetch } = useDashboardSummary(period);

  return (
    <>
      <PageMeta
        title="Dashboard | TAMI ERP"
        description="Tổng quan PO, deadline sản phẩm và tiến độ xử lý BOM TAMI ERP"
      />
      <DashboardSummaryView
        period={period}
        onPeriodChange={setPeriod}
        data={data}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
      />
    </>
  );
}
