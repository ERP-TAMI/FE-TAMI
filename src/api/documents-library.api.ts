import apiClient from "@/lib/apiClient";
import type {
  DocumentFolderItem,
  DocumentLibraryItem,
  DocumentLibraryPageResult,
  DocumentLibrarySearchPageResult,
  DocumentVersionItem,
  DocumentViewUrlResponse,
  PresignDocumentUploadResponse,
} from "@/types/document-library";
import type { StyleDocumentItem } from "@/types/style-document";

export const documentsLibraryApi = {
  list: async (
    params: {
      folderId?: string;
      search?: string;
      archived?: boolean;
      assigned?: boolean;
      page?: number;
      limit?: number;
      category?: "word" | "excel" | "pdf" | "image";
      sortOrder?: "newest" | "oldest";
    } = {},
  ) => {
    const res = await apiClient.get<DocumentLibraryPageResult>("/documents", {
      params,
    });
    return res.data;
  },

  search: async (params: { search: string; page?: number; limit?: number }) => {
    const res = await apiClient.get<DocumentLibrarySearchPageResult>("/documents/search", {
      params,
    });
    return res.data;
  },

  moveDocuments: async (documentIds: string[], targetFolderId: string) => {
    const res = await apiClient.post<{ movedCount: number; targetFolderId: string }>(
      "/documents/move",
      { documentIds, targetFolderId },
    );
    return res.data;
  },

  listFolders: async (params: { parentId?: string; search?: string } = {}) => {
    const res = await apiClient.get<DocumentFolderItem[]>("/documents/folders", {
      params,
    });
    return res.data;
  },

  createFolder: async (folderName: string, parentId?: string) => {
    const res = await apiClient.post<DocumentFolderItem>("/documents/folders", {
      folderName,
      ...(parentId ? { parentId } : {}),
    });
    return res.data;
  },

  renameFolder: async (folderId: string, folderName: string) => {
    const res = await apiClient.patch<DocumentFolderItem>(`/documents/folders/${folderId}`, {
      folderName,
    });
    return res.data;
  },

  deleteFolder: async (folderId: string) => {
    await apiClient.delete(`/documents/folders/${folderId}`);
  },

  presignInitialUpload: async (folderId: string, file: File) => {
    const res = await apiClient.post<PresignDocumentUploadResponse>("/documents/upload/presign", {
      folderId,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    });
    return res.data;
  },

  confirmInitialUpload: async (folderId: string, file: File, objectKey: string) => {
    const res = await apiClient.post<DocumentLibraryItem>("/documents/upload/confirm", {
      folderId,
      objectKey,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    });
    return res.data;
  },

  presignVersionUpload: async (documentId: string, file: File) => {
    const res = await apiClient.post<PresignDocumentUploadResponse>(
      `/documents/${documentId}/versions/presign`,
      { fileName: file.name, mimeType: file.type, sizeBytes: file.size },
    );
    return res.data;
  },

  confirmVersionUpload: async (
    documentId: string,
    file: File,
    objectKey: string,
    changeReason?: string,
  ) => {
    const res = await apiClient.post<DocumentVersionItem>(
      `/documents/${documentId}/versions/confirm`,
      {
        objectKey,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        changeReason,
      },
    );
    return res.data;
  },

  listVersions: async (documentId: string) => {
    const res = await apiClient.get<DocumentVersionItem[]>(`/documents/${documentId}/versions`);
    return res.data;
  },

  uploadToStorage: async (
    uploadUrl: string,
    file: File,
    onProgress?: (loadedBytes: number) => void,
  ) =>
    new Promise<void>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("PUT", uploadUrl);
      request.setRequestHeader("Content-Type", file.type);
      request.upload.addEventListener("progress", (event) => {
        onProgress?.(Math.min(event.loaded, file.size));
      });
      request.addEventListener("load", () => {
        if (request.status >= 200 && request.status < 300) {
          onProgress?.(file.size);
          resolve();
        } else {
          reject(new Error(`Tải tệp lên thất bại (HTTP ${request.status}).`));
        }
      });
      request.addEventListener("error", () =>
        reject(new Error("Không thể kết nối khi tải tệp lên.")),
      );
      request.addEventListener("abort", () => reject(new Error("Đã hủy tải tệp lên.")));
      request.send(file);
    }),

  getViewUrl: async (
    documentId: string,
    options: { versionId?: string; download?: boolean } = {},
  ) => {
    const res = await apiClient.get<DocumentViewUrlResponse>(`/documents/${documentId}/view-url`, {
      params: {
        ...(options.versionId ? { versionId: options.versionId } : {}),
        ...(options.download ? { download: "true" } : {}),
      },
    });
    return res.data;
  },

  archive: async (documentId: string) => {
    await apiClient.delete(`/documents/${documentId}`);
  },

  assignToStyle: async (styleId: string, documentIds: string[]) => {
    const res = await apiClient.post<StyleDocumentItem[]>(
      `/styles/${styleId}/documents/from-library`,
      { documentIds },
    );
    return res.data;
  },
};
