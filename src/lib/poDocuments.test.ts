import { describe, it, expect } from "vitest";
import {
  PO_DOCUMENT_CATEGORIES,
  detectDocumentPurpose,
  getDocumentCategoryInfo,
  getPurposeLabel,
} from "./poDocuments";

describe("poDocuments utilities", () => {
  it("should have all 5 expected categories: PO Tổng, PO Chi tiết, Ảnh mẫu, Techpack, Khác", () => {
    const keys = PO_DOCUMENT_CATEGORIES.map((c) => c.key);
    expect(keys).toEqual([
      "po_original",
      "production_doc",
      "sample_image",
      "tech_pack",
      "other",
    ]);
  });

  it("should auto-detect techpack files correctly", () => {
    expect(detectDocumentPurpose("Techpack_Style_A.xlsx")).toBe("tech_pack");
    expect(detectDocumentPurpose("tech_pack_2026.pdf")).toBe("tech_pack");
    expect(detectDocumentPurpose("TP-Áo-Polo.pdf")).toBe("tech_pack");
  });

  it("should auto-detect production detail files correctly", () => {
    expect(detectDocumentPurpose("PO_Chi_Tiet_San_Xuat.xlsx")).toBe("production_doc");
    expect(detectDocumentPurpose("Bang_congdoan_may.xlsx")).toBe("production_doc");
    expect(detectDocumentPurpose("Dinh_muc_san_xuat.pdf")).toBe("production_doc");
  });

  it("should auto-detect sample images correctly", () => {
    expect(detectDocumentPurpose("Anh_mau_that.png")).toBe("sample_image");
    expect(detectDocumentPurpose("Sample_Front.jpg")).toBe("sample_image");
    expect(detectDocumentPurpose("photo_ao_thun.webp")).toBe("sample_image");
  });

  it("should auto-detect Vietnamese filenames with accents", () => {
    expect(detectDocumentPurpose("Chi tiết đơn hàng.xlsx")).toBe("production_doc");
    expect(detectDocumentPurpose("Bảng định mức may.xlsx")).toBe("production_doc");
    expect(detectDocumentPurpose("Công đoạn sản xuất.xlsx")).toBe("production_doc");
    expect(detectDocumentPurpose("Ảnh mẫu áo polo.png")).toBe("sample_image");
  });

  it("should default unknown files to po_original", () => {
    expect(detectDocumentPurpose("Don_Hang_PO_99.xlsx")).toBe("po_original");
    expect(detectDocumentPurpose("contract.pdf")).toBe("po_original");
  });

  it("should return correct category metadata and labels", () => {
    expect(getDocumentCategoryInfo("po_original").shortLabel).toBe("PO Tổng");
    expect(getDocumentCategoryInfo("tech_pack").shortLabel).toBe("Techpack");
    expect(getDocumentCategoryInfo("techpack").shortLabel).toBe("Techpack");
    expect(getDocumentCategoryInfo("production_doc").shortLabel).toBe("PO Chi tiết");
    expect(getDocumentCategoryInfo("sample_image").shortLabel).toBe("Ảnh mẫu");
    expect(getPurposeLabel("sample_image")).toBe("Ảnh mẫu");
    expect(getDocumentCategoryInfo("other").shortLabel).toBe("Khác");
  });
});
