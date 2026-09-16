import { useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import type { ChangePasswordInput, UpdateProfileInput } from "@/api/auth.api";
import { ChangePasswordForm } from "@/components/features/profile/ChangePasswordForm";
import { ProfileInfoForm } from "@/components/features/profile/ProfileInfoForm";
import { Alert, Button, PageHeader, Toast } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { LockIcon, UserCircleIcon } from "@/icons";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/useToast";
import { getApiError, type ApiError } from "@/lib/apiError";

function getAreaRoot(pathname: string): { label: string; to: string } {
  if (pathname.startsWith("/management/"))
    return { label: "Khu Quản lý", to: "/management/dashboard" };
  if (pathname.startsWith("/it/")) return { label: "Khu IT", to: "/it/dashboard" };
  return { label: "Hệ thống", to: "/dashboard" };
}

function ProfileCard({
  icon,
  title,
  description,
  children,
  className = "",
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-5 sm:px-6 dark:border-gray-800">
        <span className="bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
          {icon}
        </span>
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
          <p className="text-theme-sm mt-1 text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export default function ProfilePage() {
  const { pathname } = useLocation();
  const { profile, updateProfile, changePassword } = useProfile();
  const { toast, showToast, hideToast } = useToast();
  const [profileError, setProfileError] = useState<ApiError>();
  const [passwordError, setPasswordError] = useState<ApiError>();
  const areaRoot = getAreaRoot(pathname);

  const submitProfile = async (input: UpdateProfileInput) => {
    setProfileError(undefined);
    try {
      await updateProfile.mutateAsync(input);
      showToast("Đã cập nhật thông tin cá nhân.");
      return true;
    } catch (error) {
      setProfileError(getApiError(error, "Không thể cập nhật thông tin. Vui lòng thử lại."));
      return false;
    }
  };

  const submitPassword = async (input: ChangePasswordInput) => {
    setPasswordError(undefined);
    try {
      await changePassword.mutateAsync(input);
      showToast("Đổi mật khẩu thành công.");
      return true;
    } catch (error) {
      setPasswordError(
        getApiError(error, "Không thể đổi mật khẩu. Vui lòng thử lại.", {
          CURRENT_PASSWORD_INCORRECT: "Mật khẩu hiện tại không đúng.",
          PASSWORD_REUSE_NOT_ALLOWED: "Mật khẩu mới phải khác mật khẩu hiện tại.",
        }),
      );
      return false;
    }
  };

  return (
    <section aria-labelledby="page-title" className="mx-auto max-w-7xl space-y-6">
      <PageMeta title="Tài khoản của tôi | TAMI ERP" description="Quản lý hồ sơ và mật khẩu" />
      <PageHeader
        title="Tài khoản của tôi"
        breadcrumb={[areaRoot, { label: "Tài khoản của tôi" }]}
      />

      {profile.isPending ? (
        <div
          role="status"
          aria-label="Đang tải thông tin tài khoản"
          className="grid animate-pulse gap-6 lg:grid-cols-12"
        >
          <div className="h-96 rounded-2xl bg-gray-100 lg:col-span-7 dark:bg-gray-800" />
          <div className="h-96 rounded-2xl bg-gray-100 lg:col-span-5 dark:bg-gray-800" />
        </div>
      ) : profile.isError || !profile.data ? (
        <Alert variant="error" title="Không thể tải thông tin tài khoản">
          <span className="mr-3">Vui lòng kiểm tra kết nối và thử lại.</span>
          <Button size="sm" variant="outline" onClick={() => void profile.refetch()}>
            Thử lại
          </Button>
        </Alert>
      ) : (
        <div className="space-y-6">
          <section className="flex flex-col gap-5 rounded-xl border border-gray-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex min-w-0 items-center gap-4">
              <span
                aria-hidden="true"
                className="bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-xl font-semibold"
              >
                {profile.data.fullName.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
                  {profile.data.fullName}
                </h2>
                <p className="text-theme-sm truncate text-gray-500 dark:text-gray-400">
                  {profile.data.email}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {profile.data.roleName}
              </span>
              <span className="bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400 rounded-full px-3 py-1.5 text-xs font-medium">
                Đang hoạt động
              </span>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
            <ProfileCard
              className="lg:col-span-7"
              icon={<UserCircleIcon className="h-5 w-5" />}
              title="Thông tin cá nhân"
              description="Cập nhật thông tin liên hệ của bạn."
            >
              <ProfileInfoForm
                user={profile.data}
                isSubmitting={updateProfile.isPending}
                serverError={profileError}
                onSubmit={submitProfile}
              />
            </ProfileCard>

            <ProfileCard
              className="lg:col-span-5"
              icon={<LockIcon className="h-5 w-5" />}
              title="Bảo mật"
              description="Quản lý mật khẩu đăng nhập tài khoản."
            >
              <ChangePasswordForm
                isSubmitting={changePassword.isPending}
                serverError={passwordError}
                onSubmit={submitPassword}
                onCancel={() => setPasswordError(undefined)}
              />
            </ProfileCard>
          </div>
        </div>
      )}

      <Toast
        open={Boolean(toast)}
        message={toast?.message ?? ""}
        variant={toast?.variant}
        onClose={hideToast}
      />
    </section>
  );
}
