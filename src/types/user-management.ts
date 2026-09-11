export type UserRoleCode = "SA" | "TPKH" | "NVKH" | "RD" | "ACCOUNTING" | "IT";
export type UserAccountStatus = "active" | "locked" | "inactive";

export type UserRole = {
  code: UserRoleCode;
  name: string;
};

export type UserListItem = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole | null;
  accountStatus: UserAccountStatus;
};

export type UserListParams = {
  search?: string;
  role?: UserRoleCode;
  status?: UserAccountStatus;
  page: number;
  limit: number;
};

export type UserListResponse = {
  data: UserListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};
