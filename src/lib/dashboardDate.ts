import type { DashboardPeriod, DashboardPeriodType } from "@/types/management-dashboard";

export type DashboardPeriodBounds = { fromDate: string; toDate: string } | null;

export function getCurrentDashboardPeriod(now = new Date()): DashboardPeriod {
  return { periodType: "month", month: getDashboardMonthAt(now) };
}

export function getDashboardYearOptions(selectedYear: string, now = new Date()): string[] {
  const currentYear = Number(getDashboardMonthAt(now).slice(0, 4));
  const years = new Set(
    Array.from({ length: 10 }, (_, index) => String(currentYear - index)),
  );
  years.add(selectedYear);

  return [...years].sort((left, right) => Number(right) - Number(left));
}

function getDashboardMonthAt(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return `${year}-${month}`;
}

export function getDashboardPeriodBounds(period: DashboardPeriod): DashboardPeriodBounds {
  if (period.periodType === "all") return null;
  if (period.periodType === "range") {
    return { fromDate: period.fromDate, toDate: period.toDate };
  }

  if (period.periodType === "year") {
    return { fromDate: `${period.year}-01-01`, toDate: `${period.year}-12-31` };
  }

  const [year, month] = period.month.split("-").map(Number);
  return {
    fromDate: `${period.month}-01`,
    toDate: `${period.month}-${String(daysInMonth(year, month)).padStart(2, "0")}`,
  };
}

export function changeDashboardPeriodType(
  current: DashboardPeriod,
  nextType: DashboardPeriodType,
): DashboardPeriod {
  if (current.periodType === nextType) return current;
  if (nextType === "all") return { periodType: "all" };
  if (current.periodType === "all") {
    const currentMonth = getDashboardMonthAt(new Date());
    if (nextType === "month") return { periodType: "month", month: currentMonth };
    if (nextType === "year") {
      return { periodType: "year", year: currentMonth.slice(0, 4) };
    }
    const { fromDate, toDate } = getDashboardPeriodBounds({
      periodType: "month",
      month: currentMonth,
    })!;
    return { periodType: "range", fromDate, toDate };
  }
  const currentBounds = getDashboardPeriodBounds(current);
  if (!currentBounds) return getCurrentDashboardPeriod();
  const { fromDate, toDate } = currentBounds;

  if (nextType === "year") return { periodType: "year", year: fromDate.slice(0, 4) };
  if (nextType === "month") return { periodType: "month", month: fromDate.slice(0, 7) };
  return { periodType: "range", fromDate, toDate };
}

export function formatDashboardPeriodLabel(period: DashboardPeriod): string {
  if (period.periodType === "all") return "Toàn thời gian";
  if (period.periodType === "month") {
    if (!period.month) return "Chưa chọn tháng";
    return `Tháng ${period.month.slice(5)}/${period.month.slice(0, 4)}`;
  }
  if (period.periodType === "year") return period.year ? `Năm ${period.year}` : "Chưa chọn năm";
  if (!period.fromDate || !period.toDate) return "Chưa chọn khoảng ngày";
  return `${formatDashboardDate(period.fromDate)} – ${formatDashboardDate(period.toDate)}`;
}

function formatDashboardDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "—";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}
