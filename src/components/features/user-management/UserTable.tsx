import { Table, type TableColumn } from "@/components/shared/Table";
import type { UserListItem } from "@/types/user-management";
import { UserStatusBadge } from "./UserStatusBadge";

const columns: TableColumn<UserListItem>[] = [
  {
    key: "fullName",
    header: "Họ và tên",
    width: "w-[24%]",
    render: (user) => (
      <span className="font-medium text-gray-900 dark:text-white">{user.fullName}</span>
    ),
  },
  {
    key: "email",
    header: "Email",
    width: "w-[24%]",
    render: (user) => (
      <span className="block truncate" title={user.email}>
        {user.email}
      </span>
    ),
  },
  {
    key: "phone",
    header: "Số điện thoại",
    width: "w-[16%]",
    render: (user) => user.phone ?? <span className="text-gray-400">—</span>,
  },
  {
    key: "role",
    header: "Vai trò",
    width: "w-[20%]",
    render: (user) => user.role?.name ?? <span className="text-gray-400">Chưa phân vai trò</span>,
  },
  {
    key: "status",
    header: "Trạng thái",
    width: "w-[16%]",
    render: (user) => <UserStatusBadge status={user.accountStatus} />,
  },
];

export function UserTable({
  users,
  loading = false,
}: {
  users: UserListItem[];
  loading?: boolean;
}) {
  return (
    <Table
      embedded
      columns={columns}
      rows={users}
      getRowKey={(user) => user.id}
      loading={loading}
      emptyMessage="Không tìm thấy người dùng phù hợp."
    />
  );
}
