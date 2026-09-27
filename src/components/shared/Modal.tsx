import { useId, useLayoutEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

type BackgroundElementState = {
  inert: boolean;
  ariaHidden: string | null;
};

const openModalRoots: HTMLElement[] = [];
const backgroundElementStates = new Map<HTMLElement, BackgroundElementState>();

function restoreBackgroundElements() {
  for (const [element, state] of backgroundElementStates) {
    element.inert = state.inert;

    if (state.ariaHidden === null) {
      element.removeAttribute("aria-hidden");
    } else {
      element.setAttribute("aria-hidden", state.ariaHidden);
    }
  }

  backgroundElementStates.clear();
}

function updateBackgroundIsolation() {
  restoreBackgroundElements();

  const connectedRoots = openModalRoots.filter((root) => root.isConnected);
  openModalRoots.splice(0, openModalRoots.length, ...connectedRoots);

  const activeRoot = connectedRoots.at(-1);
  if (!activeRoot) return;

  for (const child of Array.from(document.body.children)) {
    if (!(child instanceof HTMLElement) || child === activeRoot) continue;

    backgroundElementStates.set(child, {
      inert: child.inert,
      ariaHidden: child.getAttribute("aria-hidden"),
    });
    child.inert = true;
    child.setAttribute("aria-hidden", "true");
  }
}

function registerModal(root: HTMLElement) {
  openModalRoots.push(root);
  updateBackgroundIsolation();
}

function unregisterModal(root: HTMLElement) {
  const index = openModalRoots.lastIndexOf(root);
  if (index >= 0) openModalRoots.splice(index, 1);
  updateBackgroundIsolation();
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hidden && element.getAttribute("aria-hidden") !== "true",
  );
}

export type ModalProps = {
  open: boolean;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  closeDisabled?: boolean;
  closeOnClickOutside?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  onClose: () => void;
};

export function Modal({
  open,
  title,
  subtitle,
  children,
  footer,
  closeLabel = "Đóng hộp thoại",
  closeDisabled = false,
  closeOnClickOutside = false,
  size = "md",
  onClose,
}: ModalProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);
  const titleId = useId();

  onCloseRef.current = onClose;
  closeDisabledRef.current = closeDisabled;

  useLayoutEffect(() => {
    const root = rootRef.current;
    const dialog = dialogRef.current;
    if (!open || !root || !dialog) return undefined;

    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    registerModal(root);
    (getFocusableElements(dialog)[0] ?? dialog).focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (openModalRoots.at(-1) !== root) return;

      if (event.key === "Escape" && !closeDisabledRef.current) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements(dialog);
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      const wasActiveModal = openModalRoots.at(-1) === root;
      unregisterModal(root);

      if (
        wasActiveModal &&
        previouslyFocusedElement?.isConnected &&
        !previouslyFocusedElement.inert
      ) {
        previouslyFocusedElement.focus();
      }
    };
  }, [open]);

  if (!open) return null;
  const sizeClass = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-4xl",
    xl: "max-w-5xl",
    "2xl": "max-w-7xl",
  }[size];

  return createPortal(
    <div
      ref={rootRef}
      className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-6"
      role="presentation"
    >
      <div
        aria-hidden="true"
        data-modal-backdrop="true"
        className={`absolute inset-0 bg-gray-950/50 ${closeDisabled ? "cursor-wait" : "cursor-default"}`}
        onClick={!closeDisabled && closeOnClickOutside ? onClose : undefined}
      />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`shadow-theme-lg relative z-10 flex max-h-[calc(100vh-3rem)] w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${sizeClass}`}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <div>
            <h2
              id={titleId}
              className="text-theme-lg font-semibold text-gray-900 dark:text-white"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label={closeLabel}
            disabled={closeDisabled}
            className="text-theme-xl focus:ring-brand-500/20 cursor-pointer rounded-md leading-none text-gray-400 transition-colors hover:text-gray-700 focus:ring-3 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-white"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-3.5 dark:border-gray-800 dark:bg-gray-900/50">
            {footer}
          </div>
        )}
      </section>
    </div>,
    document.body,
  );
}
