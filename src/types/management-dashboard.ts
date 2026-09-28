import type { PoStatus } from "./po";

export type ManagementPurchaseOrderSummaryStatus =
  | "not_completed"
  | "completed"
  | "overdue"
  | "cancelled";

export type ManagementDashboardSummary = {
  month: string;
  totalPurchaseOrders: number;
  completedPurchaseOrders: number;
  overduePurchaseOrders: number;
  activeEmployees: number;
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
