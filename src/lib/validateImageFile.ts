const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = /^image\/(jpeg|jpg|png|gif|webp)$/i;

/**
 * Validate an image file client-side before uploading.
 * Returns an error message when invalid, or `null` when the file is OK.
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.test(file.type)) {
    return "Chỉ chấp nhận file hình ảnh (JPEG, PNG, GIF, WebP).";
  }
  if (file.size > MAX_IMAGE_FILE_SIZE) {
    return "Kích thước file vượt quá 5MB.";
  }
  return null;
}
