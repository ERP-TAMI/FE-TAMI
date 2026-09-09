import React from "react";

export type FileCategory =
  | "excel"
  | "word"
  | "image"
  | "pdf"
  | "cad"
  | "archive"
  | "presentation"
  | "code"
  | "text"
  | "video"
  | "audio"
  | "other";

export interface FileMetaInfo {
  category: FileCategory;
  extension: string;
  label: string;
  badgeClass: string;
  hoverClass: string;
  textClass: string;
  chipClass: string;
}

export function getFileMeta(fileName?: string | null): FileMetaInfo {
  if (!fileName) {
    return {
      category: "other",
      extension: "",
      label: "Tài liệu",
      badgeClass:
        "bg-gray-100 text-gray-600 border border-gray-200/80 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
      hoverClass: "hover:bg-gray-200 dark:hover:bg-gray-700",
      textClass: "text-gray-600 dark:text-gray-300",
      chipClass:
        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    };
  }

  const parts = fileName.split(".");
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase().trim() : "";

  if (["xlsx", "xls", "csv", "tsv", "ods"].includes(ext)) {
    return {
      category: "excel",
      extension: ext,
      label: ext === "csv" ? "Bảng CSV" : "Bảng tính Excel",
      badgeClass:
        "bg-emerald-50 text-emerald-600 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/60",
      hoverClass: "hover:bg-emerald-100 dark:hover:bg-emerald-900/60",
      textClass: "text-emerald-600 dark:text-emerald-400",
      chipClass:
        "bg-emerald-50/80 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    };
  }

  if (["docx", "doc", "rtf", "odt"].includes(ext)) {
    return {
      category: "word",
      extension: ext,
      label: "Văn bản Word",
      badgeClass:
        "bg-blue-50 text-blue-600 border border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800/60",
      hoverClass: "hover:bg-blue-100 dark:hover:bg-blue-900/60",
      textClass: "text-blue-600 dark:text-blue-400",
      chipClass:
        "bg-blue-50/80 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    };
  }

  if (
    [
      "png",
      "jpg",
      "jpeg",
      "webp",
      "gif",
      "svg",
      "bmp",
      "tiff",
      "ico",
      "heic",
    ].includes(ext)
  ) {
    return {
      category: "image",
      extension: ext,
      label: "Hình ảnh",
      badgeClass:
        "bg-purple-50 text-purple-600 border border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800/60",
      hoverClass: "hover:bg-purple-100 dark:hover:bg-purple-900/60",
      textClass: "text-purple-600 dark:text-purple-400",
      chipClass:
        "bg-purple-50/80 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
    };
  }

  if (ext === "pdf") {
    return {
      category: "pdf",
      extension: ext,
      label: "Tài liệu PDF",
      badgeClass:
        "bg-rose-50 text-rose-600 border border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/60",
      hoverClass: "hover:bg-rose-100 dark:hover:bg-rose-900/60",
      textClass: "text-rose-600 dark:text-rose-400",
      chipClass:
        "bg-rose-50/80 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    };
  }

  if (
    ["dxf", "dwg", "gerber", "plt", "hpgl", "ai", "psd", "cdr"].includes(ext)
  ) {
    return {
      category: "cad",
      extension: ext,
      label: "Bản vẽ CAD / Rập",
      badgeClass:
        "bg-cyan-50 text-cyan-600 border border-cyan-200/80 dark:bg-cyan-950/50 dark:text-cyan-400 dark:border-cyan-800/60",
      hoverClass: "hover:bg-cyan-100 dark:hover:bg-cyan-900/60",
      textClass: "text-cyan-600 dark:text-cyan-400",
      chipClass:
        "bg-cyan-50/80 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300",
    };
  }

  if (["zip", "rar", "7z", "tar", "gz", "bz2"].includes(ext)) {
    return {
      category: "archive",
      extension: ext,
      label: "Tệp nén",
      badgeClass:
        "bg-amber-50 text-amber-600 border border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800/60",
      hoverClass: "hover:bg-amber-100 dark:hover:bg-amber-900/60",
      textClass: "text-amber-600 dark:text-amber-400",
      chipClass:
        "bg-amber-50/80 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    };
  }

  if (["pptx", "ppt", "odp"].includes(ext)) {
    return {
      category: "presentation",
      extension: ext,
      label: "Bản trình chiếu",
      badgeClass:
        "bg-orange-50 text-orange-600 border border-orange-200/80 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-800/60",
      hoverClass: "hover:bg-orange-100 dark:hover:bg-orange-900/60",
      textClass: "text-orange-600 dark:text-orange-400",
      chipClass:
        "bg-orange-50/80 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
    };
  }

  if (
    [
      "json",
      "xml",
      "html",
      "css",
      "js",
      "ts",
      "jsx",
      "tsx",
      "sql",
      "yaml",
      "yml",
    ].includes(ext)
  ) {
    return {
      category: "code",
      extension: ext,
      label: "Mã nguồn / Cấu hình",
      badgeClass:
        "bg-indigo-50 text-indigo-600 border border-indigo-200/80 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-800/60",
      hoverClass: "hover:bg-indigo-100 dark:hover:bg-indigo-900/60",
      textClass: "text-indigo-600 dark:text-indigo-400",
      chipClass:
        "bg-indigo-50/80 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
    };
  }

  if (["txt", "md", "log", "ini"].includes(ext)) {
    return {
      category: "text",
      extension: ext,
      label: "Văn bản thuần",
      badgeClass:
        "bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700",
      hoverClass: "hover:bg-slate-100 dark:hover:bg-slate-800",
      textClass: "text-slate-600 dark:text-slate-300",
      chipClass:
        "bg-slate-50/80 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
    };
  }

  if (["mp4", "mov", "avi", "mkv", "webm", "wmv"].includes(ext)) {
    return {
      category: "video",
      extension: ext,
      label: "Video",
      badgeClass:
        "bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-200/80 dark:bg-fuchsia-950/50 dark:text-fuchsia-400 dark:border-fuchsia-800/60",
      hoverClass: "hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/60",
      textClass: "text-fuchsia-600 dark:text-fuchsia-400",
      chipClass:
        "bg-fuchsia-50/80 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300",
    };
  }

  if (["mp3", "wav", "aac", "flac", "ogg", "m4a"].includes(ext)) {
    return {
      category: "audio",
      extension: ext,
      label: "Âm thanh",
      badgeClass:
        "bg-teal-50 text-teal-600 border border-teal-200/80 dark:bg-teal-950/50 dark:text-teal-400 dark:border-teal-800/60",
      hoverClass: "hover:bg-teal-100 dark:hover:bg-teal-900/60",
      textClass: "text-teal-600 dark:text-teal-400",
      chipClass:
        "bg-teal-50/80 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
    };
  }

  return {
    category: "other",
    extension: ext,
    label: ext ? `Tệp .${ext.toUpperCase()}` : "Tài liệu",
    badgeClass:
      "bg-gray-100 text-gray-600 border border-gray-200/80 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
    hoverClass: "hover:bg-gray-200 dark:hover:bg-gray-700",
    textClass: "text-gray-600 dark:text-gray-300",
    chipClass:
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };
}

interface FileTypeSvgProps {
  category: FileCategory;
  className?: string;
}

export function FileTypeSvg({ category, className = "h-5 w-5" }: FileTypeSvgProps) {
  switch (category) {
    case "excel":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="16" y2="17" />
          <line x1="12" y1="10" x2="12" y2="20" />
        </svg>
      );

    case "word":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      );

    case "image":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      );

    case "pdf":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M9 11v6" />
          <path d="M9 11h2a1.5 1.5 0 0 1 1.5 1.5v0a1.5 1.5 0 0 1-1.5 1.5H9" />
          <path d="M15 11v6" />
        </svg>
      );

    case "cad":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <circle cx="11.5" cy="14.5" r="2.5" />
          <path d="m13.5 16.5 3 3" />
          <path d="M7 11h2" />
        </svg>
      );

    case "archive":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M10 8h1" />
          <path d="M9 11h1" />
          <path d="M10 14h1" />
          <rect x="9" y="16.5" width="2" height="2.5" rx="0.5" />
        </svg>
      );

    case "presentation":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <rect x="7.5" y="11.5" width="9" height="6.5" rx="1" />
          <path d="M10 18v2" />
          <path d="M14 18v2" />
        </svg>
      );

    case "code":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <polyline points="10 12 8 14 10 16" />
          <polyline points="14 12 16 14 14 16" />
        </svg>
      );

    case "video":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="4" width="20" height="16" rx="2.5" />
          <polygon points="10 8 16 12 10 16 10 8" />
        </svg>
      );

    case "audio":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      );

    case "text":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="14" y2="17" />
        </svg>
      );

    case "other":
    default:
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
  }
}

export interface FileTypeIconProps {
  fileName?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "badge" | "icon-only";
  className?: string;
  withHover?: boolean;
}

export const FileTypeIcon: React.FC<FileTypeIconProps> = ({
  fileName,
  size = "md",
  variant = "badge",
  className = "",
  withHover = false,
}) => {
  const meta = getFileMeta(fileName);

  const sizeClasses = {
    xs: {
      badge: "h-6 w-6 rounded-md",
      icon: "h-3.5 w-3.5",
    },
    sm: {
      badge: "h-7 w-7 rounded-lg",
      icon: "h-4 w-4",
    },
    md: {
      badge: "h-9 w-9 rounded-xl",
      icon: "h-5 w-5",
    },
    lg: {
      badge: "h-11 w-11 rounded-xl",
      icon: "h-6 w-6",
    },
    xl: {
      badge: "h-16 w-16 rounded-2xl",
      icon: "h-8 w-8",
    },
  }[size];

  if (variant === "icon-only") {
    return (
      <FileTypeSvg
        category={meta.category}
        className={`${sizeClasses.icon} ${meta.textClass} shrink-0 ${className}`}
      />
    );
  }

  const hoverEffect = withHover ? `transition-colors ${meta.hoverClass}` : "";

  return (
    <div
      className={`flex shrink-0 items-center justify-center shadow-2xs ${sizeClasses.badge} ${meta.badgeClass} ${hoverEffect} ${className}`}
      title={`${meta.label}${meta.extension ? ` (.${meta.extension})` : ""}`}
    >
      <FileTypeSvg category={meta.category} className={sizeClasses.icon} />
    </div>
  );
};
