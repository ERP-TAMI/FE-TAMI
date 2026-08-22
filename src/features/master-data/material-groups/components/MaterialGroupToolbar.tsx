import { Input } from "@/components/shared";
import type { MaterialGroupStatus } from "../types/material-group.types";

type MaterialGroupToolbarProps = {
  search: string;
  status?: MaterialGroupStatus;
  onSearchChange: (value: string) => void;
  onStatusChange: (value?: MaterialGroupStatus) => void;
};

const statusFilters: Array<{ label: string; value: MaterialGroupStatus | undefined }> = [
  { label: "Tất cả", value: undefined },
  { label: "Đang hoạt động", value: "active" },
  { label: "Ngừng hoạt động", value: "inactive" },
];

export function MaterialGroupToolbar({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: MaterialGroupToolbarProps) {
  return (
    <header className="border-b border-gray-200 px-4 py-5 sm:px-6 dark:border-gray-800">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Danh sách nhóm vật tư
          </h2>
          <p className="text-theme-sm mt-1 text-gray-500 dark:text-gray-400">
            Tìm kiếm, lọc và quản lý các nhóm vật tư hiện có.
          </p>
        </div>

        <div className="relative w-full lg:w-96">
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
            aria-label="Tìm kiếm nhóm vật tư"
            placeholder="Tìm theo mã hoặc tên nhóm..."
            value={search}
            className="pl-11"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>

      <div
        role="group"
        aria-label="Lọc theo trạng thái"
        className="mt-4 flex w-full overflow-x-auto rounded-lg border border-gray-200 p-1 sm:w-fit dark:border-gray-700"
      >
        {statusFilters.map((filter) => {
          const selected = status === filter.value;
          return (
            <button
              key={filter.label}
              type="button"
              aria-pressed={selected}
              onClick={() => onStatusChange(filter.value)}
              className={`text-theme-xs min-h-9 flex-1 rounded-md px-3 py-2 font-medium whitespace-nowrap transition sm:flex-none ${
                selected
                  ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
