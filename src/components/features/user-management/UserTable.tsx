import { Table, type TableColumn } from "@/components/shared/Table";
import type { UserListItem } from "@/types/user-management";
import { UserStatusBadge } from "./UserStatusBadge";
import { AlertCircle } from "lucide-react";

function buildColumns(
  onEdit?: (user: UserListItem) => void,
  onResend?: (user: UserListItem) => void,
  canManage?: (user: UserListItem) => boolean,
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
      width: "w-[14%]",
      render: (user) =>
        canManage?.(user) === false ? (
          <span className="text-gray-400">—</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="text-theme-xs text-brand-600 dark:text-brand-400 hover:underline"
              onClick={() => onEdit(user)}
            >
              Sửa
            </button>
            {user.passwordSetupRequired && onResend && (
              <span className="inline-flex items-center gap-1.5">
                {user.passwordSetupEmailStatus === "failed" && (
                  <span
                    aria-label="Lần gửi email đặt mật khẩu gần nhất thất bại"
                    title="Email đặt mật khẩu chưa gửi được. Hãy thử gửi lại."
                    className="text-error-500 dark:text-error-400 inline-flex"
                  >
                    <AlertCircle aria-hidden="true" className="h-4 w-4" />
                  </span>
                )}
                <button
                  type="button"
                  className="text-theme-xs text-gray-600 hover:underline disabled:cursor-wait disabled:opacity-50 dark:text-gray-300"
                  disabled={resendingUserId === user.id}
                  onClick={() => onResend(user)}
                >
                  {resendingUserId === user.id
                    ? "Đang gửi..."
                    : user.passwordSetupEmailStatus === null
                      ? "Gửi email"
                      : "Gửi lại email"}
                </button>
              </span>
            )}
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
  resendingUserId,
}: {
  users: UserListItem[];
  loading?: boolean;
  onEdit?: (user: UserListItem) => void;
  onResend?: (user: UserListItem) => void;
  canManage?: (user: UserListItem) => boolean;
  resendingUserId?: string;
}) {
  return (
    <Table
      embedded
      columns={buildColumns(onEdit, onResend, canManage, resendingUserId)}
      rows={users}
      getRowKey={(user) => user.id}
      loading={loading}
      emptyMessage="Không tìm thấy người dùng phù hợp."
    />
  );
}
