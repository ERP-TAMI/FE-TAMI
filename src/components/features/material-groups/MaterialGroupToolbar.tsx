import { Input } from "@/components/shared";

type MaterialGroupToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
};

export function MaterialGroupToolbar({ search, onSearchChange }: MaterialGroupToolbarProps) {
  return (
    <header className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end">
        <div className="relative w-full lg:w-96">
          <span className="pointer-events-none absolute top-1/2 left-3.5 z-10 -translate-y-1/2 text-gray-400">
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
          </span>
          <Input
            type="search"
            aria-label="Tìm kiếm nhóm vật tư"
            placeholder="Tìm theo tên nhóm..."
            value={search}
            className="border-gray-300 bg-white pl-11 dark:border-gray-600 dark:bg-gray-900"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>
    </header>
  );
}
