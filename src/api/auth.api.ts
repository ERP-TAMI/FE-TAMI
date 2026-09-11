import apiClient from "@/lib/apiClient";
import type { AuthUser } from "@/store/authStore";
import { authResponseSchema, authUserSchema, passwordSetupValidationSchema } from "./auth.schema";

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
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
  async validatePasswordSetup(token: string): Promise<{ valid: true; expiresAt: string }> {
    const response = await apiClient.post("/auth/password-setup/validate", { token });
    return passwordSetupValidationSchema.parse(response.data);
  },
  async completePasswordSetup(token: string, password: string): Promise<void> {
    await apiClient.post("/auth/password-setup/complete", { token, password });
  },
};
