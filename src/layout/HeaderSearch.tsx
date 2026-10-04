import { useEffect, useRef } from "react";

const SHORTCUT_LABEL =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K";

export default function HeaderSearch() {
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focusOnShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        input.current?.focus();
      }
    };
    document.addEventListener("keydown", focusOnShortcut);
    return () => document.removeEventListener("keydown", focusOnShortcut);
  }, []);

  return (
    <form
      role="search"
      onSubmit={(event) => event.preventDefault()}
      className="relative hidden w-full max-w-md md:block"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400"
      >
        <circle cx="9" cy="9" r="5.75" stroke="currentColor" strokeWidth="1.5" />
        <path d="m13.5 13.5 3.25 3.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        ref={input}
        type="search"
        aria-label="Tìm kiếm"
        placeholder="Tìm kiếm..."
        className="focus:border-brand-300 focus:ring-brand-500/10 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pr-20 pl-12 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
        {SHORTCUT_LABEL}
      </kbd>
    </form>
  );
}
