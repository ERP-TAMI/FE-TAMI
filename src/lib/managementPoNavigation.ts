import { managementDashboardMonthSchema } from "@/api/management-dashboard.schema";

const MANAGEMENT_PO_OVERVIEW_PATH = "/management/purchase-orders";

export function getCurrentManagementPoMonth(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}`;
}

export type ManagementPoOverviewContext = {
  month: string;
  page: number;
};

function readMonth(params: URLSearchParams, key: string, fallbackMonth: string): string {
  const result = managementDashboardMonthSchema.safeParse(params.get(key));
  return result.success ? result.data : fallbackMonth;
}

function readPage(params: URLSearchParams, key: string): number {
  const rawPage = params.get(key);
  if (!rawPage || !/^\d+$/.test(rawPage)) return 1;

  const page = Number(rawPage);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function getManagementPoOverviewContext(
  params: URLSearchParams,
  fallbackMonth: string,
): ManagementPoOverviewContext {
  return {
    month: readMonth(params, "month", fallbackMonth),
    page: readPage(params, "page"),
  };
}

export function getManagementPoDetailPath(poId: string, month: string, page: number): string {
  const context = new URLSearchParams({ fromMonth: month, fromPage: String(page) });
  return `${MANAGEMENT_PO_OVERVIEW_PATH}/${encodeURIComponent(poId)}?${context.toString()}`;
}

export function getManagementPoOverviewReturnPath(
  params: URLSearchParams,
  fallbackMonth: string,
): string {
  const context = {
    month: readMonth(params, "fromMonth", fallbackMonth),
    page: readPage(params, "fromPage"),
  };
  const query = new URLSearchParams({ month: context.month, page: String(context.page) });
  return `${MANAGEMENT_PO_OVERVIEW_PATH}?${query.toString()}`;
}
