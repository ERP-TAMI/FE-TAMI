interface Props {
  className?: string;
}

export function StyleImagePlaceholder({ className = "" }: Props) {
  return (
    <div
      className={`relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800/60 ${className}`}
    >
      {/* Subtle Geometric Clothing Line Silhouette */}
      <svg
        className="h-16 w-16 text-gray-300 dark:text-gray-600"
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Collar & Shoulders */}
        <path d="M20 16 C 26 22, 38 22, 44 16" />
        <path d="M20 16 L 8 24 L 14 34 L 20 30 L 20 54 L 44 54 L 44 30 L 50 34 L 56 24 L 44 16" />
        <line x1="20" y1="30" x2="44" y2="30" strokeDasharray="2 2" opacity="0.5" />
      </svg>
    </div>
  );
}
