import { useState } from "react";
import { useLocation } from "react-router-dom";
import type { ChangePasswordInput, UpdateProfileInput } from "@/api/auth.api";
import { ChangePasswordModal } from "@/components/features/profile/ChangePasswordModal";
import { EditProfileModal } from "@/components/features/profile/EditProfileModal";
import { Alert, Button, PageHeader, Toast } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { LockIcon, PencilIcon } from "@/icons";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/useToast";
import { getApiError, type ApiError } from "@/lib/apiError";
import { canManageUsers } from "@/lib/areaAccess";
import { useAuthStore, type AuthUser } from "@/store/authStore";

function getAreaRoot(pathname: string, user: AuthUser | null): { label: string; to?: string } {
  if (pathname.startsWith("/management/"))
    return { label: "Khu Quản lý", to: "/management/dashboard" };
  if (pathname.startsWith("/it/")) {
    return canManageUsers(user)
      ? { label: "Quản trị người dùng", to: "/it/users" }
      : { label: "Khu IT" };
  }
  return { label: "Hệ thống", to: "/dashboard" };
}

export default function ProfilePage() {
  const { pathname } = useLocation();
  const currentUser = useAuthStore((state) => state.user);
  const { profile, updateProfile, changePassword } = useProfile();
  const { toast, showToast, hideToast } = useToast();
  const [profileError, setProfileError] = useState<ApiError>();
  const [passwordError, setPasswordError] = useState<ApiError>();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const areaRoot = getAreaRoot(pathname, currentUser);

  const submitProfile = async (input: UpdateProfileInput) => {
    setProfileError(undefined);
    try {
      await updateProfile.mutateAsync(input);
      showToast("Đã cập nhật thông tin cá nhân thành công.");
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
    <div className="mx-auto max-w-7xl space-y-6">
      <PageMeta title="Tài khoản của tôi | TAMI ERP" description="Quản lý hồ sơ và mật khẩu" />
      <PageHeader
        title="Tài khoản của tôi"
        breadcrumb={[areaRoot, { label: "Tài khoản của tôi" }]}
      />

      {profile.isPending ? (
        <div
          role="status"
          aria-label="Đang tải thông tin tài khoản"
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6"
        >
          <div className="space-y-6 animate-pulse">
            <div className="h-6 w-36 rounded-md bg-gray-200 dark:bg-gray-800" />
            <div className="h-44 rounded-2xl bg-gray-100 dark:bg-gray-800/60" />
            <div className="h-36 rounded-2xl bg-gray-100 dark:bg-gray-800/60" />
            <div className="h-36 rounded-2xl bg-gray-100 dark:bg-gray-800/60" />
          </div>
        </div>
      ) : profile.isError || !profile.data ? (
        <Alert variant="error" title="Không thể tải thông tin tài khoản">
          <span className="mr-3">Vui lòng kiểm tra kết nối và thử lại.</span>
          <Button size="sm" variant="outline" onClick={() => void profile.refetch()}>
            Thử lại
          </Button>
        </Alert>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
            Hồ sơ cá nhân
          </h2>

          <div className="space-y-6">
            {/* Card 1: User Meta & Personal Information */}
            <section
              aria-labelledby="user-info-heading"
              className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
                  <div className="bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-gray-200 text-2xl font-bold shadow-inner dark:border-gray-800">
                    {profile.data.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                      {profile.data.fullName}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                      <span className="text-theme-sm font-medium text-gray-600 dark:text-gray-300">
                        {profile.data.roleName}
                      </span>
                      <span className="hidden h-3.5 w-px bg-gray-300 sm:block dark:bg-gray-700" />
                      <span className="bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium">
                        <span className="bg-success-500 h-1.5 w-1.5 rounded-full" />
                        Đang hoạt động
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileError(undefined);
                      setIsEditProfileOpen(true);
                    }}
                    className="shadow-theme-xs focus:ring-brand-500/20 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-800 focus:ring-3 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                  >
                    <PencilIcon aria-hidden="true" className="h-4 w-4" />
                    <span>Chỉnh sửa</span>
                  </button>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-6 dark:border-gray-800">
                <h3
                  id="user-info-heading"
                  className="mb-5 text-base font-semibold text-gray-800 dark:text-white/90"
                >
                  Thông tin cá nhân
                </h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Họ và tên</p>
                    <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                      {profile.data.fullName}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Số điện thoại</p>
                    <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                      {profile.data.phone || (
                        <span className="text-gray-400 italic">Chưa cập nhật</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Địa chỉ email</p>
                    <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                      {profile.data.email}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Vai trò</p>
                    <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                      {profile.data.roleName}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Card 2: Security */}
            <section
              aria-labelledby="security-heading"
              className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6"
            >
              <h3
                id="security-heading"
                className="mb-5 text-base font-semibold text-gray-800 dark:text-white/90"
              >
                Bảo mật
              </h3>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                    Đổi mật khẩu
                  </h4>
                  <p className="text-theme-xs mt-1 text-gray-500 dark:text-gray-400">
                    Cập nhật mật khẩu định kỳ để bảo vệ tài khoản (tối thiểu 8 ký tự, không trùng mật khẩu cũ).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPasswordError(undefined);
                    setIsChangePasswordOpen(true);
                  }}
                  className="shadow-theme-xs focus:ring-brand-500/20 inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-800 focus:ring-3 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                >
                  <LockIcon aria-hidden="true" className="h-4 w-4" />
                  <span>Đổi mật khẩu</span>
                </button>
              </div>

            </section>
          </div>

          {/* Modal chỉnh sửa thông tin */}
          <EditProfileModal
            open={isEditProfileOpen}
            user={profile.data}
            isSubmitting={updateProfile.isPending}
            serverError={profileError}
            onSubmit={submitProfile}
            onClose={() => {
              setProfileError(undefined);
              setIsEditProfileOpen(false);
            }}
          />

          {/* Modal đổi mật khẩu */}
          <ChangePasswordModal
            open={isChangePasswordOpen}
            isSubmitting={changePassword.isPending}
            serverError={passwordError}
            onSubmit={submitPassword}
            onClose={() => {
              setPasswordError(undefined);
              setIsChangePasswordOpen(false);
            }}
          />
        </div>
      )}

      <Toast
        open={Boolean(toast)}
        message={toast?.message ?? ""}
        variant={toast?.variant}
        onClose={hideToast}
      />
    </div>
  );
}
