import { useEffect, useId, useRef, type ReactNode } from "react";
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
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  size?: "md" | "xl" | "2xl";
  onClose: () => void;
};

export function Modal({
  open,
  title,
  children,
  footer,
  closeLabel = "Đóng hộp thoại",
  size = "md",
  onClose,
}: ModalProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  onCloseRef.current = onClose;

  useEffect(() => {
    const root = rootRef.current;
    const dialog = dialogRef.current;
    if (!open || !root || !dialog) return undefined;

    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    registerModal(root);
    (getFocusableElements(dialog)[0] ?? dialog).focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (openModalRoots.at(-1) !== root) return;

      if (event.key === "Escape") {
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
    md: "max-w-lg",
    xl: "max-w-5xl",
    "2xl": "max-w-7xl",
  }[size];

  return createPortal(
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      role="presentation"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 cursor-default bg-gray-950/50"
        onClick={onClose}
      />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`shadow-theme-lg relative z-10 max-h-[calc(100vh-3rem)] w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 ${sizeClass}`}
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id={titleId}
            className="text-theme-lg font-semibold text-gray-900 dark:text-white"
          >
            {title}
          </h2>
          <button
            type="button"
            aria-label={closeLabel}
            className="text-theme-xl leading-none text-gray-400 hover:text-gray-700 dark:hover:text-white"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="mt-5">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </section>
    </div>,
    document.body,
  );
}
