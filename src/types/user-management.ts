export type UserRoleCode = "SA" | "TPKH" | "NVKH" | "RD" | "ACCOUNTING" | "IT";
export type EditableUserAccountStatus = "active" | "locked" | "inactive";
export type UserAccountStatus = EditableUserAccountStatus | "pending_setup";
export type PasswordSetupEmailStatus = "pending" | "sent" | "failed";

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
  passwordSetupRequired: boolean;
  passwordSetupEmailStatus: PasswordSetupEmailStatus | null;
  passwordSetupEmailAttemptedAt: string | null;
};

export type UserInput = {
  fullName: string;
  email: string;
  phone: string | null;
  roleCode: UserRoleCode;
  accountStatus: EditableUserAccountStatus;
};

export type CreateUserResponse = {
  user: UserListItem;
  invitationStatus: "pending" | "sent" | "failed";
};

export type UpdateUserResponse = {
  user: UserListItem;
  invitationStatus: "pending" | "sent" | "failed" | null;
};

export type InvitationResponse = { invitationStatus: "sent" | "failed" };

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
