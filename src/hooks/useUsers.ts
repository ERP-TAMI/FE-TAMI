import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userManagementApi } from "@/api/user-management.api";
import { userManagementKeys } from "@/api/user-management.keys";
import type { UserListParams, UserListResponse } from "@/types/user-management";
import type { AccountStatusInput, UpdateUserInput, UserInput } from "@/types/user-management";

export function getUserListRefetchInterval(data?: UserListResponse): number | false {
  return data?.data.some(
    (user) =>
      user.passwordSetupEmailStatus === "pending" || user.accountLockEmailStatus === "pending",
  )
    ? 2_000
    : false;
}

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: userManagementKeys.list(params),
    queryFn: () => userManagementApi.list(params),
    refetchInterval: (query) => getUserListRefetchInterval(query.state.data),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UserInput) => userManagementApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userManagementKeys.all }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      userManagementApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userManagementKeys.all }),
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AccountStatusInput }) =>
      userManagementApi.updateAccountStatus(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userManagementKeys.all }),
  });
}

export function useResetUserPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userManagementApi.resetPassword(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userManagementKeys.all }),
  });
}

export function useResendPasswordSetup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userManagementApi.resendPasswordSetup(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userManagementKeys.all }),
  });
}
