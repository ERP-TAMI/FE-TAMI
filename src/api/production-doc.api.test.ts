import { describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/apiClient";
import { productionDocApi } from "./production-doc.api";
import type { StyleProductionDocDetail } from "@/types/production-doc";

vi.mock("@/lib/apiClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("productionDocApi", () => {
  const mockDoc: StyleProductionDocDetail = {
    id: "doc-1",
    styleId: "style-1",
    name: "Tài liệu sản xuất E2E",
    description: "Mô tả",
    status: "draft",
    section1Description: "Mô tả 1",
    section1ImageUrl: null,
    section2Accessories: "Phụ liệu 2",
    section3Notes: "Lưu ý 3",
    section4CustomerFeedback: "Comment 4",
    sizeData: null,
    copiedFromStyleId: null,
    copiedAt: null,
    createdAt: "2026-08-24T00:00:00Z",
    updatedAt: "2026-08-24T00:00:00Z",
    sections: [
      { id: "sec-1", sectionCode: "SEC1", title: "Mô tả hình dáng", content: "Nội dung", isFixed: true },
    ],
    sizeRows: [
      { id: "sr-1", sizeLabel: "M", measurementName: "Vòng ngực", measurementValue: "92", tolerance: "±1" },
    ],
    attachments: [],
  };

  it("fetches production doc details by styleId", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockDoc });
    const result = await productionDocApi.findByStyleId("style-1");
    expect(apiClient.get).toHaveBeenCalledWith("/styles/style-1/production-docs");
    expect(result?.name).toBe("Tài liệu sản xuất E2E");
  });

  it("creates a new production doc for a style", async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockDoc });
    const result = await productionDocApi.create("style-1", { name: "Tài liệu sản xuất E2E" });
    expect(apiClient.post).toHaveBeenCalledWith("/styles/style-1/production-docs", {
      name: "Tài liệu sản xuất E2E",
    });
    expect(result.id).toBe("doc-1");
  });

  it("unlinks an attachment safely", async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: null });
    await productionDocApi.unlinkAttachment("style-1", "doc-1", "att-1");
    expect(apiClient.delete).toHaveBeenCalledWith(
      "/styles/style-1/production-docs/doc-1/attachments/att-1",
    );
  });
});
