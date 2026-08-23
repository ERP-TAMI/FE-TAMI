import axios from "axios";
import type { MaterialGroupError } from "@/types/material-group";

type ErrorResponse = {
  code?: unknown;
};

const errorTranslations: Record<string, Omit<MaterialGroupError, "code">> = {
  VALIDATION_ERROR: {
    message: "Dữ liệu nhóm vật tư không hợp lệ. Vui lòng kiểm tra lại.",
  },
  BAD_REQUEST: {
    message: "Dữ liệu nhóm vật tư không hợp lệ. Vui lòng kiểm tra lại.",
  },
  RESOURCE_NOT_FOUND: {
    message: "Không tìm thấy nhóm vật tư.",
  },
  CONFLICT: {
    message: "Không thể thực hiện vì dữ liệu nhóm vật tư bị trùng hoặc đang được sử dụng.",
  },
  UNAUTHORIZED: {
    message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  },
  FORBIDDEN: {
    message: "Bạn không có quyền thực hiện thao tác này.",
  },
  INTERNAL_SERVER_ERROR: {
    message: "Máy chủ đang gặp sự cố. Vui lòng thử lại sau.",
  },
};

export function getMaterialGroupError(error: unknown, fallback: string): MaterialGroupError {
  if (!axios.isAxiosError<ErrorResponse>(error)) {
    return { code: "UNKNOWN", message: fallback };
  }

  const rawCode = error.response?.data?.code;
  const code = typeof rawCode === "string" ? rawCode : "UNKNOWN";
  const translation = errorTranslations[code];

  return translation ? { code, ...translation } : { code, message: fallback };
}
