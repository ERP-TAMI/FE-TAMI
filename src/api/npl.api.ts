import apiClient from "@/lib/apiClient";
import type { NplListItem, NplObjectType, NplQueryFilter, RawBomItem } from "@/types/npl";

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
    colorName: raw.colorName ?? null,
    status: raw.status,
    version: raw.version,
    totalCostPerUnit:
      raw.totalCostPerUnit != null
        ? typeof raw.totalCostPerUnit === "string"
          ? parseFloat(raw.totalCostPerUnit)
          : raw.totalCostPerUnit
        : null,
    createdAt: raw.createdAt,
    poId: raw.poId ?? "",
    imageUrl: null,
  };
}

export const nplApi = {
  /**
   * Fetch all BOM items from backend `GET /boms`.
   * Returns normalized NplListItem[].
   */
  getNplList: async (filter?: NplQueryFilter): Promise<NplListItem[]> => {
    const res = await apiClient.get<RawBomItem[]>("/boms", { params: filter });
    const items = Array.isArray(res.data)
      ? res.data
      : (res.data as unknown as { data?: RawBomItem[] })?.data ?? [];
    return items.map(toNplItem);
  },
};
