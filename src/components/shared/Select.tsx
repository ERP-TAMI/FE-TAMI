import { forwardRef, useId, type SelectHTMLAttributes } from "react";

export type SelectOption = {
  label: string;
  value: string;
};

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: SelectOption[];
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { id, label, options, error, className = "", ...props },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={selectId}
          className="text-theme-sm block font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        aria-invalid={Boolean(error)}
        className={`text-theme-sm focus:border-brand-500 focus:ring-brand-500/10 h-11 w-full rounded-lg border bg-transparent px-4 text-gray-900 transition outline-none focus:ring-3 dark:border-gray-700 dark:bg-gray-900 dark:text-white ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-theme-xs text-error-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
