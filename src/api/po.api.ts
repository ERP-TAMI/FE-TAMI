import apiClient from "@/lib/apiClient";
import type {
  CreatePoInput,
  CreatePoProductInput,
  LinkPoDocumentInput,
  PaginatedPoResponse,
  PaginatedResult,
  PoDocumentPreviewResponse,
  PoDocumentQuery,
  PoProductQuery,
  PoQuery,
  PurchaseOrderDetail,
  PurchaseOrderDocumentItem,
  PurchaseOrderProductItem,
  UpdatePoInput,
  UpdatePoProductInput,
  UpdatePoStatusInput,
} from "@/types/po";

interface PresignPoDocumentResult {
  objectKey: string;
  uploadUrl: string;
  expiresIn: number;
}

/** Đo 9 tệp: 1 luồng 55,7s — 3 luồng 21,4s — 5 luồng ~7s; trên 5 không nhanh thêm. */
const UPLOAD_CONCURRENCY = 5;

export interface UploadProgress {
  done: number;
  total: number;
  fileName: string;
}

export interface UploadDocumentsOptions {
  concurrency?: number;
  onProgress?: (progress: UploadProgress) => void;
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

  async getDocuments(
    id: string,
    query: PoDocumentQuery = {},
  ): Promise<PaginatedResult<PurchaseOrderDocumentItem>> {
    const response = await apiClient.get<
      PaginatedResult<PurchaseOrderDocumentItem>
    >(`/purchase-orders/${id}/documents`, { params: query });
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

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/purchase-orders/${id}`);
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

  async getProducts(
    id: string,
    query: PoProductQuery = {},
  ): Promise<PaginatedResult<PurchaseOrderProductItem>> {
    const response = await apiClient.get<
      PaginatedResult<PurchaseOrderProductItem>
    >(`/purchase-orders/${id}/products`, { params: query });
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

  /**
   * Tải nhiều tệp cùng lúc.
   *
   * Đi qua đúng luồng presign → PUT S3 → confirm như `uploadDocument`. Trước
   * đây hàm này gọi `documents/upload-multiple` (multipart), mà endpoint đó
   * lưu tệp xuống ổ đĩa của server trong khi đường đọc luôn ký URL S3 — hệ quả
   * là mọi tệp tải lên theo lô đều không mở xem được.
   *
   * Chạy tuần tự chứ không Promise.all: mỗi tệp là 3 lượt gọi mạng, bắn song
   * song một lô lớn dễ làm nghẽn cả trình duyệt lẫn S3.
   */
  async uploadDocuments(
    id: string,
    files: File[],
    purpose: string = "po_original",
    options: UploadDocumentsOptions = {},
  ): Promise<PurchaseOrderDocumentItem[]> {
    const { concurrency = UPLOAD_CONCURRENCY, onProgress } = options;
    const uploaded: PurchaseOrderDocumentItem[] = new Array(files.length);
    let done = 0;
    let next = 0;

    const worker = async () => {
      for (;;) {
        const index = next++;
        if (index >= files.length) return;
        const file = files[index];
        uploaded[index] = await poApi.uploadDocument(id, file, purpose);
        done += 1;
        onProgress?.({ done, total: files.length, fileName: file.name });
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(concurrency, files.length) }, worker),
    );
    return uploaded;
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

  async getProductColors(
    poId: string,
    productId: string,
  ): Promise<import("@/types/po").ProductColorsResponse> {
    const response = await apiClient.get<import("@/types/po").ProductColorsResponse>(
      `/purchase-orders/${poId}/products/${productId}/colors`,
    );
    return response.data;
  },

  async getProductDocuments(
    poId: string,
    productId: string,
    purpose?: string,
  ): Promise<import("@/types/po").ProductDocumentItem[]> {
    const response = await apiClient.get<import("@/types/po").ProductDocumentItem[]>(
      `/purchase-orders/${poId}/products/${productId}/documents`,
      { params: purpose ? { purpose } : undefined },
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

  // ─── Product Document Uploads (S3 presign/confirm) ─────────────────────────
  // Mirrors the top-level presignDocument/confirmDocument/uploadDocument
  // pattern above, scoped to a single PO product. Reuses poApi.uploadToS3 for
  // the raw S3 PUT so the fetch-based upload helper isn't duplicated.

  async presignProductDocument(
    poId: string,
    productId: string,
    file: File,
    purpose: string,
  ): Promise<PresignPoDocumentResult> {
    const response = await apiClient.post<PresignPoDocumentResult>(
      `/purchase-orders/${poId}/products/${productId}/documents/presign`,
      {
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        purpose,
      },
    );
    return response.data;
  },

  async confirmProductDocument(
    poId: string,
    productId: string,
    objectKey: string,
    file: File,
    purpose: string,
  ): Promise<import("@/types/po").ProductDocumentItem> {
    const response = await apiClient.post<import("@/types/po").ProductDocumentItem>(
      `/purchase-orders/${poId}/products/${productId}/documents/confirm`,
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

  async uploadProductDocument(
    poId: string,
    productId: string,
    file: File,
    purpose: string = "other",
  ): Promise<import("@/types/po").ProductDocumentItem> {
    const presign = await poApi.presignProductDocument(poId, productId, file, purpose);
    await poApi.uploadToS3(presign.uploadUrl, file);
    return poApi.confirmProductDocument(poId, productId, presign.objectKey, file, purpose);
  },

  async confirmProductDocumentVersion(
    poId: string,
    productId: string,
    documentId: string,
    objectKey: string,
    file: File,
    purpose: string,
    changeReason: string,
    evidence?: File,
    evidenceObjectKey?: string,
  ): Promise<import("@/types/po").ProductDocumentItem> {
    const url = `/purchase-orders/${poId}/products/${productId}/documents/${documentId}/versions/confirm`;
    const response = await apiClient.post<import("@/types/po").ProductDocumentItem>(url, {
      objectKey,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      purpose,
      changeReason: changeReason.trim(),
      ...(evidence && evidenceObjectKey ? {
        evidenceObjectKey,
        evidenceFileName: evidence.name,
        evidenceMimeType: evidence.type,
      } : {}),
    });
    return response.data;
  },

  async uploadProductDocumentVersion(
    poId: string,
    productId: string,
    documentId: string,
    file: File,
    purpose: string,
    changeReason: string,
    evidence?: File,
  ): Promise<import("@/types/po").ProductDocumentItem> {
    const presign = await poApi.presignProductDocument(poId, productId, file, purpose);
    await poApi.uploadToS3(presign.uploadUrl, file);
    const evidencePresign = evidence
      ? await poApi.presignProductDocument(poId, productId, evidence, purpose)
      : null;
    if (evidence && evidencePresign) {
      await poApi.uploadToS3(evidencePresign.uploadUrl, evidence);
    }
    return poApi.confirmProductDocumentVersion(
      poId,
      productId,
      documentId,
      presign.objectKey,
      file,
      purpose,
      changeReason,
      evidence,
      evidencePresign?.objectKey,
    );
  },

  async uploadPoDocumentVersion(
    poId: string,
    documentId: string,
    file: File,
    purpose: string,
    changeReason: string,
    evidence?: File,
  ): Promise<PurchaseOrderDocumentItem> {
    const presign = await poApi.presignDocument(poId, file, purpose);
    await poApi.uploadToS3(presign.uploadUrl, file);
    const evidencePresign = evidence
      ? await poApi.presignDocument(poId, evidence, purpose)
      : null;
    if (evidence && evidencePresign) {
      await poApi.uploadToS3(evidencePresign.uploadUrl, evidence);
    }
    const response = await apiClient.post<PurchaseOrderDocumentItem>(
      `/purchase-orders/${poId}/documents/${documentId}/versions/confirm`,
      {
        objectKey: presign.objectKey,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        purpose,
        changeReason: changeReason.trim(),
        ...(evidence && evidencePresign ? {
          evidenceObjectKey: evidencePresign.objectKey,
          evidenceFileName: evidence.name,
          evidenceMimeType: evidence.type,
        } : {}),
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

  async updateProductSampleRound(
    poId: string,
    productId: string,
    roundId: string,
    input: import("@/types/po").UpdateProductSampleRoundInput,
  ): Promise<import("@/types/po").ProductSampleRound> {
    const response = await apiClient.patch<import("@/types/po").ProductSampleRound>(
      `/purchase-orders/${poId}/products/${productId}/sample-rounds/${roundId}`,
      input,
    );
    return response.data;
  },

  async presignProductSampleImage(
    poId: string,
    productId: string,
    roundId: string,
    file: File,
  ): Promise<import("@/types/po").PresignProductSampleImageResponse> {
    const response = await apiClient.post<import("@/types/po").PresignProductSampleImageResponse>(
      `/purchase-orders/${poId}/products/${productId}/sample-rounds/${roundId}/images/presign`,
      { fileName: file.name, mimeType: file.type, sizeBytes: file.size },
    );
    return response.data;
  },

  async uploadProductSampleImageToS3(uploadUrl: string, file: File): Promise<void> {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!res.ok) {
      throw new Error(`Tải ảnh lên thất bại (HTTP ${res.status}).`);
    }
  },

  async confirmProductSampleImage(
    poId: string,
    productId: string,
    roundId: string,
    payload: { objectKey: string; fileName: string; mimeType: string; sizeBytes: number },
  ): Promise<import("@/types/po").ProductSampleImage> {
    const response = await apiClient.post<import("@/types/po").ProductSampleImage>(
      `/purchase-orders/${poId}/products/${productId}/sample-rounds/${roundId}/images/confirm`,
      payload,
    );
    return response.data;
  },

  async removeProductSampleImage(
    poId: string,
    productId: string,
    roundId: string,
    imageId: string,
  ): Promise<void> {
    await apiClient.delete(
      `/purchase-orders/${poId}/products/${productId}/sample-rounds/${roundId}/images/${imageId}`,
    );
  },

  async getProductSampleImageDownloadUrl(
    poId: string,
    productId: string,
    roundId: string,
    imageId: string,
  ): Promise<{ url: string; expiresIn: number }> {
    const response = await apiClient.get<{ url: string; expiresIn: number }>(
      `/purchase-orders/${poId}/products/${productId}/sample-rounds/${roundId}/images/${imageId}/download-url`,
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
