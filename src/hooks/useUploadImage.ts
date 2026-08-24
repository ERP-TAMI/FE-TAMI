import { useMutation } from "@tanstack/react-query";
import { uploadsApi, type UploadResponse } from "@/api/uploads.api";

export function useUploadImage() {
  return useMutation<UploadResponse, Error, File>({
    mutationFn: (file: File) => uploadsApi.uploadImage(file),
  });
}
