import { useQuery } from "@tanstack/react-query";
import { userManagementApi } from "@/api/user-management.api";
import { userManagementKeys } from "@/api/user-management.keys";
import type { UserListParams } from "@/types/user-management";

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: userManagementKeys.list(params),
    queryFn: () => userManagementApi.list(params),
  });
}
