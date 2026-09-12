import apiClient from "@/lib/apiClient";
import type { NplListItem, NplObjectType, RawBomItem } from "@/types/npl";

/**
 * Normalize raw BOM entity → NplListItem.
 * Currently all BOMs are PO-linked; when BE adds Fit BOMs
 * the objectType mapping will be extended.
 */
function toNplItem(raw: RawBomItem): NplListItem {
  const objectType: NplObjectType =
    raw.objectType ?? (raw.poId ? "po" : "fit");
  return {
    id: raw.id,
    objectType,
    objectCode: raw.objectCode ?? raw.poId ?? raw.styleCode ?? "—",
    styleCode: raw.styleCode,
    productName: raw.productName,
    colorName: raw.colorName,
    status: raw.status,
    version: raw.version,
    totalCostPerUnit:
      typeof raw.totalCostPerUnit === "string"
        ? parseFloat(raw.totalCostPerUnit)
        : raw.totalCostPerUnit ?? 0,
    createdAt: raw.createdAt,
    poId: raw.poId,
  };
}

const FALLBACK_MOCK_NPL: NplListItem[] = [
  {
    id: "npl-mock-fit-1",
    objectType: "fit",
    objectCode: "FIT-2026-001",
    styleCode: "STY-POLO-01",
    productName: "Áo Polo Nam Classic Fit",
    colorName: "Navy",
    status: "Approved",
    version: 1,
    totalCostPerUnit: 145000,
    createdAt: "2026-09-08T08:30:00.000Z",
    poId: "",
    imageUrl: "/images/product/product-01.jpg",
  },
  {
    id: "npl-mock-fit-2",
    objectType: "fit",
    objectCode: "FIT-2026-002",
    styleCode: "STY-JEAN-02",
    productName: "Quần Jeans Nữ Slim Fit",
    colorName: "Xanh Nhạt",
    status: "Wait_RD",
    version: 1,
    totalCostPerUnit: 210000,
    createdAt: "2026-09-09T09:15:00.000Z",
    poId: "",
    imageUrl: "/images/product/product-02.jpg",
  },
  {
    id: "npl-mock-po-1",
    objectType: "po",
    objectCode: "PO-2026-001",
    styleCode: "STY-POLO-01",
    productName: "Áo Polo Nam Classic Fit (PO)",
    colorName: "Trắng",
    status: "Approved",
    version: 2,
    totalCostPerUnit: 138000,
    createdAt: "2026-09-10T10:00:00.000Z",
    poId: "po-1",
    imageUrl: "/images/product/product-03.jpg",
  },
  {
    id: "npl-mock-po-2",
    objectType: "po",
    objectCode: "PO-2026-002",
    styleCode: "STY-JACKET-01",
    productName: "Áo Khoác Gió Nam Thể Thao",
    colorName: "Đen",
    status: "Wait_Price",
    version: 1,
    totalCostPerUnit: 320000,
    createdAt: "2026-09-11T14:20:00.000Z",
    poId: "po-2",
    imageUrl: "/images/product/product-04.jpg",
  },
  {
    id: "npl-mock-po-3",
    objectType: "po",
    objectCode: "PO-2026-003",
    styleCode: "STY-TSHIRT-03",
    productName: "Áo Thun Cổ Tròn Unisex",
    colorName: "Xám Tiêu",
    status: "Draft",
    version: 1,
    totalCostPerUnit: 85000,
    createdAt: "2026-09-12T07:00:00.000Z",
    poId: "po-3",
    imageUrl: "/images/product/product-05.jpg",
  },
];

export const nplApi = {
  /**
   * Fetch all BOM items from `GET /boms`.
   * Returns normalized NplListItem[].
   * Falls back to mock data when BE endpoint is not yet implemented (e.g. 404).
   */
  getNplList: async (): Promise<NplListItem[]> => {
    try {
      const res = await apiClient.get<RawBomItem[]>("/boms");
      const items = Array.isArray(res.data) ? res.data : [];
      return items.length > 0 ? items.map(toNplItem) : FALLBACK_MOCK_NPL;
    } catch {
      // Backend /boms endpoint is not yet implemented, return fallback mock items
      return FALLBACK_MOCK_NPL;
    }
  },
};
