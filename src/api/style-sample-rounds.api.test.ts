import { describe, it, expect, vi, beforeEach } from "vitest";
import apiClient from "@/lib/apiClient";
import { styleSampleRoundsApi } from "./style-sample-rounds.api";

vi.mock("@/lib/apiClient", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const STYLE_ID = "8f3a1c2e-4b6a-4e1a-9c2d-1a2b3c4d5e6f";
const ROUND_ID = "a1b2c3d4-4b6a-4e1a-9c2d-1a2b3c4d5e6f";
const IMAGE_ID = "c9d0e1f2-4b6a-4e1a-9c2d-1a2b3c4d5e6f";

describe("styleSampleRoundsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists sample rounds for a style", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });

    const result = await styleSampleRoundsApi.list(STYLE_ID);

    expect(apiClient.get).toHaveBeenCalledWith(`/styles/${STYLE_ID}/sample-rounds`);
    expect(result).toEqual([]);
  });

  it("creates a new sample round", async () => {
    const mockResponse = { data: { id: ROUND_ID, roundNo: 1 } };
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

    const input = { feedback: "ok", status: "working" as const };
    const result = await styleSampleRoundsApi.create(STYLE_ID, input);

    expect(apiClient.post).toHaveBeenCalledWith(
      `/styles/${STYLE_ID}/sample-rounds`,
      input,
    );
    expect(result).toEqual(mockResponse.data);
  });

  it("updates an existing sample round", async () => {
    const mockResponse = { data: { id: ROUND_ID, status: "approved" } };
    vi.mocked(apiClient.patch).mockResolvedValueOnce(mockResponse);

    const input = { status: "approved" as const };
    const result = await styleSampleRoundsApi.update(STYLE_ID, ROUND_ID, input);

    expect(apiClient.patch).toHaveBeenCalledWith(
      `/styles/${STYLE_ID}/sample-rounds/${ROUND_ID}`,
      input,
    );
    expect(result).toEqual(mockResponse.data);
  });

  it("presigns an image upload with the file's own name/type/size", async () => {
    const file = new File(["content"], "anh.png", { type: "image/png" });
    const mockResponse = {
      data: { objectKey: "k", uploadUrl: "https://s3.example/put", expiresIn: 300 },
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

    const result = await styleSampleRoundsApi.presignImage(STYLE_ID, ROUND_ID, file);

    expect(apiClient.post).toHaveBeenCalledWith(
      `/styles/${STYLE_ID}/sample-rounds/${ROUND_ID}/images/presign`,
      { fileName: "anh.png", mimeType: "image/png", sizeBytes: file.size },
    );
    expect(result).toEqual(mockResponse.data);
  });

  it("PUTs the file straight to S3 with the file's content type", async () => {
    const file = new File(["content"], "anh.png", { type: "image/png" });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await styleSampleRoundsApi.uploadToS3("https://s3.example/put", file);

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
    const file = new File(["content"], "anh.png", { type: "image/png" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));

    await expect(
      styleSampleRoundsApi.uploadToS3("https://s3.example/put", file),
    ).rejects.toThrow("HTTP 403");
  });

  it("confirms the image upload with the given payload", async () => {
    const mockResponse = { data: { id: IMAGE_ID, fileName: "anh.png" } };
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

    const payload = {
      objectKey: "k",
      fileName: "anh.png",
      mimeType: "image/png",
      sizeBytes: 1024,
    };
    const result = await styleSampleRoundsApi.confirmImage(STYLE_ID, ROUND_ID, payload);

    expect(apiClient.post).toHaveBeenCalledWith(
      `/styles/${STYLE_ID}/sample-rounds/${ROUND_ID}/images/confirm`,
      payload,
    );
    expect(result).toEqual(mockResponse.data);
  });

  it("removes an image from a sample round", async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: undefined });

    await styleSampleRoundsApi.removeImage(STYLE_ID, ROUND_ID, IMAGE_ID);

    expect(apiClient.delete).toHaveBeenCalledWith(
      `/styles/${STYLE_ID}/sample-rounds/${ROUND_ID}/images/${IMAGE_ID}`,
    );
  });

  it("gets a fresh download URL for an image", async () => {
    const mockResponse = { data: { url: "https://s3.example/get", expiresIn: 3600 } };
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse);

    const result = await styleSampleRoundsApi.getImageDownloadUrl(
      STYLE_ID,
      ROUND_ID,
      IMAGE_ID,
    );

    expect(apiClient.get).toHaveBeenCalledWith(
      `/styles/${STYLE_ID}/sample-rounds/${ROUND_ID}/images/${IMAGE_ID}/download-url`,
    );
    expect(result).toEqual(mockResponse.data);
  });
});
