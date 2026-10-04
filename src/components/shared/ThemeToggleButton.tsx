import { useTheme } from "@/context/ThemeContext";

export function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "light" ? "dark" : "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} theme`}
      className="focus-visible:outline-brand-500 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-2 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
        {theme === "light" ? (
          <path
            d="M16.5 11.4A6.75 6.75 0 0 1 8.6 3.5a6.75 6.75 0 1 0 7.9 7.9Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        ) : (
          <>
            <circle cx="10" cy="10" r="3.25" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M10 2.5v1.75M10 15.75v1.75M2.5 10h1.75M15.75 10h1.75M4.7 4.7l1.25 1.25M14.05 14.05l1.25 1.25M4.7 15.3l1.25-1.25M14.05 5.95l1.25-1.25"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
    </button>
  );
}
