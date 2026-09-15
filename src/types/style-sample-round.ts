export type SampleStatus = "working" | "needs_revision" | "approved";

export interface StyleSampleImageItem {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
  orderIndex: number;
  uploadedAt: string;
}

export interface StyleSampleRoundItem {
  id: string;
  roundNo: number;
  sampleDate: string | null;
  feedback: string | null;
  status: SampleStatus;
  createdBy: string | null;
  createdAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  images: StyleSampleImageItem[];
}

export interface CreateStyleSampleRoundInput {
  sampleDate?: string;
  feedback?: string;
  status?: SampleStatus;
}

export interface UpdateStyleSampleRoundInput {
  sampleDate?: string;
  feedback?: string;
  status?: SampleStatus;
}

export interface PresignStyleSampleImageResponse {
  objectKey: string;
  uploadUrl: string;
  expiresIn: number;
}
