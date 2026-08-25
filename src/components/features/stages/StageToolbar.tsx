import { Button, Input } from "@/components/shared";
import type { StageStatus } from "@/types/stage";

type StageToolbarProps = {
  search: string;
  status: StageStatus | "";
  bulkMode: boolean;
  canSaveBulk: boolean;
  isSavingBulk: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StageStatus | "") => void;
  onStartBulk: () => void;
  onSaveBulk: () => void;
  onCancelBulk: () => void;
};

const statusOptions: Array<{ key: StageStatus | ""; label: string }> = [
  { key: "", label: "Tất cả" },
  { key: "active", label: "Đang sử dụng" },
  { key: "inactive", label: "Đã tắt" },
];

export function StageToolbar({
  search,
  status,
  bulkMode,
  canSaveBulk,
  isSavingBulk,
  onSearchChange,
  onStatusChange,
  onStartBulk,
  onSaveBulk,
  onCancelBulk,
}: StageToolbarProps) {
  return (
    <header className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="max-w-sm min-w-[220px] flex-1">
            <Input
              type="search"
              aria-label="Tìm kiếm công đoạn"
              placeholder="Tìm theo mã hoặc tên công đoạn..."
              value={search}
              className="border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
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
                onClick={() => onStatusChange(option.key)}
                className={`text-theme-xs rounded-md px-3 py-1.5 font-medium transition-colors ${
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
        <div className="flex items-center gap-2">
          {bulkMode ? (
            <>
              <Button variant="outline" size="sm" onClick={onCancelBulk}>
                Hủy sửa SSV
              </Button>
              <Button size="sm" loading={isSavingBulk} disabled={!canSaveBulk} onClick={onSaveBulk}>
                Lưu SSV
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={onStartBulk}>
              Sửa SSV
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
