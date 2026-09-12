import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userManagementApi } from "@/api/user-management.api";
import { userManagementKeys } from "@/api/user-management.keys";
import type { UserListParams } from "@/types/user-management";
import type { UserInput } from "@/types/user-management";

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: userManagementKeys.list(params),
    queryFn: () => userManagementApi.list(params),
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
    mutationFn: ({ id, input }: { id: string; input: UserInput }) =>
      userManagementApi.update(id, input),
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
