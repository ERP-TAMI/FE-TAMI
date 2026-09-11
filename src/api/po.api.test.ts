import { describe, it, expect, vi, beforeEach } from "vitest";
import apiClient from "@/lib/apiClient";
import { poApi } from "./po.api";

vi.mock("@/lib/apiClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("poApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("findAll calls GET /purchase-orders with query parameters", async () => {
    const mockData = { items: [], total: 0, page: 1, limit: 10, totalPages: 1 };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

    const res = await poApi.findAll({ search: "PO-001", status: "draft" });

    expect(apiClient.get).toHaveBeenCalledWith("/purchase-orders", {
      params: { search: "PO-001", status: "draft" },
    });
    expect(res).toEqual(mockData);
  });

  it("create calls POST /purchase-orders", async () => {
    const mockPo = { id: "po-1", poCode: "PO-001" };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockPo });

    const res = await poApi.create({
      poCode: "PO-001",
      customerId: "cust-1",
      customerNameSnapshot: "Customer A",
      receivedDate: "2026-09-07",
      deadline: "2026-10-15",
    });

    expect(apiClient.post).toHaveBeenCalledWith("/purchase-orders", {
      poCode: "PO-001",
      customerId: "cust-1",
      customerNameSnapshot: "Customer A",
      receivedDate: "2026-09-07",
      deadline: "2026-10-15",
    });
    expect(res).toEqual(mockPo);
  });

  it("updateStatus calls PATCH /purchase-orders/:id/status", async () => {
    const mockPo = { id: "po-1", status: "closed" };
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: mockPo });

    const res = await poApi.updateStatus("po-1", {
      status: "closed",
      reason: "Completed",
    });

    expect(apiClient.patch).toHaveBeenCalledWith("/purchase-orders/po-1/status", {
      status: "closed",
      reason: "Completed",
    });
    expect(res).toEqual(mockPo);
  });

  it("getProducts calls GET /purchase-orders/:id/products", async () => {
    const mockProducts = [{ id: "prod-1", styleCode: "ST-01", productName: "Polo" }];
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockProducts });

    const res = await poApi.getProducts("po-1");

    expect(apiClient.get).toHaveBeenCalledWith("/purchase-orders/po-1/products");
    expect(res).toEqual(mockProducts);
  });

  it("addProduct calls POST /purchase-orders/:id/products conforming to BE CreatePoProductDto contract", async () => {
    const mockProduct = {
      id: "prod-1",
      productCode: "PROD-2026-001",
      productName: "Polo Regular Fit",
      sourceStyleId: "style-uuid-1",
      category: "Polo",
      materialNote: "Cotton 100%",
      deadline: "2026-10-01",
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockProduct });

    const input = {
      productCode: "PROD-2026-001",
      productName: "Polo Regular Fit",
      sourceStyleId: "style-uuid-1",
      category: "Polo",
      materialNote: "Cotton 100%",
      deadline: "2026-10-01",
    };

    const res = await poApi.addProduct("po-1", input);

    expect(apiClient.post).toHaveBeenCalledWith("/purchase-orders/po-1/products", input);
    // Ensure no forbidden fields are sent
    expect((input as Record<string, unknown>).styleCode).toBeUndefined();
    expect((input as Record<string, unknown>).styleId).toBeUndefined();
    expect((input as Record<string, unknown>).colorName).toBeUndefined();
    expect((input as Record<string, unknown>).status).toBeUndefined();
    expect(res).toEqual(mockProduct);
  });

  it("removeProduct calls DELETE /purchase-orders/:id/products/:productId", async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({});

    await poApi.removeProduct("po-1", "prod-1");

    expect(apiClient.delete).toHaveBeenCalledWith("/purchase-orders/po-1/products/prod-1");
  });

  it("presignDocument posts file metadata to /purchase-orders/:id/documents/presign", async () => {
    const mockRes = { objectKey: "k", uploadUrl: "https://s3.example/put", expiresIn: 300 };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockRes });

    const file = new File(["dummy content"], "test.pdf", { type: "application/pdf" });
    const res = await poApi.presignDocument("po-1", file, "po_original");

    expect(apiClient.post).toHaveBeenCalledWith("/purchase-orders/po-1/documents/presign", {
      fileName: "test.pdf",
      mimeType: "application/pdf",
      sizeBytes: file.size,
      purpose: "po_original",
    });
    expect(res).toEqual(mockRes);
  });

  it("uploadToS3 PUTs the file straight to S3", async () => {
    const file = new File(["dummy content"], "test.pdf", { type: "application/pdf" });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await poApi.uploadToS3("https://s3.example/put", file);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://s3.example/put",
      expect.objectContaining({ method: "PUT", headers: { "Content-Type": "application/pdf" } }),
    );
  });

  it("confirmDocument posts the objectKey and file metadata to /purchase-orders/:id/documents/confirm", async () => {
    const mockRes = { documentId: "doc-1", title: "test.pdf" };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockRes });

    const file = new File(["dummy content"], "test.pdf", { type: "application/pdf" });
    const res = await poApi.confirmDocument("po-1", "k", file, "po_original");

    expect(apiClient.post).toHaveBeenCalledWith("/purchase-orders/po-1/documents/confirm", {
      objectKey: "k",
      fileName: "test.pdf",
      mimeType: "application/pdf",
      sizeBytes: file.size,
      purpose: "po_original",
    });
    expect(res).toEqual(mockRes);
  });

  it("uploadDocument runs presign -> PUT -> confirm end to end", async () => {
    const file = new File(["dummy content"], "test.pdf", { type: "application/pdf" });
    vi.mocked(apiClient.post)
      .mockResolvedValueOnce({
        data: { objectKey: "k", uploadUrl: "https://s3.example/put", expiresIn: 300 },
      })
      .mockResolvedValueOnce({ data: { documentId: "doc-1", title: "test.pdf" } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));

    const res = await poApi.uploadDocument("po-1", file, "po_original");

    expect(res).toEqual({ documentId: "doc-1", title: "test.pdf" });
  });

  it("updateDocumentPurpose calls PATCH /purchase-orders/:id/documents/:documentId", async () => {
    const mockRes = { id: "po-1", documents: [] };
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: mockRes });

    const res = await poApi.updateDocumentPurpose("po-1", "doc-1", "sample_image");

    expect(apiClient.patch).toHaveBeenCalledWith(
      "/purchase-orders/po-1/documents/doc-1",
      { purpose: "sample_image" },
    );
    expect(res).toEqual(mockRes);
  });
});
