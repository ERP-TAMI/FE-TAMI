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
} from "@/types/po";

interface PresignPoDocumentResult {
  objectKey: string;
  uploadUrl: string;
  expiresIn: number;
}

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

  async presignDocument(
    id: string,
    file: File,
    purpose: string,
  ): Promise<PresignPoDocumentResult> {
    const response = await apiClient.post<PresignPoDocumentResult>(
      `/purchase-orders/${id}/documents/presign`,
      {
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        purpose,
      },
    );
    return response.data;
  },

  async uploadToS3(uploadUrl: string, file: File): Promise<void> {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!res.ok) {
      throw new Error(`Tải tệp lên thất bại (HTTP ${res.status}).`);
    }
  },

  async confirmDocument(
    id: string,
    objectKey: string,
    file: File,
    purpose: string,
  ): Promise<PurchaseOrderDocumentItem> {
    const response = await apiClient.post<PurchaseOrderDocumentItem>(
      `/purchase-orders/${id}/documents/confirm`,
      {
        objectKey,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        purpose,
      },
    );
    return response.data;
  },

  async uploadDocument(
    id: string,
    file: File,
    purpose: string = "po_original",
  ): Promise<PurchaseOrderDocumentItem> {
    const presign = await poApi.presignDocument(id, file, purpose);
    await poApi.uploadToS3(presign.uploadUrl, file);
    return poApi.confirmDocument(id, presign.objectKey, file, purpose);
  },

  async uploadDocuments(
    id: string,
    files: File[],
    purpose: string = "po_original",
  ): Promise<PurchaseOrderDocumentItem[]> {
    return Promise.all(files.map((file) => poApi.uploadDocument(id, file, purpose)));
  },
};
