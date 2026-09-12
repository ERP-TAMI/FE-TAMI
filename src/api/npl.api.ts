import apiClient from "@/lib/apiClient";
import type { NplListItem, NplObjectType, RawBomItem } from "@/types/npl";

/**
 * Normalize raw BOM entity → NplListItem.
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

export const nplApi = {
  /**
   * Fetch all BOM items from backend `GET /boms`.
   * Returns normalized NplListItem[].
   */
  getNplList: async (): Promise<NplListItem[]> => {
    const res = await apiClient.get<RawBomItem[]>("/boms");
    const items = Array.isArray(res.data)
      ? res.data
      : (res.data as unknown as { data?: RawBomItem[] })?.data ?? [];
    return items.map(toNplItem);
  },
};
