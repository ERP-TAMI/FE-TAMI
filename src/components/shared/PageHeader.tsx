import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/shared/Button";

type BreadcrumbItem = {
  label: string;
  to?: string;
};

type PageHeaderBack = {
  to: string;
  label: string;
};

type PageHeaderStatTone = "neutral" | "success" | "warning" | "danger";

type PageHeaderStat = {
  label: string;
  value: string | number;
  tone?: PageHeaderStatTone;
};

type PageHeaderAction = {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
};

export type PageHeaderProps = {
  breadcrumb: BreadcrumbItem[];
  /** Omit when a more specific title already renders just below this header
   * (e.g. BomDetailHeader's own name+badges row) — showing both reads as a
   * duplicated title. */
  title?: string;
  description?: string;
  stats?: PageHeaderStat[];
  action?: PageHeaderAction;
  actions?: ReactNode;
  /** A labeled "← back to list" link, rendered on the left in place of the
   * title (for detail pages that don't pass one). */
  back?: PageHeaderBack;
};

const statToneClasses: Record<PageHeaderStatTone, string> = {
  neutral: "text-gray-600 dark:text-gray-300",
  success: "text-success-600 dark:text-success-400",
  warning: "text-warning-600 dark:text-warning-400",
  danger: "text-error-600 dark:text-error-400",
};

export function PageHeader({
  breadcrumb,
  title,
  description,
  stats,
  action,
  actions,
  back,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        {back && (
          <Link
            to={back.to}
            className="inline-flex h-9 w-fit shrink-0 items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white px-3 text-xs font-semibold text-gray-600 shadow-2xs transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {back.label}
          </Link>
        )}
        {title && (
          <div className="flex flex-wrap items-center gap-3">
            <h1 id="page-title" className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h1>
            {stats && stats.length > 0 && (
              <div className="text-theme-xs flex items-center gap-2 rounded-full border border-gray-200/80 bg-gray-100 px-2.5 py-1 font-medium text-gray-500 dark:border-gray-700/80 dark:bg-gray-800/80 dark:text-gray-400">
                {stats.map((stat, index) => (
                  <span key={stat.label} className="flex items-center gap-2">
                    {index > 0 && <span aria-hidden="true">•</span>}
                    <span className={statToneClasses[stat.tone ?? "neutral"]}>
                      {stat.value} {stat.label}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        {description && (
          <p className="text-theme-xs text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <nav
          aria-label="Điều hướng phân cấp"
          className="text-theme-xs flex items-center gap-2 text-gray-500 dark:text-gray-400"
        >
          {breadcrumb.map((item, index) => {
            const isLast = index === breadcrumb.length - 1;
            return (
              <span key={item.label} className="flex items-center gap-2">
                {index > 0 && <span aria-hidden="true">/</span>}
                {isLast ? (
                  <span
                    aria-current="page"
                    className="font-medium text-gray-700 dark:text-gray-200"
                  >
                    {item.label}
                  </span>
                ) : item.to ? (
                  <Link
                    to={item.to}
                    className="cursor-pointer transition-colors duration-150 hover:text-gray-700 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:hover:text-gray-200"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span>{item.label}</span>
                )}
              </span>
            );
          })}
        </nav>
        {actions}
        {action && (
          <Button onClick={action.onClick}>
            {action.icon}
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
