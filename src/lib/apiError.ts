import axios from "axios";

export type ApiError = {
  code: string;
  message: string;
  lockedUntil?: string;
};

type ErrorResponse = {
  code?: unknown;
  message?: unknown;
  lockedUntil?: unknown;
};

const defaultApiErrorMessages: Record<string, string> = {
  VALIDATION_ERROR: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
  BAD_REQUEST: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
  RESOURCE_NOT_FOUND: "Không tìm thấy dữ liệu yêu cầu.",
  CONFLICT: "Dữ liệu bị trùng hoặc đang được sử dụng.",
  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  INTERNAL_SERVER_ERROR: "Máy chủ đang gặp sự cố. Vui lòng thử lại sau.",
  ACCOUNT_LOCKED: "Tài khoản đang tạm khoá do đăng nhập sai nhiều lần. Vui lòng thử lại sau.",
  ACCOUNT_MANUALLY_LOCKED: "Tài khoản đã bị quản trị viên khóa. Vui lòng liên hệ quản trị viên.",
  ACCOUNT_TEMPORARILY_LOCKED:
    "Tài khoản đang tạm khoá do đăng nhập sai nhiều lần. Vui lòng thử lại sau.",
  ACCOUNT_INACTIVE: "Tài khoản của bạn đã bị vô hiệu hoá. Vui lòng liên hệ quản trị viên.",
  CURRENT_PASSWORD_INCORRECT: "Mật khẩu hiện tại không đúng.",
  PASSWORD_REUSE_NOT_ALLOWED: "Mật khẩu mới phải khác mật khẩu hiện tại.",
  PASSWORD_SETUP_REQUIRED: "Bạn cần hoàn tất thiết lập mật khẩu trước.",
};

// The backend's global exception filter assigns one of these two codes as a
// fallback whenever an exception carries no explicit business `code` — a
// framework-level rejection (an expired/malformed JWT never reaching our own
// guards, or a truly unhandled 500). Its `message` is then not one of our own
// curated, user-facing strings — a bare "Unauthorized", or the safe generic
// "Internal server error" the filter substitutes on purpose so it never
// leaks a raw DB/stack message — so showing it as-is would be an unhelpful
// English surprise. Every *other* code is always paired with a specific
// message written for the person reading it (see every `ConflictException`,
// `NotFoundException`, `ForbiddenException`, ... in the backend), so prefer
// that real message over the generic one instead of guessing it's unsafe.
const PREFERS_GENERIC_MESSAGE = new Set(["UNAUTHORIZED", "INTERNAL_SERVER_ERROR"]);

export function getApiError(
  error: unknown,
  fallback: string,
  overrides?: Record<string, string>,
): ApiError {
  if (!axios.isAxiosError<ErrorResponse>(error)) {
    return { code: "UNKNOWN", message: fallback };
  }

  const rawCode = error.response?.data?.code;
  const code = typeof rawCode === "string" ? rawCode : "UNKNOWN";
  const rawMessage = error.response?.data?.message;
  const serverMessage = Array.isArray(rawMessage)
    ? rawMessage.filter((item): item is string => typeof item === "string").join("; ")
    : typeof rawMessage === "string"
      ? rawMessage
      : undefined;
  const message =
    overrides?.[code] ??
    (PREFERS_GENERIC_MESSAGE.has(code)
      ? defaultApiErrorMessages[code]
      : (serverMessage ?? defaultApiErrorMessages[code]));

  const lockedUntil = error.response?.data?.lockedUntil;
  return {
    code,
    message: message ?? fallback,
    lockedUntil: typeof lockedUntil === "string" ? lockedUntil : undefined,
  };
}

export function isConflictError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 409;
}
