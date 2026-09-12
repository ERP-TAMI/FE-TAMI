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

  getViewUrl: async (
    objectKey: string,
    opts?: { download?: boolean; fileName?: string },
  ): Promise<string> => {
    const res = await apiClient.get<{ url: string; expiresIn: number }>(
      "/storage/uploads/view-url",
      {
        params: {
          objectKey,
          ...(opts?.download ? { download: "true" } : {}),
          ...(opts?.fileName ? { fileName: opts.fileName } : {}),
        },
      },
    );
    return res.data.url;
  },

  /**
   * True only for a raw S3 object key (no scheme, e.g.
   * "purchase-orders/<id>/documents/tech_pack/<uuid>.pdf"), as opposed to an
   * already-usable absolute/blob/data URL. Some endpoints (PO-product
   * documents) return the raw key as `fileUrl` instead of pre-signing it
   * server-side like the top-level PO document endpoints do — callers must
   * resolve it via `getViewUrl` before using it as an <img>/<a>/<iframe> src.
   */
  isRawObjectKey: (value?: string | null): value is string => {
    if (!value) return false;
    // Absolute URLs and legacy server-relative paths ("/uploads/...") are
    // already directly usable — only a bare key like
    // "purchase-orders/<id>/documents/tech_pack/<uuid>.pdf" needs resolving.
    return !/^(https?:|blob:|data:|\/)/i.test(value);
  },

  uploadImage: async (params: UploadImageParams): Promise<UploadImageResult> => {
    const presign = await uploadsApi.presign(params);
    await uploadsApi.uploadToS3(presign.uploadUrl, params.file);
    const previewUrl = await uploadsApi.getViewUrl(presign.objectKey);
    return { objectKey: presign.objectKey, previewUrl };
  },
};
