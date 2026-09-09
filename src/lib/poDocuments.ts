export interface DocumentCategoryDef {
  key: string;
  label: string;
  shortLabel: string;
  badgeClass: string;
  tabActiveClass: string;
  description: string;
}

export const PO_DOCUMENT_CATEGORIES: DocumentCategoryDef[] = [
  {
    key: "po_original",
    label: "PO Tổng",
    shortLabel: "PO Tổng",
    badgeClass:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50",
    tabActiveClass: "bg-brand-600 text-white border-brand-600 shadow-xs",
    description: "File đơn hàng PO tổng thể, hợp đồng PO gốc từ khách hàng",
  },
  {
    key: "production_doc",
    label: "PO Chi tiết",
    shortLabel: "PO Chi tiết",
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50",
    tabActiveClass: "bg-brand-600 text-white border-brand-600 shadow-xs",
    description: "Bảng chi tiết công đoạn, định mức may, tài liệu kỹ thuật sản xuất",
  },
  {
    key: "sample_image",
    label: "Ảnh mẫu",
    shortLabel: "Ảnh mẫu",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50",
    tabActiveClass: "bg-brand-600 text-white border-brand-600 shadow-xs",
    description: "Hình ảnh mẫu sản phẩm thực tế, mẫu duyệt, ảnh chi tiết sản phẩm",
  },
  {
    key: "tech_pack",
    label: "Techpack",
    shortLabel: "Techpack",
    badgeClass:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50",
    tabActiveClass: "bg-brand-600 text-white border-brand-600 shadow-xs",
    description: "Tài liệu bảng thông số kỹ thuật, bảng rập may Techpack",
  },
  {
    key: "other",
    label: "Khác",
    shortLabel: "Khác",
    badgeClass:
      "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
    tabActiveClass: "bg-brand-600 text-white border-brand-600 shadow-xs",
    description: "Các chứng từ, bảng nguyên phụ liệu hoặc ghi chú khác",
  },
];

export function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export function detectDocumentPurpose(fileName: string): string {
  const lower = fileName.toLowerCase();
  const unaccented = removeVietnameseTones(lower);
  const normalized = unaccented.replace(/[_-]/g, " ");

  if (
    lower.includes("techpack") ||
    lower.includes("tech_pack") ||
    lower.includes("tp_") ||
    lower.includes("tp-") ||
    normalized.includes("tech pack") ||
    normalized.includes(" tp ") ||
    normalized.startsWith("tp ")
  ) {
    return "tech_pack";
  }
  if (
    normalized.includes("chi tiet") ||
    normalized.includes("chitiet") ||
    normalized.includes("cong doan") ||
    normalized.includes("congdoan") ||
    normalized.includes("dinh muc") ||
    normalized.includes("dinhmuc") ||
    normalized.includes("san xuat") ||
    normalized.includes("production")
  ) {
    return "production_doc";
  }
  if (
    normalized.includes("mau") ||
    normalized.includes("sample") ||
    normalized.includes("anh") ||
    [".png", ".jpg", ".jpeg", ".webp", ".gif"].some((ext) => lower.endsWith(ext))
  ) {
    return "sample_image";
  }
  if (
    lower.includes("npl") ||
    normalized.includes("nguyen lieu") ||
    normalized.includes("phu lieu") ||
    normalized.includes("vat tu") ||
    normalized.includes("vattu")
  ) {
    return "other";
  }
  if (
    lower.includes("po") ||
    lower.includes("don hang") ||
    normalized.includes("don hang") ||
    lower.includes("contract") ||
    lower.includes("hop dong") ||
    normalized.includes("hop dong") ||
    lower.includes("order")
  ) {
    return "po_original";
  }
  return "other";
}

export function getDocumentCategoryInfo(purpose: string): DocumentCategoryDef {
  const normalized = purpose === "techpack" ? "tech_pack" : purpose;
  return (
    PO_DOCUMENT_CATEGORIES.find((c) => c.key === normalized) ||
    PO_DOCUMENT_CATEGORIES[PO_DOCUMENT_CATEGORIES.length - 1]
  );
}

export function getPurposeLabel(purpose: string): string {
  return getDocumentCategoryInfo(purpose).shortLabel;
}
