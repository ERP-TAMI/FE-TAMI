import { useEffect } from "react";
import { triggerRefresh } from "@/lib/apiClient";
import { getJwtExpiryMs } from "@/lib/jwt";
import { useAuthStore, type AuthStatus } from "@/store/authStore";

const REFRESH_MARGIN_MS = 60_000;

/**
 * Restores a session on page load (access tokens live in memory only, so a
 * reload always starts empty) and schedules a proactive refresh shortly
 * before the current access token actually expires.
 */
export function useAuthBootstrap(): AuthStatus {
  const status = useAuthStore((state) => state.status);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setStatus = useAuthStore((state) => state.setStatus);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    triggerRefresh().then((token) => {
      if (!cancelled && !token) {
        setStatus("unauthenticated");
      }
    });

    return () => {
      cancelled = true;
    };
    // Runs once at app startup only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const expiresAtMs = getJwtExpiryMs(accessToken);
    if (!expiresAtMs) {
      return;
    }

    const delay = Math.max(expiresAtMs - Date.now() - REFRESH_MARGIN_MS, 0);
    const timeoutId = window.setTimeout(() => {
      void triggerRefresh();
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [accessToken]);

  return status;
}
