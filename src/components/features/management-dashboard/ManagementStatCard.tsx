import type { ReactNode } from "react";

type ManagementStatCardTone = "brand" | "success" | "warning" | "danger" | "neutral";

export type ManagementStatCardProps = {
  label: string;
  value: number;
  helper: string;
  icon: ReactNode;
  tone?: ManagementStatCardTone;
  compact?: boolean;
};

const toneClasses: Record<ManagementStatCardTone, string> = {
  brand: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300",
  success: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-300",
  warning: "bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-200",
  danger: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-300",
  neutral: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

export function ManagementStatCard({
  label,
  value,
  helper,
  icon,
  tone = "neutral",
  compact = false,
}: ManagementStatCardProps) {
  const densityClasses = compact ? "rounded-xl p-4 sm:p-5" : "rounded-2xl p-5 sm:p-6";

  return (
    <article
      className={`shadow-theme-xs border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${densityClasses}`}
    >
      {compact ? (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-theme-sm font-medium text-gray-600 dark:text-gray-300">
                {label}
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                {value.toLocaleString("vi-VN")}
              </p>
            </div>
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}
            >
              <span aria-hidden="true" className="[&>svg]:h-4 [&>svg]:w-4">
                {icon}
              </span>
            </div>
          </div>
          <p className="text-theme-xs mt-2 text-gray-600 dark:text-gray-300">{helper}</p>
        </>
      ) : (
        <>
          <div
            className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${toneClasses[tone]}`}
          >
            <span aria-hidden="true" className="h-5 w-5">
              {icon}
            </span>
          </div>
          <p className="text-theme-sm font-medium text-gray-600 dark:text-gray-300">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            {value.toLocaleString("vi-VN")}
          </p>
          <p className="text-theme-xs mt-2 text-gray-600 dark:text-gray-300">{helper}</p>
        </>
      )}
    </article>
  );
}
