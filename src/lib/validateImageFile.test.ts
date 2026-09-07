import { describe, it, expect } from "vitest";
import { validateImageFile, validateDocumentFile } from "./validateImageFile";

describe("validateImageFile", () => {
  it("returns null for valid image file under 10MB", () => {
    const file = new File(["dummy content"], "test.png", { type: "image/png" });
    expect(validateImageFile(file)).toBeNull();
  });

  it("returns error message when file is not an image", () => {
    const file = new File(["dummy content"], "test.pdf", { type: "application/pdf" });
    expect(validateImageFile(file)).toBe("Chỉ chấp nhận file hình ảnh (JPEG, PNG, GIF, WebP).");
  });

  it("returns error message when image exceeds 10MB", () => {
    const largeContent = new Uint8Array(11 * 1024 * 1024);
    const file = new File([largeContent], "large.png", { type: "image/png" });
    expect(validateImageFile(file, 10)).toBe("Kích thước file vượt quá 10MB.");
  });
});

describe("validateDocumentFile", () => {
  it("returns null for valid document under 20MB", () => {
    const file = new File(["dummy content"], "techspec.pdf", { type: "application/pdf" });
    expect(validateDocumentFile(file)).toBeNull();
  });

  it("returns error for prohibited executable file extension", () => {
    const file = new File(["echo hello"], "script.bat", { type: "text/plain" });
    expect(validateDocumentFile(file)).toBe("Định dạng file này không được phép đính kèm vì lý do bảo mật.");
  });

  it("returns error when document exceeds 20MB", () => {
    const largeContent = new Uint8Array(21 * 1024 * 1024);
    const file = new File([largeContent], "large.pdf", { type: "application/pdf" });
    expect(validateDocumentFile(file, 20)).toBe("Kích thước tài liệu vượt quá 20MB.");
  });
});
