import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FileTypeIcon, getFileMeta } from "./FileTypeIcon";

describe("getFileMeta", () => {
  it("identifies excel file types", () => {
    const metaXlsx = getFileMeta("BangCongDoan_Style_test.xlsx");
    expect(metaXlsx.category).toBe("excel");
    expect(metaXlsx.label).toBe("Bảng tính Excel");

    const metaCsv = getFileMeta("data.csv");
    expect(metaCsv.category).toBe("excel");
    expect(metaCsv.label).toBe("Bảng CSV");
  });

  it("identifies word file types", () => {
    const metaDocx = getFileMeta("PRACTICAL EXAMINATION.docx");
    expect(metaDocx.category).toBe("word");
    expect(metaDocx.label).toBe("Văn bản Word");
  });

  it("identifies image file types", () => {
    const metaPng = getFileMeta("KhanhDUY.png");
    expect(metaPng.category).toBe("image");
    expect(metaPng.label).toBe("Hình ảnh");

    const metaJpg = getFileMeta("photo.jpg");
    expect(metaJpg.category).toBe("image");
  });

  it("identifies pdf file types", () => {
    const metaPdf = getFileMeta("contract.pdf");
    expect(metaPdf.category).toBe("pdf");
    expect(metaPdf.label).toBe("Tài liệu PDF");
  });

  it("identifies archive file types", () => {
    const metaZip = getFileMeta("backup.zip");
    expect(metaZip.category).toBe("archive");
    expect(metaZip.label).toBe("Tệp nén");
  });

  it("identifies cad and techpack file types", () => {
    const metaDxf = getFileMeta("pattern.dxf");
    expect(metaDxf.category).toBe("cad");
  });

  it("falls back gracefully for unknown or empty file names", () => {
    const metaUnknown = getFileMeta("unknown.xyz");
    expect(metaUnknown.category).toBe("other");

    const metaEmpty = getFileMeta("");
    expect(metaEmpty.category).toBe("other");

    const metaNull = getFileMeta(null);
    expect(metaNull.category).toBe("other");
  });
});

describe("FileTypeIcon", () => {
  it("renders a badge with file type title", () => {
    render(<FileTypeIcon fileName="sample.xlsx" size="md" />);
    const badge = screen.getByTitle("Bảng tính Excel (.xlsx)");
    expect(badge).not.toBeNull();
  });

  it("renders icon-only variant", () => {
    const { container } = render(
      <FileTypeIcon fileName="image.png" variant="icon-only" />,
    );
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("renders with custom className and hover effects", () => {
    render(
      <FileTypeIcon
        fileName="document.docx"
        size="lg"
        withHover
        className="test-custom-class"
      />,
    );
    const badge = screen.getByTitle("Văn bản Word (.docx)");
    expect(badge.className).toContain("test-custom-class");
    expect(badge.className).toContain("h-11");
  });
});
