import { cleanup, render, screen } from "@testing-library/react";
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
});
