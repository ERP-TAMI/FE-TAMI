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

export interface DocumentLibrarySearchPathItem {
  id: string;
  parentId: string | null;
  folderName: string;
}

export type DocumentLibrarySearchResult =
  | {
      kind: "folder";
      id: string;
      folderName: string;
      createdAt: string;
      path: DocumentLibrarySearchPathItem[];
    }
  | {
      kind: "file";
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
      path: DocumentLibrarySearchPathItem[];
    };

export interface DocumentLibrarySearchPageResult {
  data: DocumentLibrarySearchResult[];
  meta: {
    total: number;
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
