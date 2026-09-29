import type { PeriodMode } from "@/components/features/bom/BomStatsCards";

interface BomAggregatePeriodFilterProps {
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

export function BomAggregatePeriodFilter({
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
}: BomAggregatePeriodFilterProps) {
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 7 }, (_, index) => currentYear - 4 + index);

  return (
    <div
      data-testid="aggregate-period-filter"
      role="group"
      aria-label="Thời gian BOM"
      className="flex min-w-0 flex-col gap-1.5"
    >
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
        Thời gian BOM
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {periodMode === "month" && (
          <input
            id="aggregate-month-input"
            data-testid="aggregate-month-input"
            type="month"
            value={month}
            onChange={(event) => onMonthChange(event.target.value)}
            aria-label="Chọn tháng tổng hợp nhu cầu nguyên phụ liệu"
            className="w-[160px] cursor-pointer rounded-xl border border-gray-200/80 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-xs transition-colors hover:border-brand-300 focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:[color-scheme:dark]"
          />
        )}

        {periodMode === "year" && (
          <select
            value={year}
            onChange={(event) => onYearChange(event.target.value)}
            aria-label="Chọn năm thống kê"
            className="cursor-pointer rounded-xl border border-gray-200/80 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-xs transition-colors hover:border-brand-300 focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          >
            {availableYears.map((availableYear) => (
              <option key={availableYear} value={String(availableYear)}>
                Năm {availableYear}
              </option>
            ))}
          </select>
        )}

        {periodMode === "dateRange" && (
          <div className="flex flex-wrap items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(event) => onStartDateChange(event.target.value)}
              aria-label="Từ ngày"
              className="w-[138px] cursor-pointer rounded-xl border border-gray-200/80 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-xs focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:[color-scheme:dark]"
            />
            <span aria-hidden="true" className="text-xs text-gray-400 dark:text-gray-500">
              —
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => onEndDateChange(event.target.value)}
              aria-label="Đến ngày"
              className="w-[138px] cursor-pointer rounded-xl border border-gray-200/80 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-xs focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:[color-scheme:dark]"
            />
          </div>
        )}

        <select
          id="aggregate-period-mode"
          value={periodMode}
          onChange={(event) => onPeriodModeChange(event.target.value as PeriodMode)}
          aria-label="Chọn loại thời gian"
          className="cursor-pointer rounded-xl border border-gray-200/80 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-xs transition-colors hover:bg-gray-50 focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <option value="month">Tháng</option>
          <option value="year">Năm</option>
          <option value="dateRange">Khung ngày</option>
        </select>
      </div>
    </div>
  );
}
