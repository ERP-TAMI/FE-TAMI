import { Search, Users, CircleDot, ShieldCheck, Lock, CircleOff } from "lucide-react";
import { Input, Select } from "@/components/shared";
import type { UserAccountStatus, UserRoleCode } from "@/types/user-management";

type UserToolbarProps = {
  search: string;
  role: UserRoleCode | "";
  status: UserAccountStatus | "";
  onSearchChange: (value: string) => void;
  onRoleChange: (value: UserRoleCode | "") => void;
  onStatusChange: (value: UserAccountStatus | "") => void;
};

const roleOptions = [
  { value: "", label: "Tất cả vai trò" },
  { value: "SA", label: "SA / Giám đốc" },
  { value: "TPKH", label: "TP Kế hoạch" },
  { value: "NVKH", label: "NV Kế hoạch" },
  { value: "RD", label: "R&D" },
  { value: "ACCOUNTING", label: "Kế toán" },
  { value: "IT", label: "IT" },
];

const statusOptions: Array<{
  key: UserAccountStatus | "";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "", label: "Tất cả", icon: CircleDot },
  { key: "active", label: "Hoạt động", icon: ShieldCheck },
  { key: "locked", label: "Bị khóa", icon: Lock },
  { key: "inactive", label: "Vô hiệu hóa", icon: CircleOff },
];

export function UserToolbar({
  search,
  role,
  status,
  onSearchChange,
  onRoleChange,
  onStatusChange,
}: UserToolbarProps) {
  return (
    <header className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3 xl:items-center">
        {/* Search input */}
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3.5 z-10 -translate-y-1/2 text-gray-400">
            <Search className="h-5 w-5" aria-hidden="true" />
          </span>
          <Input
            type="search"
            aria-label="Tìm kiếm người dùng"
            placeholder="Tìm theo họ tên, email, số điện thoại..."
            value={search}
            maxLength={255}
            className="border-gray-300 bg-white pl-11 dark:border-gray-600 dark:bg-gray-900"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        {/* Role filter – select with icon */}
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-gray-400 dark:text-gray-500">
            <Users className="h-4 w-4" aria-hidden="true" />
          </span>
          <Select
            aria-label="Lọc theo vai trò"
            value={role}
            options={roleOptions}
            className="border-gray-300 bg-white pl-9 dark:border-gray-600 dark:bg-gray-900"
            onChange={(event) =>
              onRoleChange(event.target.value as UserRoleCode | "")
            }
          />
        </div>

        {/* Status filter – segmented pill buttons */}
        <div
          role="group"
          aria-label="Lọc theo trạng thái"
          className="flex h-11 items-center rounded-lg border border-gray-300 bg-white p-0.5 dark:border-gray-600 dark:bg-gray-900"
        >
          {statusOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.key || "all"}
                type="button"
                aria-pressed={status === option.key}
                onClick={() => onStatusChange(option.key)}
                className={`text-theme-xs inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md py-1.5 font-medium transition-colors ${
                  status === option.key
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
