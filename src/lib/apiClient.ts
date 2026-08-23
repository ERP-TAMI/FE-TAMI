import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { env } from "@/config/env";
import { useAuthStore } from "@/store/authStore";
import { authResponseSchema } from "@/api/auth.schema";

export const apiClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: env.VITE_API_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

const NO_REFRESH_PATHS = ["/auth/login", "/auth/refresh", "/auth/logout"];

let refreshPromise: Promise<string | null> | null = null;

/**
 * Single-flight session refresh: concurrent 401s share one /auth/refresh call
 * instead of each triggering their own.
 */
export function triggerRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post("/auth/refresh")
      .then((response) => {
        const parsed = authResponseSchema.parse(response.data);
        useAuthStore.getState().setSession(parsed.user, parsed.accessToken);
        return parsed.accessToken;
      })
      .catch(() => {
        useAuthStore.getState().clearSession();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const isNoRefreshPath = NO_REFRESH_PATHS.some((path) => config?.url?.includes(path));

    if (error.response?.status !== 401 || !config || config._retried || isNoRefreshPath) {
      throw error;
    }

    config._retried = true;
    const newToken = await triggerRefresh();
    if (!newToken) {
      throw error;
    }

    config.headers.set("Authorization", `Bearer ${newToken}`);
    return apiClient.request(config);
  },
);

export default apiClient;
