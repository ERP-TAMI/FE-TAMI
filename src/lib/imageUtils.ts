export function resolveImageUrl(url?: string | null): string | null {
  if (!url) return null;
  if (
    url.startsWith("blob:") ||
    url.startsWith("data:") ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }
  // Nếu là đường dẫn tương đối bắt đầu bằng /
  if (url.startsWith("/")) {
    const rawApiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const origin = rawApiUrl.replace(/\/api(?:\/v\d+)?\/?$/, "");
    return `${origin}${url}`;
  }
  return url;
}
