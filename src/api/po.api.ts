import apiClient from "@/lib/apiClient";
import type {
  CreatePoInput,
  CreatePoProductInput,
  LinkPoDocumentInput,
  PaginatedPoResponse,
  PoQuery,
  PurchaseOrderDetail,
  PurchaseOrderDocumentItem,
  PurchaseOrderProductItem,
  PurchaseOrderStatusHistoryItem,
  UpdatePoInput,
  UpdatePoProductInput,
  UpdatePoStatusInput,
  PoDocumentPreviewResponse,
} from "@/types/po";

export const poApi = {
  async findAll(query: PoQuery = {}): Promise<PaginatedPoResponse> {
    const params: Record<string, string | number> = {};
    if (query.search) params.search = query.search;
    if (query.poCode) params.poCode = query.poCode;
    if (query.customerId) params.customerId = query.customerId;
    if (query.status) params.status = query.status;
    if (query.dateFrom) params.dateFrom = query.dateFrom;
    if (query.dateTo) params.dateTo = query.dateTo;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;
    if (query.sortBy) params.sortBy = query.sortBy;
    if (query.sortOrder) params.sortOrder = query.sortOrder;

    const response = await apiClient.get<PaginatedPoResponse>("/purchase-orders", {
      params,
    });
    return response.data;
  },

  async findOne(id: string): Promise<PurchaseOrderDetail> {
    const response = await apiClient.get<PurchaseOrderDetail>(
      `/purchase-orders/${id}`,
    );
    return response.data;
  },

  async create(input: CreatePoInput): Promise<PurchaseOrderDetail> {
    const response = await apiClient.post<PurchaseOrderDetail>(
      "/purchase-orders",
      input,
    );
    return response.data;
  },

  async update(id: string, input: UpdatePoInput): Promise<PurchaseOrderDetail> {
    const response = await apiClient.patch<PurchaseOrderDetail>(
      `/purchase-orders/${id}`,
      input,
    );
    return response.data;
  },

  async updateStatus(
    id: string,
    input: UpdatePoStatusInput,
  ): Promise<PurchaseOrderDetail> {
    const response = await apiClient.patch<PurchaseOrderDetail>(
      `/purchase-orders/${id}/status`,
      input,
    );
    return response.data;
  },

  async getHistory(id: string): Promise<PurchaseOrderStatusHistoryItem[]> {
    const response = await apiClient.get<PurchaseOrderStatusHistoryItem[]>(
      `/purchase-orders/${id}/history`,
    );
    return response.data;
  },

  async linkDocument(
    id: string,
    input: LinkPoDocumentInput,
  ): Promise<PurchaseOrderDetail> {
    const response = await apiClient.post<PurchaseOrderDetail>(
      `/purchase-orders/${id}/documents`,
      input,
    );
    return response.data;
  },

  async unlinkDocument(id: string, documentId: string): Promise<void> {
    await apiClient.delete(`/purchase-orders/${id}/documents/${documentId}`);
  },

  async updateDocumentPurpose(
    id: string,
    documentId: string,
    purpose: string,
  ): Promise<PurchaseOrderDetail> {
    const response = await apiClient.patch<PurchaseOrderDetail>(
      `/purchase-orders/${id}/documents/${documentId}`,
      { purpose },
    );
    return response.data;
  },

  async getProducts(id: string): Promise<PurchaseOrderProductItem[]> {
    const response = await apiClient.get<PurchaseOrderProductItem[]>(
      `/purchase-orders/${id}/products`,
    );
    return response.data;
  },

  async addProduct(
    id: string,
    input: CreatePoProductInput,
  ): Promise<PurchaseOrderProductItem> {
    const response = await apiClient.post<PurchaseOrderProductItem>(
      `/purchase-orders/${id}/products`,
      input,
    );
    return response.data;
  },

  async updateProduct(
    id: string,
    productId: string,
    input: UpdatePoProductInput,
  ): Promise<PurchaseOrderProductItem> {
    const response = await apiClient.patch<PurchaseOrderProductItem>(
      `/purchase-orders/${id}/products/${productId}`,
      input,
    );
    return response.data;
  },

  async removeProduct(id: string, productId: string): Promise<void> {
    await apiClient.delete(`/purchase-orders/${id}/products/${productId}`);
  },

  async uploadDocument(
    id: string,
    file: File,
    purpose: string = "po_original",
  ): Promise<PurchaseOrderDocumentItem> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<PurchaseOrderDocumentItem>(
      `/purchase-orders/${id}/documents/upload`,
      formData,
      {
        params: { purpose },
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

  async uploadDocuments(
    id: string,
    files: File[],
    purpose: string = "po_original",
  ): Promise<PurchaseOrderDocumentItem[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const response = await apiClient.post<PurchaseOrderDocumentItem[]>(
      `/purchase-orders/${id}/documents/upload-multiple`,
      formData,
      {
        params: { purpose },
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

  async previewDocument(
    poId: string,
    documentId: string,
    versionId?: string,
  ): Promise<PoDocumentPreviewResponse> {
    const response = await apiClient.get<PoDocumentPreviewResponse>(
      `/purchase-orders/${poId}/documents/${documentId}/preview`,
      { params: versionId ? { versionId } : undefined },
    );
    return response.data;
  },

  // ─── Fit Import Preview ───────────────────────────────────────────────────

  async getImportFitPreview(
    styleId: string,
  ): Promise<import("@/types/po").ImportFitPreviewResponse> {
    const response = await apiClient.get<import("@/types/po").ImportFitPreviewResponse>(
      `/purchase-orders/import-fit-preview/${styleId}`,
    );
    return response.data;
  },

  // ─── PO Product Detail & Sub-resources ─────────────────────────────────────

  async getProductDetail(
    poId: string,
    productId: string,
  ): Promise<import("@/types/po").PurchaseOrderProductDetail> {
    const response = await apiClient.get<import("@/types/po").PurchaseOrderProductDetail>(
      `/purchase-orders/${poId}/products/${productId}`,
    );
    return response.data;
  },

  async updateProductStatus(
    poId: string,
    productId: string,
    status: string,
    reason?: string,
  ): Promise<PurchaseOrderProductItem> {
    const response = await apiClient.patch<PurchaseOrderProductItem>(
      `/purchase-orders/${poId}/products/${productId}/status`,
      { status, reason },
    );
    return response.data;
  },

  async linkProductDocument(
    poId: string,
    productId: string,
    documentId: string,
    purpose?: string,
  ): Promise<void> {
    await apiClient.post(
      `/purchase-orders/${poId}/products/${productId}/documents/${documentId}`,
      { purpose },
      { params: purpose ? { purpose } : undefined },
    );
  },

  async updateProductDocumentPurpose(
    poId: string,
    productId: string,
    documentId: string,
    purpose: string,
  ): Promise<void> {
    await apiClient.patch(
      `/purchase-orders/${poId}/products/${productId}/documents/${documentId}/purpose`,
      { purpose },
    );
  },

  async unlinkProductDocument(
    poId: string,
    productId: string,
    documentId: string,
  ): Promise<void> {
    await apiClient.delete(
      `/purchase-orders/${poId}/products/${productId}/documents/${documentId}`,
    );
  },

  async uploadProductDocument(
    poId: string,
    productId: string,
    file: File,
    purpose: string = "other",
  ): Promise<import("@/types/po").ProductDocumentItem> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<import("@/types/po").ProductDocumentItem>(
      `/purchase-orders/${poId}/products/${productId}/documents/upload`,
      formData,
      {
        params: { purpose },
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

  async uploadProductDocumentVersion(
    poId: string,
    productId: string,
    documentId: string,
    file: File,
    changeReason?: string,
  ): Promise<import("@/types/po").ProductDocumentItem> {
    const formData = new FormData();
    formData.append("file", file);
    if (changeReason?.trim()) {
      formData.append("changeReason", changeReason.trim());
    }
    const response = await apiClient.post<import("@/types/po").ProductDocumentItem>(
      `/purchase-orders/${poId}/products/${productId}/documents/${documentId}/versions`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

  async getProductOperationSteps(
    poId: string,
    productId: string,
  ): Promise<import("@/types/po").ProductOperationStep[]> {
    const response = await apiClient.get<import("@/types/po").ProductOperationStep[]>(
      `/purchase-orders/${poId}/products/${productId}/operation-steps`,
    );
    return response.data;
  },

  async saveProductOperationSteps(
    poId: string,
    productId: string,
    input: import("@/types/po").SaveProductOperationStepsInput,
  ): Promise<import("@/types/po").ProductOperationStep[]> {
    const response = await apiClient.put<import("@/types/po").ProductOperationStep[]>(
      `/purchase-orders/${poId}/products/${productId}/operation-steps`,
      input,
    );
    return response.data;
  },

  async getProductSampleRounds(
    poId: string,
    productId: string,
  ): Promise<import("@/types/po").ProductSampleRound[]> {
    const response = await apiClient.get<import("@/types/po").ProductSampleRound[]>(
      `/purchase-orders/${poId}/products/${productId}/sample-rounds`,
    );
    return response.data;
  },

  async createProductSampleRound(
    poId: string,
    productId: string,
    input: import("@/types/po").CreateProductSampleRoundInput,
  ): Promise<import("@/types/po").ProductSampleRound> {
    const response = await apiClient.post<import("@/types/po").ProductSampleRound>(
      `/purchase-orders/${poId}/products/${productId}/sample-rounds`,
      input,
    );
    return response.data;
  },

  async getProductProductionDoc(
    poId: string,
    productId: string,
  ): Promise<import("@/types/po").ProductProductionDoc> {
    const response = await apiClient.get<import("@/types/po").ProductProductionDoc>(
      `/purchase-orders/${poId}/products/${productId}/production-doc`,
    );
    return response.data;
  },

  async updateProductProductionDoc(
    poId: string,
    productId: string,
    data: Record<string, unknown>,
  ): Promise<import("@/types/po").ProductProductionDoc> {
    const response = await apiClient.patch<import("@/types/po").ProductProductionDoc>(
      `/purchase-orders/${poId}/products/${productId}/production-doc`,
      data,
    );
    return response.data;
  },
};
