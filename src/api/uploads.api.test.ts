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
