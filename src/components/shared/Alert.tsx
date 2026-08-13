import type { ReactNode } from "react";

type AlertVariant = "info" | "success" | "warning" | "error";

export type AlertProps = {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
};

const variantClasses: Record<AlertVariant, string> = {
  info: "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-900/50 dark:bg-brand-900/20 dark:text-brand-200",
  success:
    "border-success-200 bg-success-50 text-success-700 dark:border-success-900/50 dark:bg-success-900/20 dark:text-success-200",
  warning:
    "border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-900/50 dark:bg-warning-900/20 dark:text-warning-200",
  error:
    "border-error-200 bg-error-50 text-error-700 dark:border-error-900/50 dark:bg-error-900/20 dark:text-error-200",
};

export function Alert({ variant = "info", title, children }: AlertProps) {
  return (
    <div
      role="alert"
      className={`text-theme-sm rounded-xl border px-4 py-3 ${variantClasses[variant]}`}
    >
      {title && <p className="font-semibold">{title}</p>}
      <p className={title ? "mt-1" : ""}>{children}</p>
    </div>
  );
}
