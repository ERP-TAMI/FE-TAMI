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
  it("maps machine-readable error codes to Vietnamese", () => {
    expect(
      getApiError(
        axiosError({ code: "RESOURCE_NOT_FOUND", message: "Material group not found" }),
        "Không thể xử lý yêu cầu.",
      ),
    ).toEqual({ code: "RESOURCE_NOT_FOUND", message: "Không tìm thấy dữ liệu yêu cầu." });
  });

  it("never exposes an unrecognized English backend message", () => {
    expect(
      getApiError(
        axiosError({ code: "SOMETHING_NEW", message: "Unexpected backend failure" }),
        "Không thể xử lý yêu cầu.",
      ),
    ).toEqual({ code: "SOMETHING_NEW", message: "Không thể xử lý yêu cầu." });
  });

  it("maps a conflict without guessing which field caused it", () => {
    expect(
      getApiError(axiosError({ code: "CONFLICT", message: "Name already exists" }), "Không thể lưu."),
    ).toEqual({
      code: "CONFLICT",
      message: "Dữ liệu bị trùng hoặc đang được sử dụng.",
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
