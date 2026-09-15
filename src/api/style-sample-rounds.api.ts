import apiClient from "@/lib/apiClient";
import type {
  CreateStyleSampleRoundInput,
  PresignStyleSampleImageResponse,
  StyleSampleImageItem,
  StyleSampleRoundItem,
  UpdateStyleSampleRoundInput,
} from "@/types/style-sample-round";

export const styleSampleRoundsApi = {
  list: async (styleId: string): Promise<StyleSampleRoundItem[]> => {
    const res = await apiClient.get<StyleSampleRoundItem[]>(
      `/styles/${styleId}/sample-rounds`,
    );
    return res.data;
  },

  create: async (
    styleId: string,
    input: CreateStyleSampleRoundInput,
  ): Promise<StyleSampleRoundItem> => {
    const res = await apiClient.post<StyleSampleRoundItem>(
      `/styles/${styleId}/sample-rounds`,
      input,
    );
    return res.data;
  },

  update: async (
    styleId: string,
    roundId: string,
    input: UpdateStyleSampleRoundInput,
  ): Promise<StyleSampleRoundItem> => {
    const res = await apiClient.patch<StyleSampleRoundItem>(
      `/styles/${styleId}/sample-rounds/${roundId}`,
      input,
    );
    return res.data;
  },

  presignImage: async (
    styleId: string,
    roundId: string,
    file: File,
  ): Promise<PresignStyleSampleImageResponse> => {
    const res = await apiClient.post<PresignStyleSampleImageResponse>(
      `/styles/${styleId}/sample-rounds/${roundId}/images/presign`,
      { fileName: file.name, mimeType: file.type, sizeBytes: file.size },
    );
    return res.data;
  },

  uploadToS3: async (uploadUrl: string, file: File): Promise<void> => {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!res.ok) {
      throw new Error(`Tải ảnh lên thất bại (HTTP ${res.status}).`);
    }
  },

  confirmImage: async (
    styleId: string,
    roundId: string,
    payload: {
      objectKey: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
    },
  ): Promise<StyleSampleImageItem> => {
    const res = await apiClient.post<StyleSampleImageItem>(
      `/styles/${styleId}/sample-rounds/${roundId}/images/confirm`,
      payload,
    );
    return res.data;
  },

  removeImage: async (
    styleId: string,
    roundId: string,
    imageId: string,
  ): Promise<void> => {
    await apiClient.delete(
      `/styles/${styleId}/sample-rounds/${roundId}/images/${imageId}`,
    );
  },

  getImageDownloadUrl: async (
    styleId: string,
    roundId: string,
    imageId: string,
  ): Promise<{ url: string; expiresIn: number }> => {
    const res = await apiClient.get<{ url: string; expiresIn: number }>(
      `/styles/${styleId}/sample-rounds/${roundId}/images/${imageId}/download-url`,
    );
    return res.data;
  },
};
