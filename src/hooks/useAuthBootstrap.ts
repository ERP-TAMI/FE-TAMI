import { useEffect } from "react";
import { triggerRefresh } from "@/lib/apiClient";
import { getJwtExpiryMs } from "@/lib/jwt";
import { readPersistedSession, useAuthStore, type AuthStatus } from "@/store/authStore";

const REFRESH_MARGIN_MS = 60_000;

/**
 * Restores a session on page load. If a persisted access token exists and
 * still has more than REFRESH_MARGIN_MS left before it expires, it's reused
 * directly — no API call at all. Only an actually-expired (or missing)
 * token triggers a silent /auth/refresh via the httpOnly refresh cookie.
 * Also (re)schedules a proactive refresh shortly before the current access
 * token's real expiry.
 */
export function useAuthBootstrap(): AuthStatus {
  const status = useAuthStore((state) => state.status);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setStatus = useAuthStore((state) => state.setStatus);
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    let cancelled = false;
    const persisted = readPersistedSession();

    if (!persisted) {
      setStatus("unauthenticated");
      return;
    }

    const expiresAtMs = getJwtExpiryMs(persisted.accessToken);
    const stillValid = expiresAtMs !== null && expiresAtMs - Date.now() > REFRESH_MARGIN_MS;

    if (stillValid) {
      setSession(persisted.user, persisted.accessToken);
      return;
    }

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
