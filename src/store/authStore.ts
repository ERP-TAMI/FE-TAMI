import { create } from "zustand";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  roleCode: string;
  roleName: string;
  permissions: string[];
};

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

type PersistedSession = { user: AuthUser; accessToken: string };

const SESSION_STORAGE_KEY = "tami_session";

/**
 * The access token is intentionally persisted here so a page reload can
 * reuse it directly (decode its `exp`, skip calling the API at all) instead
 * of always hitting /auth/refresh. Trade-off: unlike a memory-only token,
 * this is readable by an XSS-injected script — accepted because the token
 * is short-lived (15 min) and the refresh token stays httpOnly-cookie-only,
 * never touched by JS, so a stolen access token expires quickly and can't
 * be used to mint new ones.
 */
export function readPersistedSession(): PersistedSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedSession;
  } catch {
    return null;
  }
}

function writePersistedSession(session: PersistedSession | null): void {
  try {
    if (session) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // Storage unavailable (e.g. private browsing) — falls back to memory-only.
  }
}

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  setSession: (user: AuthUser, accessToken: string) => void;
  clearSession: () => void;
  setStatus: (status: AuthStatus) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: "idle",
  user: null,
  accessToken: null,
  setSession: (user, accessToken) => {
    writePersistedSession({ user, accessToken });
    set({ user, accessToken, status: "authenticated" });
  },
  clearSession: () => {
    writePersistedSession(null);
    set({ user: null, accessToken: null, status: "unauthenticated" });
  },
  setStatus: (status) => set({ status }),
}));
