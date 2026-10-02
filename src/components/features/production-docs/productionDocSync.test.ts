import { describe, expect, it } from "vitest";
import { buildProductProductionDocSyncPayload } from "./productionDocSync";

const syncBoth = { image: true, accessories: true };

describe("buildProductProductionDocSyncPayload", () => {
  it("copies the current product image and accessories in BOM row order", () => {
    expect(
      buildProductProductionDocSyncPayload(
        "product-image-key",
        [
          { materialNameSnapshot: " Cúc áo ", orderIndex: 2 },
          { materialNameSnapshot: "Khóa kéo", orderIndex: 1 },
        ],
        syncBoth,
      ),
    ).toEqual({
      section1ImageUrl: "product-image-key",
      section2Accessories: "Khóa kéo\nCúc áo",
    });
  });

  it("clears both synced fields when the product has no image or BOM lines", () => {
    expect(buildProductProductionDocSyncPayload(null, [], syncBoth)).toEqual({
      section1ImageUrl: null,
      section2Accessories: null,
    });
  });

  it("ignores blank material names", () => {
    expect(
      buildProductProductionDocSyncPayload(
        "product-image-key",
        [{ materialNameSnapshot: "  ", orderIndex: 0 }],
        syncBoth,
      ),
    ).toEqual({
      section1ImageUrl: "product-image-key",
      section2Accessories: null,
    });
  });

  it("updates only the selected image and leaves accessories unchanged", () => {
    expect(
      buildProductProductionDocSyncPayload(
        "product-image-key",
        [{ materialNameSnapshot: "Khóa kéo", orderIndex: 0 }],
        { image: true, accessories: false },
      ),
    ).toEqual({ section1ImageUrl: "product-image-key" });
  });

  it("updates only selected accessories and leaves the image unchanged", () => {
    expect(
      buildProductProductionDocSyncPayload(
        "product-image-key",
        [{ materialNameSnapshot: "Khóa kéo", orderIndex: 0 }],
        { image: false, accessories: true },
      ),
    ).toEqual({ section2Accessories: "Khóa kéo" });
  });
});
