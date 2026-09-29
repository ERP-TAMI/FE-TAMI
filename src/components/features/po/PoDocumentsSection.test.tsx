import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PoDocumentsSection } from "./PoDocumentsSection";

const documentItem = {
  documentId: "document-1",
  documentCode: "DOC-1",
  title: "Tech pack",
  purpose: "tech_pack",
  linkedAt: "2026-09-01T00:00:00.000Z",
  fileUrl: "https://files.example.test/tech-pack.pdf",
  fileName: "tech-pack.pdf",
  fileSize: 1024,
};

function renderDocuments(allowDownload: boolean) {
  return render(
    <PoDocumentsSection
      poCode="PO-2026-001"
      documents={[documentItem]}
      isLocked
      isPending={false}
      allowDownload={allowDownload}
      onUpload={vi.fn().mockResolvedValue(undefined)}
      onUnlink={vi.fn().mockResolvedValue(undefined)}
    />,
  );
}

function renderReadOnlyDocuments(documents: (typeof documentItem)[]) {
  return render(
    <PoDocumentsSection
      poCode="PO-2026-001"
      documents={documents}
      isLocked
      isPending={false}
      allowDownload={false}
      onUpload={vi.fn().mockResolvedValue(undefined)}
      onUnlink={vi.fn().mockResolvedValue(undefined)}
    />,
  );
}

describe("PoDocumentsSection download access", () => {
  afterEach(cleanup);

  it("keeps document preview available when download is disabled", () => {
    renderDocuments(false);

    expect(screen.getByRole("link", { name: /Xem/ })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Tải về/ })).toBeNull();
  });

  it("continues to allow downloads in the normal PO detail mode", () => {
    renderDocuments(true);

    expect(screen.getByRole("link", { name: /Tải về/ })).toBeTruthy();
  });

  it("does not report a lock or suggest uploading in the read-only empty state", () => {
    renderReadOnlyDocuments([]);

    expect(screen.getByText("Chưa có tài liệu nào được đính kèm.")).toBeTruthy();
    expect(screen.queryByText(/đơn hàng đã khóa/i)).toBeNull();
    expect(screen.queryByText(/khung tải lên/i)).toBeNull();
  });

  it("does not suggest uploading when a read-only category is empty", () => {
    renderReadOnlyDocuments([documentItem]);
    fireEvent.click(screen.getByRole("button", { name: /PO Tổng/ }));

    expect(screen.getByText("Chưa có tài liệu nào thuộc danh mục PO Tổng.")).toBeTruthy();
    expect(screen.queryByText(/khung tải lên/i)).toBeNull();
  });
});
