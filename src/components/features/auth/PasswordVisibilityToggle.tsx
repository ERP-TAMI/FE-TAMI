import { EyeCloseIcon, EyeIcon } from "@/icons";

type PasswordVisibilityToggleProps = {
  visible: boolean;
  fieldLabel: string;
  onToggle: () => void;
};

export function PasswordVisibilityToggle({
  visible,
  fieldLabel,
  onToggle,
}: PasswordVisibilityToggleProps) {
  return (
    <button
      type="button"
      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:ring-3 focus:ring-brand-500/20 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
      aria-label={`${visible ? "Ẩn" : "Hiện"} ${fieldLabel}`}
      aria-pressed={visible}
      onClick={onToggle}
    >
      {visible ? (
        <EyeIcon aria-hidden="true" className="h-5 w-5 fill-current" />
      ) : (
        <EyeCloseIcon aria-hidden="true" className="h-5 w-5 fill-current" />
      )}
    </button>
  );
}
