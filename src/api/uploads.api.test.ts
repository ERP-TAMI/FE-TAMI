import { describe, it, expect, vi, beforeEach } from "vitest";
import apiClient from "@/lib/apiClient";
import { uploadsApi } from "./uploads.api";

vi.mock("@/lib/apiClient", () => ({
  default: {
    post: vi.fn(),
  },
}));

describe("uploadsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should upload image file and return local upload metadata", async () => {
    const mockFile = new File(["dummy content"], "test.png", { type: "image/png" });
    const mockResponse = {
      data: {
        url: "/uploads/img-123.png",
        filename: "img-123.png",
        originalname: "test.png",
        size: 100,
        mimetype: "image/png",
      },
    };

    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

    const result = await uploadsApi.uploadImage(mockFile);

    expect(apiClient.post).toHaveBeenCalledWith(
      "/uploads",
      expect.any(FormData),
      expect.objectContaining({
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    );
    expect(result).toEqual(mockResponse.data);
  });
});
