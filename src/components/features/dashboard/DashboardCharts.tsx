import { useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type ChartRow = { key: string; label: string; count: number; color?: string };
type Anchor = { x: number; y: number };

function ChartTooltip({
  id,
  anchor,
  children,
  light = false,
}: {
  id: string;
  anchor: Anchor;
  children: ReactNode;
  light?: boolean;
}) {
  return createPortal(
    <div
      id={id}
      role="tooltip"
      className={`pointer-events-none fixed z-[100] max-w-[240px] rounded-md px-3 py-2 text-sm shadow-lg ${light ? "border border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" : "bg-gray-900 text-white dark:bg-gray-700"}`}
      style={{
        left: Math.max(8, Math.min(anchor.x + 14, window.innerWidth - 248)),
        top: Math.max(8, Math.min(anchor.y + 16, window.innerHeight - 100)),
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

function useChartInteraction() {
  const [active, setActive] = useState<{ key: string; anchor: Anchor } | null>(null);
  return {
    active,
    events: (key: string) => ({
      onMouseEnter: (event: React.MouseEvent) =>
        setActive({ key, anchor: { x: event.clientX, y: event.clientY } }),
      onMouseMove: (event: React.MouseEvent) =>
        setActive({ key, anchor: { x: event.clientX, y: event.clientY } }),
      onMouseLeave: () => setActive(null),
      onFocus: (event: React.FocusEvent<Element>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setActive({
          key,
          anchor: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
        });
      },
      onBlur: () => setActive(null),
      onKeyDown: (event: React.KeyboardEvent) => {
        if (event.key === "Escape") setActive(null);
      },
    }),
  };
}

export function HorizontalCountChart({
  rows,
  label,
  unit,
}: {
  rows: ChartRow[];
  label: string;
  unit: string;
}) {
  const tooltipId = useId();
  const { active, events } = useChartInteraction();
  const selected = rows.find((row) => row.key === active?.key);
  const maxCount = Math.max(1, ...rows.map((row) => row.count));
  return (
    <div>
      <div className="mb-2 grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
        <span>{label}</span>
        <span>Số lượng</span>
      </div>
      <ul className="space-y-1" aria-label={`Phân bố ${label.toLowerCase()}`}>
        {rows.map((row) => {
          const share = (row.count / maxCount) * 100;
          const isActive = active?.key === row.key;
          return (
            <li key={row.key}>
              <button
                type="button"
                className={`focus-visible:outline-brand-500 grid w-full cursor-default grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors duration-150 focus-visible:outline-2 motion-reduce:transition-none ${isActive ? "bg-gray-100 dark:bg-gray-800" : "bg-transparent"}`}
                aria-label={`${row.label}: ${row.count.toLocaleString("vi-VN")} ${unit}`}
                aria-describedby={isActive ? tooltipId : undefined}
                {...events(row.key)}
              >
                <span className="text-sm leading-5 font-medium break-words text-gray-700 dark:text-gray-200">
                  {row.label}
                </span>
                <span className="relative h-8 overflow-hidden rounded-sm bg-gray-200/80 dark:bg-gray-700">
                  <span
                    className={`absolute inset-y-0 left-0 transition-colors duration-150 motion-reduce:transition-none ${isActive ? "bg-brand-500" : "bg-slate-500 dark:bg-slate-500"}`}
                    style={{ width: `${share}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-2.5 text-sm font-semibold text-gray-700 tabular-nums dark:text-white">
                    {row.count.toLocaleString("vi-VN")} {unit}
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 flex items-center px-2.5 text-sm font-semibold text-white tabular-nums"
                    style={{ clipPath: `inset(0 ${100 - share}% 0 0)` }}
                  >
                    {row.count.toLocaleString("vi-VN")} {unit}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {selected && active && (
        <ChartTooltip id={tooltipId} anchor={active.anchor}>
          <span className="block font-medium">{selected.label}</span>
          {selected.count.toLocaleString("vi-VN")} {unit}
        </ChartTooltip>
      )}
    </div>
  );
}

function ringSlice(start: number, end: number) {
  const point = (radius: number, angle: number) =>
    `${120 + radius * Math.sin(angle)},${120 - radius * Math.cos(angle)}`;
  const middle = (start + end) / 2;
  return `M ${point(94, start)} A 94 94 0 0 1 ${point(94, middle)} A 94 94 0 0 1 ${point(94, end)} L ${point(68, end)} A 68 68 0 0 0 ${point(68, middle)} A 68 68 0 0 0 ${point(68, start)} Z`;
}

export function PoStatusDonut({ rows }: { rows: ChartRow[] }) {
  const tooltipId = useId();
  const { active, events } = useChartInteraction();
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const selected = rows.find((row) => row.key === active?.key);
  const segments = rows.map((row, index) => {
    const start = rows.slice(0, index).reduce((sum, item) => sum + item.count, 0);
    return {
      ...row,
      path: total
        ? ringSlice((start / total) * Math.PI * 2, ((start + row.count) / total) * Math.PI * 2)
        : "",
    };
  });
  return (
    <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <svg
        viewBox="0 0 240 240"
        role="group"
        aria-label={`Trạng thái PO, tổng ${total} PO`}
        className="mx-auto w-full max-w-64"
      >
        <circle
          cx="120"
          cy="120"
          r="81"
          fill="none"
          strokeWidth="26"
          className="stroke-gray-100 dark:stroke-gray-800"
        />
        {segments
          .filter((row) => row.count > 0)
          .map((row) => (
            <path
              key={row.key}
              d={row.path}
              fill={row.color}
              strokeWidth="1.5"
              className="cursor-default stroke-white transition-opacity duration-150 focus-visible:outline-none motion-reduce:transition-none dark:stroke-gray-900"
              opacity={active && active.key !== row.key ? 0.25 : 1}
              tabIndex={0}
              role="img"
              aria-label={`${row.label}: ${row.count} PO`}
              aria-describedby={active?.key === row.key ? tooltipId : undefined}
              {...events(row.key)}
            />
          ))}
        <text
          x="120"
          y="117"
          textAnchor="middle"
          className="fill-gray-900 text-[28px] font-semibold dark:fill-white"
        >
          {total.toLocaleString("vi-VN")}
        </text>
        <text
          x="120"
          y="139"
          textAnchor="middle"
          className="fill-gray-500 text-[12px] dark:fill-gray-400"
        >
          PO trong kỳ
        </text>
      </svg>
      <ul className="space-y-1" aria-label="Chú giải trạng thái PO">
        {rows.map((row) => (
          <li key={row.key}>
            <button
              type="button"
              className={`focus-visible:outline-brand-500 flex w-full cursor-default items-center gap-2 rounded-md px-2 py-2 text-left text-sm focus-visible:outline-2 ${active?.key === row.key ? "bg-gray-100 dark:bg-gray-800" : ""}`}
              aria-label={`${row.label}: ${row.count} PO`}
              aria-describedby={active?.key === row.key ? tooltipId : undefined}
              {...events(row.key)}
            >
              <span
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: row.color }}
                aria-hidden="true"
              />
              <span className="text-gray-700 dark:text-gray-200">
                {row.label}:{" "}
                <span className="font-medium tabular-nums">
                  {row.count.toLocaleString("vi-VN")}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {selected && active && (
        <ChartTooltip id={tooltipId} anchor={active.anchor} light>
          <span className="flex items-center gap-2.5">
            <span
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: selected.color }}
              aria-hidden="true"
            />
            <span>{selected.label}</span>
            <strong className="tabular-nums">{selected.count.toLocaleString("vi-VN")}</strong>
          </span>
        </ChartTooltip>
      )}
    </div>
  );
}
