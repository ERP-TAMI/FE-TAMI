import axios from "axios";

export type ApiError = {
  code: string;
  message: string;
};

type ErrorResponse = {
  code?: unknown;
  message?: unknown;
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
  ACCOUNT_INACTIVE: "Tài khoản của bạn đã bị vô hiệu hoá. Vui lòng liên hệ quản trị viên.",
};

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
    defaultApiErrorMessages[code] ??
    (code === "VALIDATION_ERROR" || code === "BAD_REQUEST" || Array.isArray(rawMessage)
      ? serverMessage
      : undefined);

  return { code, message: message ?? fallback };
}

export function isConflictError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 409;
}
