import type { UserListParams } from "@/types/user-management";

export const userManagementKeys = {
  all: ["user-management"] as const,
  list: (params: UserListParams) => [...userManagementKeys.all, "list", params] as const,
};
