import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, type ChangePasswordInput, type UpdateProfileInput } from "@/api/auth.api";
import { useAuthStore } from "@/store/authStore";

export const profileKeys = {
  current: ["profile", "current"] as const,
};

export function useProfile() {
  const queryClient = useQueryClient();
  const updateSessionUser = useAuthStore((state) => state.updateUser);

  const profile = useQuery({
    queryKey: profileKeys.current,
    queryFn: authApi.me,
  });

  const updateProfile = useMutation({
    mutationFn: (input: UpdateProfileInput) => authApi.updateProfile(input),
    onSuccess: (user) => {
      queryClient.setQueryData(profileKeys.current, user);
      updateSessionUser(user);
    },
  });

  const changePassword = useMutation({
    mutationFn: (input: ChangePasswordInput) => authApi.changePassword(input),
  });

  return { profile, updateProfile, changePassword };
}
