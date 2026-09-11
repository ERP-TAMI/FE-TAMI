import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Alert, Button, PageHeader, Pagination } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { UserTable } from "@/components/features/user-management/UserTable";
import { UserToolbar } from "@/components/features/user-management/UserToolbar";
import { useUsers } from "@/hooks/useUsers";
import { getApiError } from "@/lib/apiError";
import type { UserAccountStatus, UserListItem, UserRoleCode } from "@/types/user-management";

const PAGE_SIZE = 10;
const emptyUsers: UserListItem[] = [];

export default function UsersPage() {
  const { pathname } = useLocation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState<UserRoleCode | "">("");
  const [status, setStatus] = useState<UserAccountStatus | "">("");
  const [page, setPage] = useState(1);
  const users = useUsers({
    search: debouncedSearch,
    role: role || undefined,
    status: status || undefined,
    page,
    limit: PAGE_SIZE,
  });
  const dashboardPath = pathname.startsWith("/it/")
    ? "/it/dashboard"
    : "/management/dashboard";

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
              <UserTable users={users.data.data} />
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
    </>
  );
}
