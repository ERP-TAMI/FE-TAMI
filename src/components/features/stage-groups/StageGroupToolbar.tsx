import { Input } from "@/components/shared";
import type { StageGroupStatus } from "@/types/stage-group";

type StageGroupToolbarProps = {
  search: string;
  status: StageGroupStatus | "";
  disabled?: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StageGroupStatus | "") => void;
};

const statusOptions: Array<{ key: StageGroupStatus | ""; label: string }> = [
  { key: "", label: "Tất cả" },
  { key: "active", label: "Đang sử dụng" },
  { key: "inactive", label: "Đã tắt" },
];

export function StageGroupToolbar({
  search,
  status,
  disabled = false,
  onSearchChange,
  onStatusChange,
}: StageGroupToolbarProps) {
  return (
    <header className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        <div className="relative max-w-sm min-w-[220px] flex-1">
          <span className="pointer-events-none absolute top-1/2 left-3.5 z-10 -translate-y-1/2 text-gray-400">
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
          </span>
          <Input
            type="search"
            aria-label="Tìm kiếm nhóm công đoạn"
            placeholder="Tìm theo mã hoặc tên nhóm..."
            value={search}
            disabled={disabled}
            className="border-gray-300 bg-white pl-11 dark:border-gray-600 dark:bg-gray-900"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        <div
          role="group"
          aria-label="Lọc theo trạng thái"
          className="flex items-center rounded-lg border border-gray-200 bg-white p-0.5 dark:border-gray-700 dark:bg-gray-900"
        >
          {statusOptions.map((option) => (
            <button
              key={option.key || "all"}
              type="button"
              disabled={disabled}
              onClick={() => onStatusChange(option.key)}
              className={`text-theme-xs rounded-md px-3 py-1.5 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                status === option.key
                  ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
