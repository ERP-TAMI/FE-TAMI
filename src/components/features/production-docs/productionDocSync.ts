import type { BomLineItem } from "@/types/bom";
import type { StyleProductionDocDetail } from "@/types/production-doc";

export interface ProductionDocSyncSelection {
  image: boolean;
  accessories: boolean;
}

export function buildProductProductionDocSyncPayload(
  productImageKey: string | null | undefined,
  bomLines: Pick<BomLineItem, "materialNameSnapshot" | "orderIndex">[] | null | undefined,
  selection: ProductionDocSyncSelection,
): Partial<Pick<StyleProductionDocDetail, "section1ImageUrl" | "section2Accessories">> {
  const accessoryNames = (bomLines ?? [])
    .slice()
    .sort((left, right) => left.orderIndex - right.orderIndex)
    .map((line) => line.materialNameSnapshot.trim())
    .filter(Boolean);

  const payload: Partial<
    Pick<StyleProductionDocDetail, "section1ImageUrl" | "section2Accessories">
  > = {};
  if (selection.image) payload.section1ImageUrl = productImageKey || null;
  if (selection.accessories) {
    payload.section2Accessories = accessoryNames.length > 0 ? accessoryNames.join("\n") : null;
  }
  return payload;
}
