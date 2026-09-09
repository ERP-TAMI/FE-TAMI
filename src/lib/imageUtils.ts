export function getApiBaseUrl(): string {
  const rawApiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  return rawApiUrl.replace(/\/api(?:\/v\d+)?\/?$/, "");
}

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
    const origin = getApiBaseUrl();
    return `${origin}${url}`;
  }
  return url;
}
