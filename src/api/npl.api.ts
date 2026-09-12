import apiClient from "@/lib/apiClient";
import type {
  NplListItem,
  NplObjectType,
  NplQueryFilter,
  PaginatedNplResponse,
  PaginationMeta,
  RawBomItem,
} from "@/types/npl";

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
   * Fetch paginated BOM items from backend `GET /boms`.
   * Returns { data: NplListItem[], meta: PaginationMeta }.
   */
  getNplList: async (filter?: NplQueryFilter): Promise<PaginatedNplResponse> => {
    const res = await apiClient.get<
      | { data: RawBomItem[]; meta: PaginationMeta }
      | RawBomItem[]
    >("/boms", { params: filter });

    const rawPayload = res.data;
    if (
      rawPayload &&
      !Array.isArray(rawPayload) &&
      Array.isArray(rawPayload.data) &&
      rawPayload.meta
    ) {
      return {
        data: rawPayload.data.map(toNplItem),
        meta: rawPayload.meta,
      };
    }

    // Fallback if backend returned raw array
    const rawItems = Array.isArray(rawPayload)
      ? rawPayload
      : (rawPayload as { data?: RawBomItem[] })?.data ?? [];
    const limit = filter?.limit ?? (rawItems.length || 10);
    const page = filter?.page ?? 1;

    return {
      data: rawItems.map(toNplItem),
      meta: {
        total: rawItems.length,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(rawItems.length / limit)),
      },
    };
  },
};
