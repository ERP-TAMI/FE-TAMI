import { useMutation } from "@tanstack/react-query";
import { uploadsApi, type UploadImageParams, type UploadImageResult } from "@/api/uploads.api";

export function useUploadImage() {
  return useMutation<UploadImageResult, Error, UploadImageParams>({
    mutationFn: (params: UploadImageParams) => uploadsApi.uploadImage(params),
  });
}
