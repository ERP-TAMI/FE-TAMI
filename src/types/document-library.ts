export interface DocumentFolderItem {
  id: string;
  parentId: string | null;
  folderName: string;
  parentFolderName: string | null;
  createdAt: string;
  documentCount: number;
  hasChildren: boolean;
}

export interface DocumentLibraryItem {
  documentId: string;
  title: string;
  folderId: string;
  folderName: string;
  versionId: string;
  versionNo: number;
  fileName: string;
  mimeType: string;
  byteSize: number;
  uploadedAt: string;
  isAssigned: boolean;
}

export interface DocumentLibraryPageResult {
  data: DocumentLibraryItem[];
  meta: {
    total: number;
    totalBytes: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DocumentVersionItem {
  versionId: string;
  versionNo: number;
  fileName: string;
  mimeType: string;
  byteSize: number;
  uploadedAt: string;
  uploadedBy: string | null;
  changeReason: string | null;
  isCurrent: boolean;
}

export interface PresignDocumentUploadResponse {
  objectKey: string;
  uploadUrl: string;
  expiresIn: number;
}

export interface DocumentViewUrlResponse {
  url: string;
  expiresIn: number;
}
