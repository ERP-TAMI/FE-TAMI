import { describe, it, expect, vi, beforeEach } from "vitest";
import apiClient from "@/lib/apiClient";
import { styleDocumentsApi } from "./style-documents.api";

vi.mock("@/lib/apiClient", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

const STYLE_ID = "8f3a1c2e-4b6a-4e1a-9c2d-1a2b3c4d5e6f";
const DOCUMENT_ID = "c9d0e1f2-4b6a-4e1a-9c2d-1a2b3c4d5e6f";

describe("styleDocumentsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("presigns an upload with the file's own name/type/size", async () => {
    const file = new File(["content"], "tech-pack.pdf", { type: "application/pdf" });
    const mockResponse = {
      data: { objectKey: "k", uploadUrl: "https://s3.example/put", expiresIn: 300 },
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

    const result = await styleDocumentsApi.presign(STYLE_ID, file);

    expect(apiClient.post).toHaveBeenCalledWith(`/styles/${STYLE_ID}/documents/presign`, {
      fileName: "tech-pack.pdf",
      mimeType: "application/pdf",
      sizeBytes: file.size,
    });
    expect(result).toEqual(mockResponse.data);
  });

  it("PUTs the file straight to S3 with the file's content type", async () => {
    const file = new File(["content"], "tech-pack.pdf", { type: "application/pdf" });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await styleDocumentsApi.uploadToS3("https://s3.example/put", file);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://s3.example/put",
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      }),
    );
  });

  it("throws when the S3 PUT does not succeed", async () => {
    const file = new File(["content"], "tech-pack.pdf", { type: "application/pdf" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));

    await expect(styleDocumentsApi.uploadToS3("https://s3.example/put", file)).rejects.toThrow(
      "HTTP 403",
    );
  });

  it("confirms the upload with the given payload", async () => {
    const mockResponse = {
      data: {
        documentId: DOCUMENT_ID,
        fileName: "tech-pack.pdf",
        mimeType: "application/pdf",
        byteSize: 1024,
        uploadedAt: "2026-01-01T00:00:00.000Z",
        purpose: "fit_attachment",
      },
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

    const payload = {
      objectKey: "k",
      fileName: "tech-pack.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024,
    };
    const result = await styleDocumentsApi.confirm(STYLE_ID, payload);

    expect(apiClient.post).toHaveBeenCalledWith(
      `/styles/${STYLE_ID}/documents/confirm`,
      payload,
    );
    expect(result).toEqual(mockResponse.data);
  });

  it("lists documents for a style", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });

    const result = await styleDocumentsApi.list(STYLE_ID);

    expect(apiClient.get).toHaveBeenCalledWith(`/styles/${STYLE_ID}/documents`);
    expect(result).toEqual([]);
  });

  it("requests an inline view-url by default", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { url: "https://s3.example/get", expiresIn: 3600 },
    });

    await styleDocumentsApi.getViewUrl(STYLE_ID, DOCUMENT_ID, false);

    expect(apiClient.get).toHaveBeenCalledWith(
      `/styles/${STYLE_ID}/documents/${DOCUMENT_ID}/view-url`,
      { params: undefined },
    );
  });

  it("requests a download view-url when download=true", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { url: "https://s3.example/get", expiresIn: 3600 },
    });

    await styleDocumentsApi.getViewUrl(STYLE_ID, DOCUMENT_ID, true);

    expect(apiClient.get).toHaveBeenCalledWith(
      `/styles/${STYLE_ID}/documents/${DOCUMENT_ID}/view-url`,
      { params: { download: "true" } },
    );
  });

  it("removes a document link", async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: undefined });

    await styleDocumentsApi.remove(STYLE_ID, DOCUMENT_ID);

    expect(apiClient.delete).toHaveBeenCalledWith(
      `/styles/${STYLE_ID}/documents/${DOCUMENT_ID}`,
    );
  });
});
