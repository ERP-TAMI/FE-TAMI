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
    <div className="shadow-theme-xs rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full lg:max-w-md">
          <Input
            type="search"
            aria-label="Tìm kiếm nhóm vật tư"
            placeholder="Tìm theo mã hoặc tên nhóm..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        <div
          role="group"
          aria-label="Lọc theo trạng thái"
          className="flex w-full overflow-x-auto rounded-lg border border-gray-200 p-1 lg:w-auto dark:border-gray-700"
        >
          {statusFilters.map((filter) => {
            const selected = status === filter.value;
            return (
              <button
                key={filter.label}
                type="button"
                aria-pressed={selected}
                onClick={() => onStatusChange(filter.value)}
                className={`text-theme-xs min-h-9 flex-1 rounded-md px-3 py-2 font-medium whitespace-nowrap transition lg:flex-none ${
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
      </div>
    </div>
  );
}
