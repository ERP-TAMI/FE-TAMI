import apiClient from "@/lib/apiClient";
import type { UserListParams, UserListResponse } from "@/types/user-management";
import { userListResponseSchema } from "./user-management.schema";

const resource = "/system/users";

export const userManagementApi = {
  async list(filters: UserListParams): Promise<UserListResponse> {
    const params: Record<string, string | number> = {
      page: filters.page,
      limit: filters.limit,
    };
    if (filters.search) params.search = filters.search;
    if (filters.role) params.role = filters.role;
    if (filters.status) params.status = filters.status;

    const response = await apiClient.get<UserListResponse>(resource, { params });
    return userListResponseSchema.parse(response.data);
  },
};
