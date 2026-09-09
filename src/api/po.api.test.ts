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
    });

    expect(apiClient.post).toHaveBeenCalledWith("/purchase-orders", {
      poCode: "PO-001",
      customerId: "cust-1",
      customerNameSnapshot: "Customer A",
      receivedDate: "2026-09-07",
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

  it("addProduct calls POST /purchase-orders/:id/products", async () => {
    const mockProduct = { id: "prod-1", styleCode: "ST-01", productName: "Polo" };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockProduct });

    const res = await poApi.addProduct("po-1", {
      styleCode: "ST-01",
      productName: "Polo",
    });

    expect(apiClient.post).toHaveBeenCalledWith("/purchase-orders/po-1/products", {
      styleCode: "ST-01",
      productName: "Polo",
    });
    expect(res).toEqual(mockProduct);
  });

  it("removeProduct calls DELETE /purchase-orders/:id/products/:productId", async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({});

    await poApi.removeProduct("po-1", "prod-1");

    expect(apiClient.delete).toHaveBeenCalledWith("/purchase-orders/po-1/products/prod-1");
  });

  it("uploadDocument sends multipart FormData to /purchase-orders/:id/documents/upload", async () => {
    const mockRes = { id: "doc-1", title: "test.pdf" };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockRes });

    const file = new File(["dummy content"], "test.pdf", { type: "application/pdf" });
    const res = await poApi.uploadDocument("po-1", file, "po_original");

    expect(apiClient.post).toHaveBeenCalledWith(
      "/purchase-orders/po-1/documents/upload",
      expect.any(FormData),
      {
        params: { purpose: "po_original" },
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    expect(res).toEqual(mockRes);
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
