import axios from "axios";
import { describe, expect, it } from "vitest";
import { getMaterialGroupError } from "./material-group-error";

function axiosError(data: unknown) {
  return new axios.AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    data,
    status: 400,
    statusText: "Bad Request",
    headers: {},
    config: {} as never,
  });
}

describe("getMaterialGroupError", () => {
  it("maps machine-readable error codes to Vietnamese", () => {
    expect(
      getMaterialGroupError(
        axiosError({ code: "RESOURCE_NOT_FOUND", message: "Material group not found" }),
        "Không thể xử lý nhóm vật tư.",
      ),
    ).toEqual({ code: "RESOURCE_NOT_FOUND", message: "Không tìm thấy nhóm vật tư." });
  });

  it("never exposes an unrecognized English backend message", () => {
    expect(
      getMaterialGroupError(
        axiosError({ code: "SOMETHING_NEW", message: "Unexpected backend failure" }),
        "Không thể xử lý nhóm vật tư.",
      ),
    ).toEqual({ code: "SOMETHING_NEW", message: "Không thể xử lý nhóm vật tư." });
  });

  it("maps a conflict without guessing which form field caused it", () => {
    expect(
      getMaterialGroupError(
        axiosError({ code: "CONFLICT", message: "Material group name already exists" }),
        "Không thể lưu nhóm vật tư.",
      ),
    ).toEqual({
      code: "CONFLICT",
      message: "Không thể thực hiện vì dữ liệu nhóm vật tư bị trùng hoặc đang được sử dụng.",
    });
  });
});
