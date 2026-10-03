import { cleanup, fireEvent, render as rtlRender, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { StyleDocumentsTab } from "./StyleDocumentsTab";
import type { StyleDocumentItem } from "@/types/style-document";

// EntityHistoryButton (rendered in the tab's toolbar) reaches a real
// useQuery internally, unlike the mocked useStyleDocuments hooks below.
function render(ui: ReactElement) {
  return rtlRender(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);
}

const showToastMock = vi.hoisted(() => vi.fn());
const uploadMutateAsyncMock = vi.hoisted(() => vi.fn());
const removeMutateAsyncMock = vi.hoisted(() => vi.fn());
const getViewUrlMock = vi.hoisted(() => vi.fn());
const useStyleDocumentsMock = vi.hoisted(() => vi.fn());
const listLibraryDocumentsMock = vi.hoisted(() => vi.fn());
const assignLibraryDocumentsMock = vi.hoisted(() => vi.fn());

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

vi.mock("@/api/documents-library.api", () => ({
  documentsLibraryApi: {
    list: (...args: unknown[]) => listLibraryDocumentsMock(...args),
    assignToStyle: (...args: unknown[]) => assignLibraryDocumentsMock(...args),
  },
}));

vi.mock("@/store/authStore", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      user: {
        permissions: ["master_data.styles.manage", "master_data.documents.assign"],
      },
    }),
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
    documentVersionId: "version-1",
    versionNo: 1,
    isCurrentVersion: true,
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

  it("rejects a disallowed file client-side without calling upload", async () => {
    useStyleDocumentsMock.mockReturnValue({ data: [], isLoading: false });
    render(<StyleDocumentsTab styleId={STYLE_ID} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const badFile = new File(["x"], "virus.exe", { type: "application/octet-stream" });
    fireEvent.change(input, { target: { files: [badFile] } });

    await waitFor(() => expect(showToastMock).toHaveBeenCalled());
    expect(uploadMutateAsyncMock).not.toHaveBeenCalled();
  });

  it("uploads a valid file selected through the input", async () => {
    useStyleDocumentsMock.mockReturnValue({ data: [], isLoading: false });
    uploadMutateAsyncMock.mockResolvedValue({ documentId: "doc-2" });
    render(<StyleDocumentsTab styleId={STYLE_ID} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const goodFile = new File(["x"], "report.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [goodFile] } });

    await waitFor(() => expect(uploadMutateAsyncMock).toHaveBeenCalledWith(goodFile));
  });

  it("opens the presigned view-url in a new tab when Xem is clicked", async () => {
    useStyleDocumentsMock.mockReturnValue({ data: mockDocuments, isLoading: false });
    getViewUrlMock.mockResolvedValue({ url: "https://s3.example/get", expiresIn: 3600 });
    const fakePopup = { location: { href: "" } };
    const openSpy = vi.spyOn(window, "open").mockReturnValue(fakePopup as unknown as Window);

    render(<StyleDocumentsTab styleId={STYLE_ID} />);
    fireEvent.click(screen.getByRole("button", { name: /Xem/i }));

    expect(openSpy).toHaveBeenCalledWith("", "_blank");

    await waitFor(() => expect(getViewUrlMock).toHaveBeenCalledWith(STYLE_ID, "doc-1", false));
    await waitFor(() => expect(fakePopup.location.href).toBe("https://s3.example/get"));
  });

  it("requests download=true when Tải xuống is clicked", async () => {
    useStyleDocumentsMock.mockReturnValue({ data: mockDocuments, isLoading: false });
    getViewUrlMock.mockResolvedValue({ url: "https://s3.example/get", expiresIn: 3600 });
    vi.spyOn(window, "open").mockImplementation(() => null);

    render(<StyleDocumentsTab styleId={STYLE_ID} />);
    fireEvent.click(screen.getByRole("button", { name: /Tải xuống/i }));

    await waitFor(() => expect(getViewUrlMock).toHaveBeenCalledWith(STYLE_ID, "doc-1", true));
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

  it("assigns a selected current warehouse document to the Fit style", async () => {
    useStyleDocumentsMock.mockReturnValue({ data: [], isLoading: false });
    const invalidateQueriesSpy = vi.spyOn(QueryClient.prototype, "invalidateQueries");
    listLibraryDocumentsMock.mockResolvedValue({
      data: [
        {
          documentId: "library-doc-1",
          title: "spec.pdf",
          folderId: "folder-1",
          folderName: "RD",
          versionId: "version-4",
          versionNo: 4,
          fileName: "spec.pdf",
          mimeType: "application/pdf",
          byteSize: 1024,
          uploadedAt: "2026-01-01T10:00:00.000Z",
          isAssigned: false,
        },
      ],
      meta: { total: 1, totalBytes: 1024, page: 1, limit: 100, totalPages: 1 },
    });
    assignLibraryDocumentsMock.mockResolvedValue([]);

    render(<StyleDocumentsTab styleId={STYLE_ID} />);
    fireEvent.click(screen.getByRole("button", { name: "Gán từ kho" }));

    const checkbox = await screen.findByRole("checkbox");
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole("button", { name: "Gán vào mẫu Fit" }));

    await waitFor(() =>
      expect(assignLibraryDocumentsMock).toHaveBeenCalledWith(STYLE_ID, ["library-doc-1"]),
    );
    await waitFor(() =>
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["style-documents", STYLE_ID],
      }),
    );
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ["document-library"] });
    expect(showToastMock).toHaveBeenCalledWith("Đã gán 1 tài liệu vào mẫu Fit.");
  });

  it("paginates warehouse documents and keeps selections across pages", async () => {
    useStyleDocumentsMock.mockReturnValue({ data: [], isLoading: false });
    const documentOnPageOne = {
      documentId: "library-doc-page-1",
      title: "page-one.pdf",
      folderId: "folder-1",
      folderName: "RD",
      versionId: "version-1",
      versionNo: 1,
      fileName: "page-one.pdf",
      mimeType: "application/pdf",
      byteSize: 1024,
      uploadedAt: "2026-01-01T10:00:00.000Z",
      isAssigned: false,
    };
    const documentOnPageTwo = {
      ...documentOnPageOne,
      documentId: "library-doc-page-2",
      title: "page-two.pdf",
      versionId: "version-2",
      fileName: "page-two.pdf",
    };
    listLibraryDocumentsMock.mockImplementation(async ({ page = 1 } = {}) => ({
      data: [page === 1 ? documentOnPageOne : documentOnPageTwo],
      meta: { total: 2, totalBytes: 2048, page, limit: 20, totalPages: 2 },
    }));
    assignLibraryDocumentsMock.mockResolvedValue([]);

    render(<StyleDocumentsTab styleId={STYLE_ID} />);
    fireEvent.click(screen.getByRole("button", { name: "Gán từ kho" }));
    fireEvent.click(await screen.findByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Tài liệu trang tiếp theo" }));

    expect(await screen.findByText("page-two.pdf")).toBeTruthy();
    expect(screen.getByText("Đã chọn 1 tài liệu")).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Gán vào mẫu Fit" }));

    await waitFor(() =>
      expect(assignLibraryDocumentsMock).toHaveBeenCalledWith(STYLE_ID, [
        "library-doc-page-1",
        "library-doc-page-2",
      ]),
    );
    expect(listLibraryDocumentsMock).toHaveBeenCalledWith({ page: 2, limit: 20 });
  });
});
