import type { PoStatus } from "./po";

export type ManagementPurchaseOrderSummaryStatus =
  | "not_completed"
  | "completed"
  | "overdue"
  | "cancelled";

export type DashboardPeriodType = "month" | "year" | "range";

export type DashboardPeriod =
  | { periodType: "month"; month: string }
  | { periodType: "year"; year: string }
  | { periodType: "range"; fromDate: string; toDate: string };

export type ManagementDashboardSummary = {
  periodType: DashboardPeriodType;
  periodStart: string;
  periodEnd: string;
  trendGranularity: "day" | "month" | "year";
  totalPurchaseOrders: number;
  completedPurchaseOrders: number;
  cancelledPurchaseOrders: number;
  processingPurchaseOrders: number;
  overdueProductPurchaseOrders: number;
  upcomingProductPurchaseOrders: number;
  pendingBomCount: number;
  trend: DashboardTrendBucket[];
  purchaseOrderStatuses: DashboardStatusCount[];
  bomRevisionStatuses: DashboardStatusCount[];
  topCustomers: DashboardCustomerCount[];
  overdueQueue: DashboardPurchaseOrderQueueItem[];
  upcomingQueue: DashboardPurchaseOrderQueueItem[];
  pendingBomQueue: DashboardBomQueueItem[];
  activeEmployees?: number;
};

export type ManagementDashboardManagementSummary = ManagementDashboardSummary & {
  activeEmployees: number;
};

export type DashboardTrendBucket = {
  period: string;
  received: number;
  completed: number;
};

export type DashboardStatusCount = {
  status: string;
  count: number;
};

export type DashboardCustomerCount = {
  customerName: string;
  count: number;
};

export type DashboardPurchaseOrderQueueItem = {
  purchaseOrderId: string;
  poCode: string;
  customerName: string;
  deadline: string;
  productCount: number;
};

export type DashboardBomQueueItem = {
  bomId: string;
  bomCode: string;
  productName: string;
  bomType: "fit" | "po";
  status: "wait_nvkh" | "wait_rd" | "wait_tpkh_confirm" | "wait_accounting" | "wait_sa_approve";
  createdAt: string;
};

export type ManagementPurchaseOrderItem = {
  id: string;
  poCode: string;
  customerNameSnapshot: string;
  receivedDate: string;
  deadline: string;
  status: PoStatus;
  managementStatus?: ManagementPurchaseOrderSummaryStatus;
  daysToDeadline?: number;
};

export type ManagementPurchaseOrdersOverview = {
  month: string;
  totalPurchaseOrders: number;
  overduePurchaseOrders: number;
  upcomingPurchaseOrders: number;
  items: ManagementPurchaseOrderItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};
