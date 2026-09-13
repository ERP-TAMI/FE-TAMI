import { Table, type TableColumn } from "@/components/shared/Table";
import type { UserListItem } from "@/types/user-management";
import { UserStatusBadge } from "./UserStatusBadge";
import { AlertCircle } from "lucide-react";
import type { UserAccountAction } from "./UserAccountActionDialog";
import { UserRowActions } from "./UserRowActions";

function buildColumns(
  onEdit?: (user: UserListItem) => void,
  onResend?: (user: UserListItem) => void,
  canManage?: (user: UserListItem) => boolean,
  canManageAccount?: (user: UserListItem) => boolean,
  onAccountAction?: (user: UserListItem, action: UserAccountAction) => void,
  resendingUserId?: string,
): TableColumn<UserListItem>[] {
  const columns: TableColumn<UserListItem>[] = [
    {
      key: "fullName",
      header: "Họ và tên",
      width: "w-[20%]",
      render: (user) => (
        <span className="font-medium text-gray-900 dark:text-white">{user.fullName}</span>
      ),
    },
    {
      key: "email",
      header: "Email",
      width: "w-[22%]",
      render: (user) => (
        <span className="block truncate" title={user.email}>
          {user.email}
        </span>
      ),
    },
    {
      key: "phone",
      header: "Số điện thoại",
      width: "w-[14%]",
      render: (user) => user.phone ?? <span className="text-gray-400">—</span>,
    },
    {
      key: "role",
      header: "Vai trò",
      width: "w-[18%]",
      render: (user) => user.role?.name ?? <span className="text-gray-400">Chưa phân vai trò</span>,
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "w-[12%]",
      render: (user) => <UserStatusBadge status={user.accountStatus} />,
    },
  ];
  if (onEdit) {
    columns.push({
      key: "actions",
      header: "Thao tác",
      width: "w-[12%]",
      render: (user) =>
        canManage?.(user) === false ? (
          <span className="text-gray-400">—</span>
        ) : (
          <div className="flex min-w-22 items-center gap-2 whitespace-nowrap">
            <button
              type="button"
              className="text-theme-xs text-brand-600 hover:bg-brand-50 focus-visible:ring-brand-500/30 dark:text-brand-400 dark:hover:bg-brand-500/10 rounded-md px-1.5 py-1 font-medium focus:outline-none focus-visible:ring-2"
              onClick={() => onEdit(user)}
            >
              Sửa
            </button>
            {user.passwordSetupRequired && user.passwordSetupEmailStatus === "failed" && (
              <span
                aria-label="Lần gửi email đặt mật khẩu gần nhất thất bại"
                title="Email đặt mật khẩu chưa gửi được. Hãy mở menu thao tác để gửi lại."
                className="text-error-500 dark:text-error-400 inline-flex"
              >
                <AlertCircle aria-hidden="true" className="h-4 w-4" />
              </span>
            )}
            <UserRowActions
              user={user}
              onResend={user.passwordSetupRequired && onResend ? () => onResend(user) : undefined}
              canManageAccount={Boolean(canManageAccount?.(user))}
              onAccountAction={
                onAccountAction ? (action) => onAccountAction(user, action) : undefined
              }
              resending={resendingUserId === user.id}
            />
          </div>
        ),
    });
  }
  return columns;
}

export function UserTable({
  users,
  loading = false,
  onEdit,
  onResend,
  canManage,
  canManageAccount,
  onAccountAction,
  resendingUserId,
}: {
  users: UserListItem[];
  loading?: boolean;
  onEdit?: (user: UserListItem) => void;
  onResend?: (user: UserListItem) => void;
  canManage?: (user: UserListItem) => boolean;
  canManageAccount?: (user: UserListItem) => boolean;
  onAccountAction?: (user: UserListItem, action: UserAccountAction) => void;
  resendingUserId?: string;
}) {
  return (
    <Table
      embedded
      columns={buildColumns(
        onEdit,
        onResend,
        canManage,
        canManageAccount,
        onAccountAction,
        resendingUserId,
      )}
      rows={users}
      getRowKey={(user) => user.id}
      loading={loading}
      emptyMessage="Không tìm thấy người dùng phù hợp."
    />
  );
}
