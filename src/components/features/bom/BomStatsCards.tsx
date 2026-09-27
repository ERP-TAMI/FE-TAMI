import {
  Layers,
  Package,
  Clock,
  CheckCircle2,
} from "lucide-react";
import type { BomStats } from "@/types/bom";

export type PeriodMode = "month" | "year" | "dateRange";

interface BomStatsCardsProps {
  stats: BomStats | undefined;
  isLoading: boolean;
  periodMode: PeriodMode;
  onPeriodModeChange: (mode: PeriodMode) => void;
  month: string;
  onMonthChange: (month: string) => void;
  year: string;
  onYearChange: (year: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
}

function formatShortDate(d: string): string {
  if (!d) return "";
  const parts = d.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return d;
}

export function BomStatsCards({
  stats,
  isLoading,
  periodMode,
  onPeriodModeChange,
  month,
  onMonthChange,
  year,
  onYearChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
}: BomStatsCardsProps) {
  const currentYearNum = new Date().getFullYear();
  const availableYears = Array.from({ length: 7 }, (_, i) => currentYearNum - 4 + i);

  // Period label for header
  let periodLabel = "Tháng này";
  let totalSublabel = "tháng này";

  if (periodMode === "month") {
    if (month && month.includes("-")) {
      const [y, m] = month.split("-");
      periodLabel = `Tháng ${m}/${y}`;
      totalSublabel = `tháng ${m}/${y}`;
    } else {
      periodLabel = "Tháng này";
      totalSublabel = "tháng này";
    }
  } else if (periodMode === "year") {
    periodLabel = `Năm ${year || currentYearNum}`;
    totalSublabel = `năm ${year || currentYearNum}`;
  } else if (periodMode === "dateRange") {
    if (startDate && endDate) {
      periodLabel = `Từ ${formatShortDate(startDate)} đến ${formatShortDate(endDate)}`;
    } else if (startDate) {
      periodLabel = `Từ ${formatShortDate(startDate)}`;
    } else if (endDate) {
      periodLabel = `Đến ${formatShortDate(endDate)}`;
    } else {
      periodLabel = "Khung ngày";
    }
    totalSublabel = "giai đoạn này";
  }

  const cards = [
    {
      title: "Tổng NPL",
      value: stats?.total ?? 0,
      sublabel: totalSublabel,
      icon: Layers,
      iconColor: "text-brand-600 dark:text-brand-400",
      iconBg: "bg-brand-50/80 dark:bg-brand-950/40 border border-brand-200/50 dark:border-brand-900/30",
    },
    {
      title: "Nháp",
      value: stats?.draftCount ?? 0,
      sublabel: "bảng",
      icon: Package,
      iconColor: "text-gray-600 dark:text-gray-300",
      iconBg: "bg-gray-100/80 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50",
    },
    {
      title: "Chờ duyệt",
      value: stats?.pendingCount ?? 0,
      sublabel: "bảng",
      icon: Clock,
      iconColor: "text-amber-500 dark:text-amber-400",
      iconBg: "bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/30",
    },
    {
      title: "Đã duyệt",
      value: stats?.approvedCount ?? 0,
      sublabel: "đã duyệt",
      icon: CheckCircle2,
      iconColor: "text-brand-600 dark:text-brand-400",
      iconBg: "bg-brand-50/80 dark:bg-brand-950/40 border border-brand-200/50 dark:border-brand-900/30",
    },
  ];

  return (
    <div className="flex flex-col gap-3.5">
      {/* Header filter bar for period */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            Tổng quan tổng kết
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {periodLabel}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dynamic selector on the left based on periodMode */}
          {periodMode === "month" && (
            <div className="relative">
              <input
                type="month"
                value={month}
                onChange={(e) => onMonthChange(e.target.value)}
                className="w-[146px] rounded-xl border border-gray-200/80 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-xs focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:[color-scheme:dark]"
                aria-label="Chọn tháng thống kê"
              />
            </div>
          )}

          {periodMode === "year" && (
            <div className="relative">
              <select
                value={year}
                onChange={(e) => onYearChange(e.target.value)}
                className="cursor-pointer rounded-xl border border-gray-200/80 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-xs focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
                aria-label="Chọn năm thống kê"
              >
                {availableYears.map((y) => (
                  <option key={y} value={String(y)}>
                    Năm {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          {periodMode === "dateRange" && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                aria-label="Từ ngày"
                className="w-[138px] rounded-xl border border-gray-200/80 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-xs focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:[color-scheme:dark]"
              />
              <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                aria-label="Đến ngày"
                className="w-[138px] rounded-xl border border-gray-200/80 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-xs focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:[color-scheme:dark]"
              />
            </div>
          )}

          {/* Select mode dropdown: Tháng, Năm, Khung ngày */}
          <div className="relative">
            <select
              value={periodMode}
              onChange={(e) => onPeriodModeChange(e.target.value as PeriodMode)}
              aria-label="Chọn loại thời gian"
              className="cursor-pointer rounded-xl border border-gray-200/80 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <option value="month">Tháng</option>
              <option value="year">Năm</option>
              <option value="dateRange">Khung ngày</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-24 animate-pulse rounded-2xl border border-gray-200/80 bg-gray-100 p-4 dark:border-gray-800 dark:bg-gray-800"
              />
            ))
          : cards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs transition-all hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${card.iconBg}`}
                    >
                      <Icon className={`h-6 w-6 ${card.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {card.title}
                      </p>
                      <p className="mt-0.5 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {card.value}
                      </p>
                    </div>
                  </div>
                  <div className="self-end pb-1 text-right">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {card.sublabel}
                    </span>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
