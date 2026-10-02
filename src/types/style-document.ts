export interface StyleDocumentItem {
  documentId: string;
  documentVersionId: string;
  versionNo: number;
  isCurrentVersion: boolean;
  fileName: string;
  mimeType: string;
  byteSize: number;
  uploadedAt: string;
  purpose: string;
}

export interface PresignStyleDocumentResponse {
  objectKey: string;
  uploadUrl: string;
  expiresIn: number;
}

export interface StyleDocumentViewUrlResponse {
  url: string;
  expiresIn: number;
}
