import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/shared/Button";

type BreadcrumbItem = {
  label: string;
  to?: string;
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
  title: string;
  stats?: PageHeaderStat[];
  action?: PageHeaderAction;
};

const statToneClasses: Record<PageHeaderStatTone, string> = {
  neutral: "text-gray-600 dark:text-gray-300",
  success: "text-success-600 dark:text-success-400",
  warning: "text-warning-600 dark:text-warning-400",
  danger: "text-error-600 dark:text-error-400",
};

export function PageHeader({ breadcrumb, title, stats, action }: PageHeaderProps) {
  return (
    <>
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
                <span aria-current="page" className="font-medium text-gray-700 dark:text-gray-200">
                  {item.label}
                </span>
              ) : item.to ? (
                <Link to={item.to} className="hover:text-gray-700 dark:hover:text-gray-200">
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
            </span>
          );
        })}
      </nav>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <h1 id="page-title" className="text-title-md font-semibold text-gray-900 dark:text-white">
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
        {action && (
          <Button onClick={action.onClick}>
            {action.icon}
            {action.label}
          </Button>
        )}
      </div>
    </>
  );
}
