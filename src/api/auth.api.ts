import apiClient from "@/lib/apiClient";
import type { AuthUser } from "@/store/authStore";
import {
  authResponseSchema,
  authUserSchema,
  passwordResetAcceptedSchema,
  passwordSetupValidationSchema,
} from "./auth.schema";

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export type UpdateProfileInput = {
  fullName: string;
  phone: string | null;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post("/auth/login", { email, password });
    return authResponseSchema.parse(response.data);
  },
  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  },
  async me(): Promise<AuthUser> {
    const response = await apiClient.get("/auth/me");
    return authUserSchema.parse(response.data);
  },
  async updateProfile(input: UpdateProfileInput): Promise<AuthUser> {
    const response = await apiClient.patch("/auth/me", input);
    return authUserSchema.parse(response.data);
  },
  async changePassword(input: ChangePasswordInput): Promise<void> {
    await apiClient.patch("/auth/me/password", input);
  },
  async validatePasswordSetup(token: string): Promise<{ valid: true; expiresAt: string }> {
    const response = await apiClient.post("/auth/password-setup/validate", { token });
    return passwordSetupValidationSchema.parse(response.data);
  },
  async completePasswordSetup(token: string, password: string): Promise<void> {
    await apiClient.post("/auth/password-setup/complete", { token, password });
  },
  async requestPasswordReset(email: string): Promise<{ status: "pending" }> {
    const response = await apiClient.post("/auth/forgot-password", { email });
    return passwordResetAcceptedSchema.parse(response.data);
  },
  async validatePasswordReset(token: string): Promise<{ valid: true; expiresAt: string }> {
    const response = await apiClient.post("/auth/password-reset/validate", { token });
    return passwordSetupValidationSchema.parse(response.data);
  },
  async completePasswordReset(token: string, password: string): Promise<void> {
    await apiClient.post("/auth/password-reset/complete", { token, password });
  },
};
