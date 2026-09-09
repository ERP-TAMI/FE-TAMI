import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StyleDocumentsTab } from "./StyleDocumentsTab";
import type { StyleDocumentItem } from "@/types/style-document";

const showToastMock = vi.hoisted(() => vi.fn());
const uploadMutateAsyncMock = vi.hoisted(() => vi.fn());
const removeMutateAsyncMock = vi.hoisted(() => vi.fn());
const getViewUrlMock = vi.hoisted(() => vi.fn());
const useStyleDocumentsMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: null, showToast: showToastMock, hideToast: vi.fn() }),
}));

vi.mock("@/hooks/useStyleDocuments", () => ({
  useStyleDocuments: () => useStyleDocumentsMock(),
  useUploadStyleDocument: () => ({ mutateAsync: uploadMutateAsyncMock }),
  useRemoveStyleDocument: () => ({
    mutateAsync: removeMutateAsyncMock,
    isPending: false,
  }),
}));

vi.mock("@/api/style-documents.api", () => ({
  styleDocumentsApi: {
    getViewUrl: (...args: unknown[]) => getViewUrlMock(...args),
  },
}));

const STYLE_ID = "8f3a1c2e-4b6a-4e1a-9c2d-1a2b3c4d5e6f";

const mockDocuments: StyleDocumentItem[] = [
  {
    documentId: "doc-1",
    fileName: "tech-pack.pdf",
    mimeType: "application/pdf",
    byteSize: 204800,
    uploadedAt: "2026-01-01T10:00:00.000Z",
    purpose: "fit_attachment",
  },
];

describe("StyleDocumentsTab", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows the empty state when there are no documents", () => {
    useStyleDocumentsMock.mockReturnValue({ data: [], isLoading: false });

    render(<StyleDocumentsTab styleId={STYLE_ID} />);

    expect(screen.getByText("Chưa có tài liệu nào được đính kèm.")).toBeTruthy();
  });

  it("lists a document with its name and formatted size", () => {
    useStyleDocumentsMock.mockReturnValue({ data: mockDocuments, isLoading: false });

    render(<StyleDocumentsTab styleId={STYLE_ID} />);

    expect(screen.getByText("tech-pack.pdf")).toBeTruthy();
    expect(screen.getByText("200.0 KB")).toBeTruthy();
  });

  it("rejects a disallowed file client-side without staging or uploading it", async () => {
    useStyleDocumentsMock.mockReturnValue({ data: [], isLoading: false });
    render(<StyleDocumentsTab styleId={STYLE_ID} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const badFile = new File(["x"], "virus.exe", { type: "application/octet-stream" });
    fireEvent.change(input, { target: { files: [badFile] } });

    await waitFor(() => expect(showToastMock).toHaveBeenCalled());
    expect(screen.queryByText("virus.exe")).toBeNull();
    expect(uploadMutateAsyncMock).not.toHaveBeenCalled();
  });

  it("stages a selected file and waits for confirmation before uploading", async () => {
    useStyleDocumentsMock.mockReturnValue({ data: [], isLoading: false });
    uploadMutateAsyncMock.mockResolvedValue({ documentId: "doc-2" });
    render(<StyleDocumentsTab styleId={STYLE_ID} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const goodFile = new File(["x"], "report.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [goodFile] } });

    expect(await screen.findByText("report.pdf")).toBeTruthy();
    expect(uploadMutateAsyncMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Tải lên/i }));

    await waitFor(() => expect(uploadMutateAsyncMock).toHaveBeenCalledWith(goodFile));
  });

  it("removes a staged file before confirming, so it never gets uploaded", async () => {
    useStyleDocumentsMock.mockReturnValue({ data: [], isLoading: false });
    render(<StyleDocumentsTab styleId={STYLE_ID} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const goodFile = new File(["x"], "report.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [goodFile] } });
    expect(await screen.findByText("report.pdf")).toBeTruthy();

    fireEvent.click(screen.getByTitle("Bỏ tệp này"));

    expect(screen.queryByText("report.pdf")).toBeNull();
    expect(uploadMutateAsyncMock).not.toHaveBeenCalled();
  });

  it("opens the presigned view-url in a new tab when Xem is clicked", async () => {
    useStyleDocumentsMock.mockReturnValue({ data: mockDocuments, isLoading: false });
    getViewUrlMock.mockResolvedValue({ url: "https://s3.example/get", expiresIn: 3600 });
    const fakePopup = { location: { href: "" } };
    const openSpy = vi.spyOn(window, "open").mockReturnValue(fakePopup as unknown as Window);

    render(<StyleDocumentsTab styleId={STYLE_ID} />);
    fireEvent.click(screen.getByRole("button", { name: /Xem/i }));

    // window.open must happen synchronously with the click (same user gesture) so
    // real browsers don't block it as a popup once the URL resolves asynchronously.
    expect(openSpy).toHaveBeenCalledWith("", "_blank");

    await waitFor(() =>
      expect(getViewUrlMock).toHaveBeenCalledWith(STYLE_ID, "doc-1", false),
    );
    await waitFor(() => expect(fakePopup.location.href).toBe("https://s3.example/get"));
  });

  it("requests download=true when Tải xuống is clicked", async () => {
    useStyleDocumentsMock.mockReturnValue({ data: mockDocuments, isLoading: false });
    getViewUrlMock.mockResolvedValue({ url: "https://s3.example/get", expiresIn: 3600 });
    vi.spyOn(window, "open").mockImplementation(() => null);

    render(<StyleDocumentsTab styleId={STYLE_ID} />);
    fireEvent.click(screen.getByRole("button", { name: /Tải xuống/i }));

    await waitFor(() =>
      expect(getViewUrlMock).toHaveBeenCalledWith(STYLE_ID, "doc-1", true),
    );
  });

  it("removes only the link after confirming, and shows a success toast", async () => {
    useStyleDocumentsMock.mockReturnValue({ data: mockDocuments, isLoading: false });
    removeMutateAsyncMock.mockResolvedValue(undefined);

    render(<StyleDocumentsTab styleId={STYLE_ID} />);
    fireEvent.click(screen.getByTitle("Gỡ khỏi mẫu Fit"));
    fireEvent.click(screen.getByRole("button", { name: "Gỡ tài liệu" }));

    await waitFor(() => expect(removeMutateAsyncMock).toHaveBeenCalledWith("doc-1"));
    expect(showToastMock).toHaveBeenCalledWith("Đã gỡ tài liệu khỏi mẫu Fit.");
  });
});
