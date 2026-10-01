import { BadgeCheck, PencilLine } from "lucide-react";
import { Button } from "@/components/shared";
import type { AuthUser } from "@/store/authStore";

type ProfileSummaryCardProps = {
  user: AuthUser;
  onEdit: () => void;
};

export function ProfileSummaryCard({ user, onEdit }: ProfileSummaryCardProps) {
  const initial = user.fullName.trim().charAt(0).toLocaleUpperCase("vi-VN") || "?";

  return (
    <section
      aria-label="Tóm tắt tài khoản"
      className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900"
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-brand-500" />
      <div className="flex flex-col gap-6 py-6 pr-6 pl-7 sm:flex-row sm:items-center sm:justify-between sm:py-8 sm:pr-8">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-brand-50 text-2xl font-semibold text-brand-600 dark:border-gray-800 dark:bg-brand-500/10 dark:text-brand-400">
            <span aria-hidden="true">{initial}</span>
            <span
              aria-hidden="true"
              className="absolute right-0 bottom-0 h-4 w-4 rounded-full border-2 border-white bg-success-500 dark:border-gray-900"
            />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                {user.fullName}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                <BadgeCheck aria-hidden="true" className="h-4 w-4" />
                {user.roleName}
              </span>
            </div>
            <p className="truncate text-base text-gray-600 dark:text-gray-400">{user.email}</p>
            <p className="inline-flex items-center gap-2 text-sm font-medium text-success-700 dark:text-success-400">
              Phiên đăng nhập hiện tại
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onEdit}
          className="min-h-12 w-full cursor-pointer px-5 text-base sm:w-auto"
        >
          <PencilLine aria-hidden="true" className="h-4 w-4" />
          Chỉnh sửa hồ sơ
        </Button>
      </div>
    </section>
  );
}
