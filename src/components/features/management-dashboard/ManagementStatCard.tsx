import type { ReactNode } from "react";

type ManagementStatCardTone = "brand" | "success" | "danger" | "neutral";

export type ManagementStatCardProps = {
  label: string;
  value: number;
  helper: string;
  icon: ReactNode;
  tone?: ManagementStatCardTone;
};

const toneClasses: Record<ManagementStatCardTone, string> = {
  brand: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300",
  success: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-300",
  danger: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-300",
  neutral: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

export function ManagementStatCard({
  label,
  value,
  helper,
  icon,
  tone = "neutral",
}: ManagementStatCardProps) {
  return (
    <article className="shadow-theme-xs rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-gray-900">
      <div
        className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${toneClasses[tone]}`}
      >
        <span aria-hidden="true" className="h-5 w-5">
          {icon}
        </span>
      </div>
      <p className="text-theme-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
        {value.toLocaleString("vi-VN")}
      </p>
      <p className="text-theme-xs mt-2 text-gray-400 dark:text-gray-500">{helper}</p>
    </article>
  );
}
