import axios from "axios";
import { describe, expect, it } from "vitest";
import { getApiError, isConflictError } from "./apiError";

function axiosError(data: unknown, status = 400) {
  return new axios.AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    data,
    status,
    statusText: "Bad Request",
    headers: {},
    config: {} as never,
  });
}

describe("getApiError", () => {
  it("shows the backend's specific reason for a not-found error", () => {
    expect(
      getApiError(
        axiosError({ code: "RESOURCE_NOT_FOUND", message: "Không tìm thấy nhóm vật tư." }),
        "Không thể xử lý yêu cầu.",
      ),
    ).toEqual({ code: "RESOURCE_NOT_FOUND", message: "Không tìm thấy nhóm vật tư." });
  });

  it("falls back to the generic not-found message when the backend sends none", () => {
    expect(
      getApiError(axiosError({ code: "RESOURCE_NOT_FOUND" }), "Không thể xử lý yêu cầu."),
    ).toEqual({ code: "RESOURCE_NOT_FOUND", message: "Không tìm thấy dữ liệu yêu cầu." });
  });

  it("explains when password setup must be completed first", () => {
    expect(
      getApiError(
        axiosError({
          code: "PASSWORD_SETUP_REQUIRED",
          message: "Bạn cần hoàn tất thiết lập mật khẩu trước.",
        }),
        "Không thể xử lý yêu cầu.",
      ),
    ).toEqual({
      code: "PASSWORD_SETUP_REQUIRED",
      message: "Bạn cần hoàn tất thiết lập mật khẩu trước.",
    });
  });

  it("shows an unrecognized code's own message instead of a generic one", () => {
    // Every backend exception is thrown with a specific, user-facing message
    // (see every ConflictException/NotFoundException/... in the backend) —
    // an unmapped code is far more likely to be a new one we haven't added
    // to the Vietnamese map yet than a framework string, so trust it.
    expect(
      getApiError(
        axiosError({ code: "SOMETHING_NEW", message: "Vật tư XYZ chưa được cấu hình." }),
        "Không thể xử lý yêu cầu.",
      ),
    ).toEqual({ code: "SOMETHING_NEW", message: "Vật tư XYZ chưa được cấu hình." });
  });

  it("shows the backend's specific reason for a conflict, not a generic one", () => {
    expect(
      getApiError(
        axiosError({
          code: "CONFLICT",
          message: "Sản phẩm RV-02 đã có NPL, không thể xóa đơn hàng PO.",
        }),
        "Không thể lưu.",
      ),
    ).toEqual({
      code: "CONFLICT",
      message: "Sản phẩm RV-02 đã có NPL, không thể xóa đơn hàng PO.",
    });
  });

  it("falls back to the generic conflict message when the backend sends none", () => {
    expect(getApiError(axiosError({ code: "CONFLICT" }), "Không thể lưu.")).toEqual({
      code: "CONFLICT",
      message: "Dữ liệu bị trùng hoặc đang được sử dụng.",
    });
  });

  it("never shows the bare framework message for a session-level 401", () => {
    // No explicit business code reaches this point — the backend's global
    // filter assigns the literal "UNAUTHORIZED" itself, pairing it with
    // Nest's bare "Unauthorized" (e.g. an expired JWT caught before our own
    // guards run), never one of our own curated strings.
    expect(
      getApiError(axiosError({ code: "UNAUTHORIZED", message: "Unauthorized" }, 401), "Thất bại."),
    ).toEqual({
      code: "UNAUTHORIZED",
      message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    });
  });

  it("never shows the bare framework message for an unhandled 500", () => {
    expect(
      getApiError(
        axiosError({ code: "INTERNAL_SERVER_ERROR", message: "Internal server error" }, 500),
        "Thất bại.",
      ),
    ).toEqual({
      code: "INTERNAL_SERVER_ERROR",
      message: "Máy chủ đang gặp sự cố. Vui lòng thử lại sau.",
    });
  });

  it("lets a caller override the default message for a specific code", () => {
    expect(
      getApiError(axiosError({ code: "CONFLICT", message: "Name already exists" }), "Không thể lưu.", {
        CONFLICT: "Tên mẫu Fit đã tồn tại.",
      }),
    ).toEqual({ code: "CONFLICT", message: "Tên mẫu Fit đã tồn tại." });
  });

  it("falls back to the provided message for non-axios errors", () => {
    expect(getApiError(new Error("boom"), "Không thể xử lý yêu cầu.")).toEqual({
      code: "UNKNOWN",
      message: "Không thể xử lý yêu cầu.",
    });
  });
});

describe("isConflictError", () => {
  it("detects an HTTP 409 conflict response", () => {
    expect(isConflictError(axiosError({ code: "CONFLICT" }, 409))).toBe(true);
  });

  it("returns false for non-conflict responses", () => {
    expect(isConflictError(axiosError({ code: "VALIDATION_ERROR" }, 400))).toBe(false);
    expect(isConflictError(new Error("boom"))).toBe(false);
  });
});
