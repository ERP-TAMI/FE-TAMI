import { describe, it, expect, vi, beforeEach } from "vitest";
import apiClient from "@/lib/apiClient";
import { uploadsApi } from "./uploads.api";

vi.mock("@/lib/apiClient", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe("uploadsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("presigns an upload with the file's own name/type/size", async () => {
    const file = new File(["dummy content"], "test.png", { type: "image/png" });
    const mockResponse = {
      data: { objectKey: "k", uploadUrl: "https://s3.example/put", expiresIn: 300 },
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

    const result = await uploadsApi.presign({
      entityType: "style",
      entityId: "style-1",
      purpose: "sample_image",
      file,
    });

    expect(apiClient.post).toHaveBeenCalledWith("/storage/uploads/presign", {
      entityType: "style",
      entityId: "style-1",
      purpose: "sample_image",
      fileName: "test.png",
      mimeType: "image/png",
      sizeBytes: file.size,
    });
    expect(result).toEqual(mockResponse.data);
  });

  it("PUTs the file straight to S3 with the file's content type", async () => {
    const file = new File(["dummy content"], "test.png", { type: "image/png" });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await uploadsApi.uploadToS3("https://s3.example/put", file);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://s3.example/put",
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "image/png" },
        body: file,
      }),
    );
  });

  it("throws when the S3 PUT does not succeed", async () => {
    const file = new File(["dummy content"], "test.png", { type: "image/png" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));

    await expect(uploadsApi.uploadToS3("https://s3.example/put", file)).rejects.toThrow(
      "HTTP 403",
    );
  });

  it("resolves a fresh view URL for an object key", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { url: "https://s3.example/get", expiresIn: 3600 },
    });

    const result = await uploadsApi.getViewUrl("k");

    expect(apiClient.get).toHaveBeenCalledWith("/storage/uploads/view-url", {
      params: { objectKey: "k" },
    });
    expect(result).toBe("https://s3.example/get");
  });

  it("resolves a forced-download view URL with the given file name", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { url: "https://s3.example/get?disposition=attachment", expiresIn: 3600 },
    });

    const result = await uploadsApi.getViewUrl("k", { download: true, fileName: "test_v2.pdf" });

    expect(apiClient.get).toHaveBeenCalledWith("/storage/uploads/view-url", {
      params: { objectKey: "k", download: "true", fileName: "test_v2.pdf" },
    });
    expect(result).toBe("https://s3.example/get?disposition=attachment");
  });

  describe("isRawObjectKey", () => {
    it("treats absolute and legacy relative URLs as already usable", () => {
      expect(uploadsApi.isRawObjectKey("https://cdn.example/f.png")).toBe(false);
      expect(uploadsApi.isRawObjectKey("http://cdn.example/f.png")).toBe(false);
      expect(uploadsApi.isRawObjectKey("blob:http://localhost/abc")).toBe(false);
      expect(uploadsApi.isRawObjectKey("data:image/png;base64,AAA")).toBe(false);
      expect(uploadsApi.isRawObjectKey("/uploads/legacy/file.pdf")).toBe(false);
    });

    it("treats a bare S3 object key as needing resolution", () => {
      expect(
        uploadsApi.isRawObjectKey(
          "purchase-orders/po-1/products/prod-1/documents/tech_pack/abc.pdf",
        ),
      ).toBe(true);
    });

    it("treats null/undefined/empty as not a raw key", () => {
      expect(uploadsApi.isRawObjectKey(null)).toBe(false);
      expect(uploadsApi.isRawObjectKey(undefined)).toBe(false);
      expect(uploadsApi.isRawObjectKey("")).toBe(false);
    });
  });

  it("uploadImage runs presign -> PUT -> view-url and returns the key + a preview URL", async () => {
    const file = new File(["dummy content"], "test.png", { type: "image/png" });
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { objectKey: "k", uploadUrl: "https://s3.example/put", expiresIn: 300 },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { url: "https://s3.example/get", expiresIn: 3600 },
    });

    const result = await uploadsApi.uploadImage({
      entityType: "style",
      entityId: "style-1",
      purpose: "sample_image",
      file,
    });

    expect(result).toEqual({ objectKey: "k", previewUrl: "https://s3.example/get" });
  });
});
