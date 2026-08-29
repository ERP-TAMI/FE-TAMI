import apiClient from "@/lib/apiClient";

export interface UploadResponse {
  url: string;
  filename: string;
  originalname: string;
  size: number;
  mimetype: string;
}

export const uploadsApi = {
  uploadImage: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await apiClient.post<UploadResponse>("/uploads", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },
};
