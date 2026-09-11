import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Alert, Button, PageHeader, Pagination, Toast } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { UserTable } from "@/components/features/user-management/UserTable";
import { UserToolbar } from "@/components/features/user-management/UserToolbar";
import { UserForm } from "@/components/features/user-management/UserForm";
import { useCreateUser, useResendPasswordSetup, useUpdateUser, useUsers } from "@/hooks/useUsers";
import { getApiError, type ApiError } from "@/lib/apiError";
import { useToast } from "@/hooks/useToast";
import { useAuthStore } from "@/store/authStore";
import type { UserAccountStatus, UserListItem, UserRoleCode } from "@/types/user-management";
import type { UserInput } from "@/types/user-management";

const PAGE_SIZE = 10;
const emptyUsers: UserListItem[] = [];

export default function UsersPage() {
  const { pathname } = useLocation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState<UserRoleCode | "">("");
  const [status, setStatus] = useState<UserAccountStatus | "">("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<"create" | UserListItem | null>(null);
  const [formError, setFormError] = useState<ApiError>();
  const currentUser = useAuthStore((state) => state.user);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const resend = useResendPasswordSetup();
  const { toast, showToast, hideToast } = useToast();
  const users = useUsers({
    search: debouncedSearch,
    role: role || undefined,
    status: status || undefined,
    page,
    limit: PAGE_SIZE,
  });
  const dashboardPath = pathname.startsWith("/it/") ? "/it/dashboard" : "/management/dashboard";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const changeRole = (value: UserRoleCode | "") => {
    setRole(value);
    setPage(1);
  };

  const changeStatus = (value: UserAccountStatus | "") => {
    setStatus(value);
    setPage(1);
  };

  const canManage = (target: UserListItem) =>
    currentUser?.roleCode === "SA" ||
    target.id === currentUser?.id ||
    !["SA", "IT"].includes(target.role?.code ?? "");

  const submitUser = async (input: UserInput) => {
    setFormError(undefined);
    try {
      if (form === "create") {
        const result = await createUser.mutateAsync(input);
        showToast(
          result.invitationStatus === "sent"
            ? "Đã tạo người dùng và gửi email đặt mật khẩu."
            : "Đã tạo người dùng nhưng chưa gửi được email. Hãy dùng thao tác gửi lại email.",
          result.invitationStatus === "sent" ? "success" : "error",
        );
      } else if (form) {
        const result = await updateUser.mutateAsync({ id: form.id, input });
        showToast(
          result.invitationStatus === "failed"
            ? "Đã cập nhật người dùng nhưng chưa gửi được link mới đến email mới."
            : result.invitationStatus === "sent"
              ? "Đã cập nhật người dùng và gửi link đặt mật khẩu đến email mới."
              : "Đã cập nhật người dùng.",
          result.invitationStatus === "failed" ? "error" : "success",
        );
      }
      setForm(null);
    } catch (error) {
      setFormError(getApiError(error, "Không thể lưu người dùng. Vui lòng thử lại."));
    }
  };

  const resendEmail = async (target: UserListItem) => {
    try {
      const result = await resend.mutateAsync(target.id);
      showToast(
        result.invitationStatus === "sent"
          ? `Đã gửi lại email đặt mật khẩu cho ${target.email}.`
          : `Chưa gửi được email cho ${target.email}. Vui lòng thử lại.`,
        result.invitationStatus === "sent" ? "success" : "error",
      );
    } catch (error) {
      showToast(getApiError(error, "Không thể gửi lại email.").message, "error");
    }
  };

  return (
    <>
      <PageMeta
        title="Quản trị người dùng | TAMI ERP"
        description="Danh sách người dùng TAMI ERP"
      />
      <section aria-labelledby="page-title" className="space-y-4">
        <PageHeader
          breadcrumb={[
            { label: "Dashboard", to: dashboardPath },
            { label: "Hệ thống" },
            { label: "Quản trị người dùng" },
          ]}
          title="Quản trị người dùng"
          stats={users.data ? [{ label: "người dùng", value: users.data.meta.total }] : undefined}
          action={{
            label: "Tạo người dùng",
            onClick: () => {
              setFormError(undefined);
              setForm("create");
            },
          }}
        />

        <div className="shadow-theme-xs overflow-visible rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <UserToolbar
            search={search}
            role={role}
            status={status}
            onSearchChange={setSearch}
            onRoleChange={changeRole}
            onStatusChange={changeStatus}
          />

          {users.isLoading && (
            <div aria-busy="true" aria-label="Đang tải danh sách người dùng">
              <UserTable users={emptyUsers} loading />
            </div>
          )}
          {users.isError && (
            <div className="p-6">
              <Alert variant="error" title="Không thể tải danh sách người dùng">
                {
                  getApiError(users.error, "Không thể kết nối đến máy chủ. Vui lòng thử lại.")
                    .message
                }{" "}
                <Button variant="ghost" size="sm" onClick={() => void users.refetch()}>
                  Thử lại
                </Button>
              </Alert>
            </div>
          )}
          {users.data && (
            <div aria-busy={users.isFetching}>
              <UserTable
                users={users.data.data}
                canManage={canManage}
                onEdit={(target) => {
                  setFormError(undefined);
                  setForm(target);
                }}
                onResend={(target) => void resendEmail(target)}
                resendingUserId={resend.isPending ? resend.variables : undefined}
              />
              <Pagination
                page={page}
                pageSize={users.data.meta.limit}
                totalItems={users.data.meta.total}
                totalPages={users.data.meta.totalPages}
                itemLabel="người dùng"
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </section>
      {form && currentUser && (
        <UserForm
          mode={form === "create" ? "create" : "edit"}
          user={form === "create" ? undefined : form}
          actorRole={currentUser.roleCode}
          actorId={currentUser.id}
          isSubmitting={createUser.isPending || updateUser.isPending}
          serverError={formError}
          onClose={() => setForm(null)}
          onSubmit={(input) => void submitUser(input)}
        />
      )}
      <Toast
        open={Boolean(toast)}
        message={toast?.message ?? ""}
        variant={toast?.variant}
        onClose={hideToast}
      />
    </>
  );
}
