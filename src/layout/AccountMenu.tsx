import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/api/auth.api";
import { canAccessItArea, canAccessManagement, getLandingPath } from "@/lib/areaAccess";
import { useAuthStore } from "@/store/authStore";

export default function AccountMenu({ area }: { area: "management" | "employee" | "it" }) {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  const logout = async () => {
    setSigningOut(true);
    try {
      await authApi.logout();
    } catch {
      // Local sign-out must still complete when the server is unavailable.
    } finally {
      clearSession();
      queryClient.clear();
      navigate("/login", { replace: true });
    }
  };

  if (!user) return null;
  const profilePath =
    area === "management" ? "/management/profile" : area === "it" ? "/it/profile" : "/profile";
  const actionClass =
    "block w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-brand-500 dark:hover:bg-gray-800";
  return (
    <div
      ref={root}
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label="Tài khoản"
        aria-expanded={open}
        aria-controls="account-actions"
        onClick={() => setOpen(!open)}
        className="focus-visible:outline-brand-500 flex items-center gap-2 rounded-lg p-1 text-gray-900 focus-visible:outline-2 dark:text-white"
      >
        <span
          aria-hidden="true"
          className="bg-brand-500 flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold text-white"
        >
          {user.fullName.charAt(0).toUpperCase()}
        </span>
        <span className="hidden max-w-40 truncate text-sm sm:block">{user.fullName}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div
          id="account-actions"
          className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-2 text-gray-700 shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
        >
          <div className="border-b border-gray-200 px-3 py-2 dark:border-gray-800">
            <p className="font-medium break-words">{user.fullName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user.roleName}</p>
          </div>
          <Link className={actionClass} to={profilePath} onClick={() => setOpen(false)}>
            Tài khoản của tôi
          </Link>
          {area === "management" || area === "it" ? (
            <Link className={actionClass} to="/dashboard" onClick={() => setOpen(false)}>
              Vào hệ thống nhân viên
            </Link>
          ) : canAccessItArea(user) ? (
            <Link className={actionClass} to={getLandingPath(user)} onClick={() => setOpen(false)}>
              Về khu IT
            </Link>
          ) : (
            canAccessManagement(user) && (
              <Link
                className={actionClass}
                to="/management/dashboard"
                onClick={() => setOpen(false)}
              >
                Về khu Quản lý
              </Link>
            )
          )}
          <button
            type="button"
            className={actionClass}
            disabled={signingOut}
            onClick={() => void logout()}
          >
            {signingOut ? "Đang đăng xuất…" : "Đăng xuất"}
          </button>
        </div>
      )}
    </div>
  );
}
