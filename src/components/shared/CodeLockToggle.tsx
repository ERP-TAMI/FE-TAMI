import { LockIcon, UnlockIcon } from "@/icons";

type CodeLockToggleProps = {
  codeLabel: string;
  isLocked: boolean;
  onToggle: () => void;
};

export function CodeLockToggle({ codeLabel, isLocked, onToggle }: CodeLockToggleProps) {
  return (
    <button
      type="button"
      aria-label={isLocked ? `Mở khóa ${codeLabel}` : `Khóa ${codeLabel}`}
      aria-pressed={!isLocked}
      title={isLocked ? `Mở khóa để sửa ${codeLabel}` : `Khóa ${codeLabel}`}
      onClick={onToggle}
      className={`inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors focus:ring-3 focus:outline-none ${
        isLocked
          ? "text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:ring-gray-400/20 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          : "bg-brand-50 text-brand-500 hover:bg-brand-100 focus:ring-brand-500/20 dark:bg-brand-500/15 dark:text-brand-400"
      }`}
    >
      {isLocked ? (
        <LockIcon className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <UnlockIcon className="h-3.5 w-3.5" aria-hidden="true" />
      )}
    </button>
  );
}
