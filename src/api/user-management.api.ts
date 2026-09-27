import apiClient from "@/lib/apiClient";
import type {
  AccountStatusInput,
  AccountStatusResponse,
  CreateUserResponse,
  InvitationResponse,
  PasswordResetResponse,
  UpdateUserInput,
  UserInput,
  UserListParams,
  UserListResponse,
  UpdateUserResponse,
} from "@/types/user-management";
import {
  accountStatusResponseSchema,
  createUserResponseSchema,
  invitationResponseSchema,
  passwordResetResponseSchema,
  updateUserResponseSchema,
  userListResponseSchema,
} from "./user-management.schema";

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
  async create(input: UserInput): Promise<CreateUserResponse> {
    const response = await apiClient.post(resource, input);
    return createUserResponseSchema.parse(response.data);
  },
  async update(id: string, input: UpdateUserInput): Promise<UpdateUserResponse> {
    const response = await apiClient.patch(`${resource}/${id}`, input);
    return updateUserResponseSchema.parse(response.data);
  },
  async resendPasswordSetup(id: string): Promise<InvitationResponse> {
    const response = await apiClient.post(`${resource}/${id}/password-setup-email`, undefined, {
      timeout: 30000,
    });
    return invitationResponseSchema.parse(response.data);
  },
  async updateAccountStatus(id: string, input: AccountStatusInput): Promise<AccountStatusResponse> {
    const response = await apiClient.patch(`${resource}/${id}/account-status`, input);
    return accountStatusResponseSchema.parse(response.data);
  },
  async resetPassword(id: string): Promise<PasswordResetResponse> {
    const response = await apiClient.post(`${resource}/${id}/password-reset`);
    return passwordResetResponseSchema.parse(response.data);
  },
};
