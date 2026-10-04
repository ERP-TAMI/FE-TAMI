import AccountMenu from "@/layout/AccountMenu";
import { useSidebar } from "@/context/SidebarContext";
import { ThemeToggleButton } from "@/components/shared/ThemeToggleButton";

const ICON_BUTTON =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-brand-500 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white";

export default function AppHeader() {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  return (
    <header className="sticky top-0 z-40 flex w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex w-full items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={handleToggle}
            aria-label={isMobileOpen ? "Close navigation" : "Open navigation"}
            className={ICON_BUTTON}
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
              <path
                d="M3 5.5h14M3 10h8M3 14.5h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <ThemeToggleButton />
          <button type="button" aria-label="Thông báo" className={`${ICON_BUTTON} rounded-full`}>
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
              <path
                d="M10 3a4.5 4.5 0 0 0-4.5 4.5c0 3.2-1.25 4.4-1.9 5.1a.5.5 0 0 0 .37.85h12.06a.5.5 0 0 0 .37-.85c-.65-.7-1.9-1.9-1.9-5.1A4.5 4.5 0 0 0 10 3ZM8 16.25a2 2 0 0 0 4 0"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <AccountMenu area="employee" />
        </div>
      </div>
    </header>
  );
}
