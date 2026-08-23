import { Input } from "@/components/shared";
import type { MaterialStatus } from "@/types/material";

type UnitToolbarProps = {
  search: string;
  status: MaterialStatus | "";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: MaterialStatus | "") => void;
};

const statusOptions: Array<{ key: MaterialStatus | ""; label: string }> = [
  { key: "", label: "Tất cả" },
  { key: "active", label: "Đang sử dụng" },
  { key: "inactive", label: "Đã tắt" },
];

export function UnitToolbar({ search, status, onSearchChange, onStatusChange }: UnitToolbarProps) {
  return (
    <header className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] max-w-sm flex-1">
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
            aria-label="Tìm kiếm đơn vị tính"
            placeholder="Tìm theo tên đơn vị..."
            value={search}
            className="border-gray-300 bg-white pl-11 dark:border-gray-600 dark:bg-gray-900"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <div
          role="group"
          aria-label="Lọc theo trạng thái"
          className="flex items-center rounded-lg border border-gray-200 bg-white p-0.5 dark:border-gray-700 dark:bg-gray-900"
        >
          {statusOptions.map((option) => {
            const isSelected = status === option.key;
            return (
              <button
                key={option.key || "all"}
                type="button"
                onClick={() => onStatusChange(option.key)}
                className={`text-theme-xs rounded-md px-3 py-1.5 font-medium transition-colors ${
                  isSelected
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
