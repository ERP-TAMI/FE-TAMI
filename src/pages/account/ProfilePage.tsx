import { useState } from "react";
import { useLocation } from "react-router-dom";
import { BriefcaseBusiness, LockKeyhole, Mail, Phone, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ChangePasswordInput, UpdateProfileInput } from "@/api/auth.api";
import { ChangePasswordModal } from "@/components/features/profile/ChangePasswordModal";
import { EditProfileModal } from "@/components/features/profile/EditProfileModal";
import { ProfileActivityTab } from "@/components/features/profile/ProfileActivityTab";
import { ProfileSummaryCard } from "@/components/features/profile/ProfileSummaryCard";
import { ProfileTabNavigation, type ProfileTabId } from "@/components/features/profile/ProfileTabNavigation";
import { Alert, Button, PageHeader, Toast } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
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

function ProfileDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        <Icon aria-hidden="true" className="h-6 w-6" />
      </span>
      <div className="min-w-0 pt-1">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-1.5 break-words text-base font-medium text-gray-900 dark:text-gray-100">
          {value}
        </p>
      </div>
    </div>
  );
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
  const [activeTab, setActiveTab] = useState<ProfileTabId>("personal");
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
      <PageMeta
        title="Tài khoản của tôi | TAMI ERP"
        description="Quản lý thông tin cá nhân và thiết lập bảo mật tài khoản."
      />
      <PageHeader breadcrumb={[areaRoot, { label: "Tài khoản của tôi" }]} />

      <header className="space-y-1">
        <p className="text-sm font-semibold tracking-wide text-brand-600 dark:text-brand-400">
          TÀI KHOẢN
        </p>
        <h1 id="page-title" className="text-3xl font-semibold text-gray-900 dark:text-white sm:text-4xl">
          Tài khoản của tôi
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-400">
          Quản lý thông tin cá nhân và thiết lập bảo mật tài khoản.
        </p>
      </header>

      {profile.isPending ? (
        <div
          role="status"
          aria-label="Đang tải thông tin tài khoản"
          aria-busy="true"
          className="space-y-5"
        >
          <div className="h-28 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900" />
          <div className="h-80 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900" />
        </div>
      ) : profile.isError || !profile.data ? (
        <Alert variant="error" title="Không thể tải thông tin tài khoản">
          <div className="flex flex-wrap items-center gap-3">
            <span>Vui lòng kiểm tra kết nối và thử lại.</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void profile.refetch()}
              className="cursor-pointer"
            >
              Thử lại
            </Button>
          </div>
        </Alert>
      ) : (
        <div className="space-y-6">
          <ProfileSummaryCard
            user={profile.data}
            onEdit={() => {
              setProfileError(undefined);
              setIsEditProfileOpen(true);
            }}
          />

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
            <ProfileTabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            <div
              id="profile-tabpanel"
              role="tabpanel"
              aria-labelledby={`profile-tab-${activeTab}`}
              tabIndex={0}
              className="min-h-64 p-6 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-500 sm:p-8"
            >
              {activeTab === "personal" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Thông tin cá nhân
                  </h2>
                  <div className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
                    <ProfileDetail icon={Mail} label="Địa chỉ email" value={profile.data.email} />
                    <ProfileDetail
                      icon={Phone}
                      label="Số điện thoại"
                      value={profile.data.phone?.trim() || "Chưa cập nhật"}
                    />
                    <ProfileDetail
                      icon={BriefcaseBusiness}
                      label="Vai trò"
                      value={profile.data.roleName}
                    />
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Bảo mật tài khoản
                  </h2>
                  <section className="flex flex-col gap-5 rounded-xl border border-gray-200 p-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        <LockKeyhole aria-hidden="true" className="h-6 w-6" />
                      </span>
                      <div>
                        <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                          Mật khẩu
                        </h3>
                        <p className="mt-1 text-base text-gray-500 dark:text-gray-400">
                          Mật khẩu mới cần có từ 8 đến 72 ký tự và khác mật khẩu hiện tại.
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setPasswordError(undefined);
                        setIsChangePasswordOpen(true);
                      }}
                      className="min-h-12 w-full cursor-pointer px-5 text-base text-brand-600 dark:text-brand-400 sm:w-auto"
                    >
                      Đổi mật khẩu
                      <ChevronRight aria-hidden="true" className="h-4 w-4" />
                    </Button>
                  </section>
                </div>
              )}

              {activeTab === "activity" && <ProfileActivityTab user={profile.data} />}
            </div>
          </section>

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
