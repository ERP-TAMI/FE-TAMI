export type StageGroupItemSsvCellProps = {
  fieldId: string;
  itemName: string;
  value: string;
  error?: string;
  isEditing: boolean;
  onChange: (value: string) => void;
};

export function StageGroupItemSsvCell({
  fieldId,
  itemName,
  value,
  error,
  isEditing,
  onChange,
}: StageGroupItemSsvCellProps) {
  if (!isEditing) {
    return <span className="font-medium text-gray-900 tabular-nums dark:text-white">{value}</span>;
  }

  const errorId = `stage-group-ssv-${fieldId}-error`;
  return (
    <div className="ml-auto w-28 space-y-1">
      <input
        type="text"
        inputMode="decimal"
        aria-label={`SSV cho ${itemName}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-9 w-full rounded-lg border bg-white px-2 text-right font-medium outline-none focus:ring-3 dark:bg-gray-900 ${
          error
            ? "border-error-500 focus:ring-error-500/10"
            : "focus:border-brand-500 focus:ring-brand-500/10 border-gray-300 dark:border-gray-700"
        }`}
      />
      {error && (
        <span id={errorId} className="text-theme-xs text-error-500 block text-left" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
