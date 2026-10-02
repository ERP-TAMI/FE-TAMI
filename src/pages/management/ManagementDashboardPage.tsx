import { useState } from "react";
import PageMeta from "@/components/shared/PageMeta";
import { DashboardSummaryView } from "@/components/features/dashboard/DashboardSummaryView";
import { getCurrentDashboardPeriod } from "@/lib/dashboardDate";
import { useManagementDashboardSummary } from "@/hooks/useManagementDashboard";
import type { DashboardPeriod } from "@/types/management-dashboard";

export default function ManagementDashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>(getCurrentDashboardPeriod);
  const { data, isLoading, isError, refetch } = useManagementDashboardSummary(period);

  return (
    <>
      <PageMeta
        title="Dashboard quản lý | TAMI ERP"
        description="Tổng quan PO, deadline sản phẩm, BOM và nhân sự TAMI ERP"
      />
      <DashboardSummaryView
        period={period}
        onPeriodChange={setPeriod}
        data={data}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        managementView
      />
    </>
  );
}
