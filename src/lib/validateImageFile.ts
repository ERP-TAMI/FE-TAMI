import { validateDocumentFile } from "./validateDocumentFile";

const ALLOWED_IMAGE_TYPES = /^image\/(jpeg|jpg|png|gif|webp)$/i;

/**
 * Validate an image file client-side before uploading.
 * Returns an error message when invalid, or `null` when the file is OK.
 */
export function validateImageFile(file: File, maxMb = 10): string | null {
  if (!ALLOWED_IMAGE_TYPES.test(file.type)) {
    return "Chỉ chấp nhận file hình ảnh (JPEG, PNG, GIF, WebP).";
  }
  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return `Kích thước file vượt quá ${maxMb}MB.`;
  }
  return null;
}

export { validateDocumentFile };
