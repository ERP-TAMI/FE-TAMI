export interface StyleDocumentItem {
  documentId: string;
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
