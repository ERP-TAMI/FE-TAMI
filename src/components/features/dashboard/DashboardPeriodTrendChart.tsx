import type {
  DashboardPeriodType,
  DashboardTrendBucket,
  DashboardTrendComparison,
} from "@/types/management-dashboard";

type DashboardPeriodTrendChartProps = {
  items: DashboardTrendBucket[];
  granularity: "day" | "month" | "year";
  periodType: DashboardPeriodType;
  periodStart: string;
  periodEnd: string;
  comparison?: DashboardTrendComparison | null;
};

type TrendPoint = {
  period: string;
  x: number;
  currentValue: number;
  currentY: number;
  previousValue: number | null;
  previousY: number | null;
};

function formatNumber(value: number): string {
  return value.toLocaleString("vi-VN");
}

function formatDay(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function formatTrendLabel(period: string, granularity: "day" | "month" | "year"): string {
  if (granularity === "day") return `${period.slice(8)}/${period.slice(5, 7)}`;
  if (granularity === "month") return `${period.slice(5)}/${period.slice(0, 4)}`;
  return period;
}

function getPeriodStart(period: string, granularity: "day" | "month" | "year"): string {
  if (granularity === "year") return `${period}-01-01`;
  if (granularity === "month") return `${period}-01`;
  return period;
}

function buildLinePath(
  points: TrendPoint[],
  value: (point: TrendPoint) => number | null,
  y: (point: TrendPoint) => number | null,
): string {
  let segmentHasPoint = false;
  return points
    .map((point) => {
      const pointValue = value(point);
      const pointY = y(point);
      if (pointValue === null || pointY === null) {
        segmentHasPoint = false;
        return "";
      }
      const command = segmentHasPoint ? "L" : "M";
      segmentHasPoint = true;
      return `${command} ${point.x} ${pointY}`;
    })
    .filter(Boolean)
    .join(" ");
}

export function DashboardPeriodTrendChart({
  items,
  granularity,
  periodType,
  periodStart,
  periodEnd,
  comparison,
}: DashboardPeriodTrendChartProps) {
  const currentEnd = comparison?.currentEnd ?? periodEnd;
  const visibleItems = items.filter(
    (item) => getPeriodStart(item.period, granularity) <= currentEnd,
  );

  if (visibleItems.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
        Chưa có dữ liệu PO trong kỳ được chọn.
      </p>
    );
  }

  const previousValues = new Map(
    (comparison?.trend ?? []).map((bucket) => [bucket.period, bucket.received]),
  );
  const maxValue = Math.max(
    1,
    ...visibleItems.flatMap((item) => {
      const previous = previousValues.get(item.period);
      return previous === null || previous === undefined
        ? [item.received]
        : [item.received, previous];
    }),
  );
  const chartWidth = 660;
  const step = chartWidth / Math.max(visibleItems.length, 1);
  const chartHeight = 164;
  const bottom = 184;
  const points = visibleItems.map((item, index): TrendPoint => {
    const x = 30 + step * index + step / 2;
    const previousValue = previousValues.get(item.period) ?? null;
    return {
      period: item.period,
      x,
      currentValue: item.received,
      currentY: bottom - (item.received / maxValue) * chartHeight,
      previousValue,
      previousY: previousValue === null ? null : bottom - (previousValue / maxValue) * chartHeight,
    };
  });
  const currentPath = buildLinePath(
    points,
    (point) => point.currentValue,
    (point) => point.currentY,
  );
  const previousPath = buildLinePath(
    points,
    (point) => point.previousValue,
    (point) => point.previousY,
  );
  const gridValues = [0, Math.ceil(maxValue / 2), maxValue];
  const labelEvery = Math.max(1, Math.ceil(points.length / 12));
  const hasComparison = Boolean(comparison);
  const currentLabel =
    periodType === "all"
      ? "Toàn thời gian"
      : `Kỳ đang chọn · ${formatDay(periodStart)} – ${formatDay(currentEnd)}`;
  const previousLabel = comparison
    ? `Kỳ liền trước · ${formatDay(comparison.periodStart)} – ${formatDay(comparison.periodEnd)}`
    : undefined;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-600 dark:text-gray-300">
        <span className="inline-flex items-center gap-2">
          <span className="bg-brand-500 h-0.5 w-4 rounded-full" aria-hidden="true" />
          {currentLabel}
        </span>
        {previousLabel && (
          <span className="inline-flex items-center gap-2">
            <span
              className="h-0 w-4 border-t-2 border-dashed border-gray-500 dark:border-gray-400"
              aria-hidden="true"
            />
            {previousLabel}
          </span>
        )}
      </div>
      <svg
        viewBox="0 0 720 224"
        role="img"
        aria-label={`Biểu đồ PO tiếp nhận theo ${granularity === "day" ? "ngày" : granularity === "month" ? "tháng" : "năm"}`}
        className="h-auto w-full overflow-visible"
        preserveAspectRatio="none"
      >
        {gridValues.map((value, index) => {
          const y = bottom - (value / maxValue) * chartHeight;
          return (
            <g key={`${value}-${index}`}>
              <line
                x1="30"
                x2="690"
                y1={y}
                y2={y}
                stroke="currentColor"
                className="text-gray-200 dark:text-gray-800"
              />
              <text x="25" y={y - 4} textAnchor="end" className="fill-gray-500 text-[10px]">
                {formatNumber(value)}
              </text>
            </g>
          );
        })}
        <path
          d={currentPath}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-brand-500"
        />
        {hasComparison && (
          <path
            d={previousPath}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="6 5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-500 dark:text-gray-400"
          />
        )}
        {points.map((point, index) => (
          <g key={point.period}>
            <circle
              data-testid="trend-current-point"
              cx={point.x}
              cy={point.currentY}
              r="4"
              className="fill-brand-500"
            >
              <title>{`${point.period}: ${formatNumber(point.currentValue)} PO tiếp nhận`}</title>
            </circle>
            {hasComparison && point.previousValue !== null && point.previousY !== null && (
              <circle
                cx={point.x}
                cy={point.previousY}
                r="3.5"
                fill="white"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-500 dark:fill-gray-900 dark:text-gray-400"
              >
                <title>{`${point.period}: ${formatNumber(point.previousValue)} PO tiếp nhận kỳ liền trước`}</title>
              </circle>
            )}
            {(index % labelEvery === 0 || index === points.length - 1) && (
              <text x={point.x} y="210" textAnchor="middle" className="fill-gray-500 text-[10px]">
                {formatTrendLabel(point.period, granularity)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <ul className="sr-only">
        {points.map((point) => (
          <li key={`sr-${point.period}`}>
            {point.period}: {formatNumber(point.currentValue)} PO tiếp nhận
            {hasComparison &&
              (point.previousValue === null
                ? ", kỳ liền trước chưa có dữ liệu"
                : `, ${formatNumber(point.previousValue)} PO tiếp nhận kỳ liền trước`)}
          </li>
        ))}
      </ul>
    </div>
  );
}
