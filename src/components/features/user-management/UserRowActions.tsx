import { useEffect, useRef, useState, type ComponentType, type SVGProps } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircleIcon,
  CloseLineIcon,
  EnvelopeIcon,
  LockIcon,
  MoreDotIcon,
  UnlockIcon,
} from "@/icons";
import type { UserListItem } from "@/types/user-management";
import type { UserAccountAction } from "./UserAccountActionDialog";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type MenuItem = {
  key: string;
  label: string;
  icon: IconComponent;
  danger?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
  onSelect: () => void;
};

function accountMenuItems(
  user: UserListItem,
  onAccountAction: (action: UserAccountAction) => void,
): MenuItem[] {
  const items: MenuItem[] = [];

  if (!user.passwordSetupRequired) {
    items.push({
      key: "reset",
      label: "Đặt lại mật khẩu",
      icon: LockIcon,
      onSelect: () => onAccountAction("reset"),
    });
  }

  if (user.accountStatus === "locked") {
    items.push({
      key: "unlock",
      label: "Mở khóa",
      icon: UnlockIcon,
      separatorBefore: items.length > 0,
      onSelect: () => onAccountAction("unlock"),
    });
    items.push({
      key: "disable",
      label: "Vô hiệu hóa",
      icon: CloseLineIcon,
      danger: true,
      onSelect: () => onAccountAction("disable"),
    });
  } else if (user.accountStatus === "inactive") {
    items.push({
      key: "reactivate",
      label: "Kích hoạt lại",
      icon: CheckCircleIcon,
      separatorBefore: items.length > 0,
      onSelect: () => onAccountAction("reactivate"),
    });
  } else {
    items.push({
      key: "lock",
      label: "Khóa tài khoản",
      icon: LockIcon,
      separatorBefore: items.length > 0,
      onSelect: () => onAccountAction("lock"),
    });
    items.push({
      key: "disable",
      label: "Vô hiệu hóa",
      icon: CloseLineIcon,
      danger: true,
      onSelect: () => onAccountAction("disable"),
    });
  }

  return items;
}

export function UserRowActions({
  user,
  onResend,
  canManageAccount,
  onAccountAction,
  resending,
}: {
  user: UserListItem;
  onResend?: () => void;
  canManageAccount: boolean;
  onAccountAction?: (action: UserAccountAction) => void;
  resending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const items: MenuItem[] = [];
  if (user.passwordSetupRequired && onResend) {
    items.push({
      key: "resend",
      label: resending
        ? "Đang gửi..."
        : user.passwordSetupEmailStatus === null
          ? "Gửi email"
          : "Gửi lại email",
      icon: EnvelopeIcon,
      disabled: resending,
      onSelect: onResend,
    });
  }
  if (canManageAccount && onAccountAction) {
    items.push(
      ...accountMenuItems(user, onAccountAction).map((item, index) => ({
        ...item,
        separatorBefore: item.separatorBefore || (items.length > 0 && index === 0),
      })),
    );
  }

  const closeMenu = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  };

  const openMenu = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const menuWidth = 224;
      const estimatedHeight = items.length * 40 + 16;
      const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
      const showAbove =
        window.innerHeight - rect.bottom < estimatedHeight && rect.top > estimatedHeight;
      setPosition({
        left,
        top: showAbove ? rect.top - estimatedHeight - 6 : rect.bottom + 6,
      });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;

    menuRef.current?.querySelector<HTMLButtonElement>("[role='menuitem']:not(:disabled)")?.focus();

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!buttonRef.current?.contains(target) && !menuRef.current?.contains(target)) closeMenu();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu(true);
    };
    const handleViewportChange = () => closeMenu();

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Mở thao tác cho ${user.fullName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="focus-visible:ring-brand-500/30 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus-visible:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            openMenu();
          }
        }}
      >
        <MoreDotIcon aria-hidden="true" className="h-4 w-4" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={`Thao tác với ${user.fullName}`}
            className="fixed z-[99999] w-56 rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-800"
            style={position}
          >
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className={
                    item.separatorBefore
                      ? "mt-1 border-t border-gray-100 pt-1 dark:border-gray-700"
                      : ""
                  }
                >
                  <button
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    className={`focus-visible:ring-brand-500/30 flex min-h-9 w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 disabled:cursor-wait disabled:opacity-50 ${
                      item.danger
                        ? "text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => {
                      closeMenu();
                      item.onSelect();
                    }}
                  >
                    <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
