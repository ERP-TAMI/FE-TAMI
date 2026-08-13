import { forwardRef, useId, type InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, hint, error, className = "", ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="text-theme-sm block font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={`text-theme-sm h-11 w-full rounded-lg border bg-transparent px-4 text-gray-900 transition outline-none placeholder:text-gray-400 focus:ring-3 dark:text-white ${
          error
            ? "border-error-500 focus:border-error-500 focus:ring-error-500/10"
            : "focus:border-brand-500 focus:ring-brand-500/10 border-gray-200 dark:border-gray-700"
        } ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-theme-xs text-error-500" role="alert">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={hintId} className="text-theme-xs text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      )}
    </div>
  );
});
