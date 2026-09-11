import type { UserAccountStatus } from "@/types/user-management";

const statusConfig: Record<UserAccountStatus, { label: string; className: string }> = {
  active: {
    label: "Đang hoạt động",
    className: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  },
  locked: {
    label: "Bị khóa",
    className: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
  },
  inactive: {
    label: "Vô hiệu hóa",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  },
};

export function UserStatusBadge({ status }: { status: UserAccountStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
