import apiClient from "@/lib/apiClient";

export type UploadEntityType = "style" | "purchase-order";

export interface PresignUploadResult {
  objectKey: string;
  uploadUrl: string;
  expiresIn: number;
}

export interface UploadImageParams {
  entityType: UploadEntityType;
  entityId: string;
  purpose: string;
  file: File;
}

export interface UploadImageResult {
  objectKey: string;
  // Short-lived URL for immediate optimistic display right after upload.
  // Never persist this — resolve a fresh one from the entity's own GET
  // response instead, it expires.
  previewUrl: string;
}

export const uploadsApi = {
  presign: async (params: UploadImageParams): Promise<PresignUploadResult> => {
    const res = await apiClient.post<PresignUploadResult>("/storage/uploads/presign", {
      entityType: params.entityType,
      entityId: params.entityId,
      purpose: params.purpose,
      fileName: params.file.name,
      mimeType: params.file.type,
      sizeBytes: params.file.size,
    });
    return res.data;
  },

  uploadToS3: async (uploadUrl: string, file: File): Promise<void> => {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!res.ok) {
      throw new Error(`Tải tệp lên thất bại (HTTP ${res.status}).`);
    }
  },

  getViewUrl: async (objectKey: string): Promise<string> => {
    const res = await apiClient.get<{ url: string; expiresIn: number }>(
      "/storage/uploads/view-url",
      { params: { objectKey } },
    );
    return res.data.url;
  },

  uploadImage: async (params: UploadImageParams): Promise<UploadImageResult> => {
    const presign = await uploadsApi.presign(params);
    await uploadsApi.uploadToS3(presign.uploadUrl, params.file);
    const previewUrl = await uploadsApi.getViewUrl(presign.objectKey);
    return { objectKey: presign.objectKey, previewUrl };
  },
};
