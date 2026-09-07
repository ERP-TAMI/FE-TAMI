const PROHIBITED_EXTENSIONS = /\.(exe|bat|cmd|sh|msi|vbs|scr|ps1)$/i;

/**
 * Validate a document file client-side before uploading.
 * Returns an error message when invalid, or `null` when the file is OK.
 */
export function validateDocumentFile(file: File, maxMb = 20): string | null {
  if (PROHIBITED_EXTENSIONS.test(file.name)) {
    return "Định dạng file này không được phép đính kèm vì lý do bảo mật.";
  }
  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return `Kích thước tài liệu vượt quá ${maxMb}MB.`;
  }
  return null;
}
