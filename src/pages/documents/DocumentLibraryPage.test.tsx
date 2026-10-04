import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { documentsLibraryApi } from "@/api/documents-library.api";
import { stylesApi } from "@/api/stylesApi";
import { useAuthStore } from "@/store/authStore";
import type {
  DocumentFolderItem,
  DocumentLibraryItem,
  DocumentLibraryPageResult,
} from "@/types/document-library";
import type { Style } from "@/types/style";
import DocumentLibraryPage from "./DocumentLibraryPage";

vi.mock("@/api/documents-library.api", () => ({
  documentsLibraryApi: {
    list: vi.fn(),
    search: vi.fn(),
    listFolders: vi.fn(),
    createFolder: vi.fn(),
    renameFolder: vi.fn(),
    deleteFolder: vi.fn(),
    presignInitialUpload: vi.fn(),
    confirmInitialUpload: vi.fn(),
    uploadToStorage: vi.fn(),
    presignVersionUpload: vi.fn(),
    confirmVersionUpload: vi.fn(),
    listVersions: vi.fn(),
    getViewUrl: vi.fn(),
    archive: vi.fn(),
    assignToStyle: vi.fn(),
  },
}));

vi.mock("@/api/stylesApi", () => ({
  stylesApi: { getStyles: vi.fn() },
}));

const rootFolder: DocumentFolderItem = {
  id: "root-1",
  parentId: null,
  folderName: "Bộ sưu tập",
  parentFolderName: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  documentCount: 2,
  hasChildren: true,
};

const childFolder: DocumentFolderItem = {
  id: "child-1",
  parentId: rootFolder.id,
  folderName: "Mùa hè",
  parentFolderName: rootFolder.folderName,
  createdAt: "2026-01-02T00:00:00.000Z",
  documentCount: 1,
  hasChildren: false,
};

function libraryPage(
  data: DocumentLibraryItem[],
  overrides: Partial<DocumentLibraryPageResult["meta"]> = {},
): DocumentLibraryPageResult {
  const limit = overrides.limit ?? 10;
  const total = overrides.total ?? data.length;
  return {
    data,
    meta: {
      total,
      totalBytes:
        overrides.totalBytes ?? data.reduce((sum, document) => sum + document.byteSize, 0),
      page: overrides.page ?? 1,
      limit,
      totalPages: overrides.totalPages ?? Math.max(1, Math.ceil(total / limit)),
    },
  };
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DocumentLibraryPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function selectDocumentStatus(status: "all" | "processing" | "assigned") {
  await openRootFolderContents();
  fireEvent.change(screen.getByRole("combobox", { name: "Trạng thái tài liệu" }), {
    target: { value: status },
  });
}

async function openRootFolderContents() {
  if (!screen.queryByRole("combobox", { name: "Trạng thái tài liệu" })) {
    const rootFolderButton = await screen.findByRole("button", {
      name: `Mở thư mục ${rootFolder.folderName}`,
    });
    fireEvent.click(rootFolderButton);
  }
  const listModeButton = await screen.findByRole("button", { name: "Dạng danh sách" });
  if (listModeButton?.getAttribute("aria-pressed") !== "true") {
    fireEvent.click(listModeButton!);
  }
}

beforeEach(() => {
  useAuthStore.setState({
    user: {
      id: "user-1",
      email: "tpkh@example.com",
      fullName: "TPKH",
      phone: null,
      roleCode: "TPKH",
      roleName: "Trưởng phòng Kế hoạch",
      permissions: [
        "master_data.documents.view",
        "master_data.documents.manage",
        "master_data.documents.assign",
      ],
      purchaseOrderMode: "FULL_ACCESS",
    },
  });
  vi.mocked(documentsLibraryApi.list).mockResolvedValue(libraryPage([]));
  vi.mocked(documentsLibraryApi.assignToStyle).mockResolvedValue([]);
  vi.mocked(stylesApi.getStyles).mockResolvedValue({
    data: [],
    meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
  });
  vi.mocked(documentsLibraryApi.listFolders).mockImplementation(async (params = {}) => {
    if (params.search) return [childFolder];
    if (params.parentId === rootFolder.id) return [childFolder];
    return [rootFolder];
  });
  vi.mocked(documentsLibraryApi.createFolder).mockImplementation(async (folderName, parentId) => ({
    ...childFolder,
    id: "new-folder",
    parentId: parentId ?? null,
    folderName,
    documentCount: 0,
    hasChildren: false,
  }));
  vi.mocked(documentsLibraryApi.renameFolder).mockResolvedValue(childFolder);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  useAuthStore.setState({ user: null });
});

describe("DocumentLibraryPage folder browser", () => {
  it("shows byte-level upload progress until files are confirmed and the library refreshes", async () => {
    const file = new File(["sample upload data"], "spec.pdf", { type: "application/pdf" });
    vi.mocked(documentsLibraryApi.presignInitialUpload).mockResolvedValue({
      objectKey: "documents/spec.pdf",
      uploadUrl: "https://storage.example/upload",
      expiresIn: 900,
    });
    vi.mocked(documentsLibraryApi.confirmInitialUpload).mockResolvedValue(
      {} as DocumentLibraryItem,
    );
    const uploadControl: { finish: (() => void) | null } = { finish: null };
    vi.mocked(documentsLibraryApi.uploadToStorage).mockImplementation(
      async (_uploadUrl, uploadFile, onProgress) => {
        onProgress?.(Math.floor(uploadFile.size / 2));
        await new Promise<void>((resolve) => {
          uploadControl.finish = () => {
            onProgress?.(uploadFile.size);
            resolve();
          };
        });
      },
    );

    const { container } = renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Mở thư mục Bộ sưu tập" }));
    fireEvent.click(screen.getByRole("button", { name: "Tạo mới" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Tải tài liệu" }));

    const uploadInput = container.querySelector('input[type="file"][multiple]');
    expect(uploadInput).toBeTruthy();
    fireEvent.change(uploadInput!, { target: { files: [file] } });

    await waitFor(() => expect(documentsLibraryApi.uploadToStorage).toHaveBeenCalled());
    const progressBar = screen.getByRole("progressbar", { name: "Tiến trình tải tài liệu lên" });
    const progressBeforeFinish = Number(progressBar.getAttribute("aria-valuenow"));
    expect(progressBeforeFinish).toBeGreaterThan(0);
    expect(progressBeforeFinish).toBeLessThan(100);
    expect(screen.getByText("Đang tải lên: spec.pdf")).toBeTruthy();

    uploadControl.finish?.();

    expect(await screen.findByText("Đã tải lên 1 tài liệu.")).toBeTruthy();
    expect(screen.queryByRole("progressbar", { name: "Tiến trình tải tài liệu lên" })).toBeNull();
    expect(documentsLibraryApi.confirmInitialUpload).toHaveBeenCalledWith(
      rootFolder.id,
      file,
      "documents/spec.pdf",
    );
  });

  it("opens the folder browser as the main page instead of showing a global file list", async () => {
    renderPage();

    const breadcrumb = screen.getByRole("navigation", { name: "Điều hướng phân cấp" });
    expect(within(breadcrumb).getByText("Quản lý Mẫu Fit")).toBeTruthy();
    expect(within(breadcrumb).getByText("Kho tài liệu")).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "Điều hướng kho tài liệu" })).toBeNull();
    expect(screen.queryByRole("tree", { name: "Cây thư mục tài liệu" })).toBeNull();
    expect(screen.queryByRole("table", { name: "Tài liệu trong kho" })).toBeNull();
    expect(screen.queryByText("Quản lý tập trung tài liệu dùng cho các mẫu Fit.")).toBeNull();
    expect(screen.queryByText("Thư mục được tải theo từng cấp")).toBeNull();
    const folderButton = await screen.findByRole("button", { name: "Mở thư mục Bộ sưu tập" });
    expect(folderButton).toBeTruthy();
    expect(documentsLibraryApi.listFolders).toHaveBeenCalledWith({});
    expect(documentsLibraryApi.listFolders).not.toHaveBeenCalledWith({ parentId: rootFolder.id });
    expect(documentsLibraryApi.list).not.toHaveBeenCalled();
  });

  it("opens folders one level at a time and shows the current folder tree", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Mở thư mục Bộ sưu tập" }));
    expect(await screen.findByRole("button", { name: "Mở thư mục Mùa hè" })).toBeTruthy();
    expect(documentsLibraryApi.listFolders).toHaveBeenCalledWith({ parentId: rootFolder.id });
    expect(screen.queryByRole("tree", { name: "Cây thư mục tài liệu" })).toBeNull();
    expect(screen.getByRole("navigation", { name: "Đường dẫn thư mục" }).textContent).toContain(
      "Bộ sưu tập",
    );
  });

  it("shows child folders and files together in the right-hand folder contents", async () => {
    vi.mocked(documentsLibraryApi.list).mockResolvedValue(
      libraryPage([
        {
          documentId: "folder-document",
          title: "tech-pack.pdf",
          folderId: rootFolder.id,
          folderName: rootFolder.folderName,
          versionId: "folder-document-version",
          versionNo: 1,
          fileName: "tech-pack.pdf",
          mimeType: "application/pdf",
          byteSize: 1024,
          uploadedAt: "2026-10-01T10:00:00.000Z",
          isAssigned: false,
        },
      ]),
    );

    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Mở thư mục Bộ sưu tập" }));

    const contents = await screen.findByRole("region", { name: "Nội dung Bộ sưu tập" });
    expect(within(contents).queryByText("Nội dung thư mục")).toBeNull();
    expect(within(contents).queryByText(/Dung lượng 1\.0 KB/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Dạng danh sách" }));
    const table = within(contents).getByRole("table", { name: "Tài liệu trong kho" });
    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getByRole("button", { name: "Mở thư mục Mùa hè" })).toBeTruthy();
    expect(within(rows[2]).getByRole("button", { name: "tech-pack.pdf" })).toBeTruthy();
    expect(screen.getAllByRole("table", { name: "Tài liệu trong kho" })).toHaveLength(1);
  });

  it("uses one search field to filter both folders and files", async () => {
    vi.mocked(documentsLibraryApi.search).mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
    });

    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Mở thư mục Bộ sưu tập" }));
    expect(await screen.findByRole("button", { name: "Mở thư mục Mùa hè" })).toBeTruthy();

    const searchInput = screen.getByRole("textbox", { name: "Tìm file hoặc thư mục" });
    expect(screen.queryByRole("textbox", { name: "Tìm tên file" })).toBeNull();
    fireEvent.change(searchInput, { target: { value: "tech" } });
    fireEvent.submit(searchInput.closest("form")!);

    await waitFor(() => {
      expect(documentsLibraryApi.search).toHaveBeenCalledWith({ search: "tech", page: 1, limit: 10 });
    });
  });

  it("offers all, assigned, and processing filters in the current folder toolbar", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Mở thư mục Bộ sưu tập" }));

    const statusFilter = await screen.findByRole("combobox", { name: "Trạng thái tài liệu" });
    expect(statusFilter).toHaveProperty("value", "all");
    expect(within(statusFilter).getByRole("option", { name: "Trạng thái: tất cả" })).toBeTruthy();
    expect(within(statusFilter).getByRole("option", { name: "Đã gán" })).toBeTruthy();
    expect(within(statusFilter).getByRole("option", { name: "Đang xử lý" })).toBeTruthy();
    expect(documentsLibraryApi.list).toHaveBeenLastCalledWith({
      folderId: rootFolder.id,
      page: 1,
      limit: 10,
    });
    await selectDocumentStatus("assigned");

    await waitFor(() => {
      expect(documentsLibraryApi.list).toHaveBeenCalledWith(
        expect.objectContaining({ folderId: rootFolder.id, assigned: true }),
      );
    });
    expect(screen.getByRole("combobox", { name: "Trạng thái tài liệu" })).toHaveProperty(
      "value",
      "assigned",
    );
  });

  it("expands and follows the folder hierarchy when selecting a deeper folder", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Mở thư mục Bộ sưu tập" }));
    fireEvent.click(await screen.findByRole("button", { name: "Mở thư mục Mùa hè" }));
    expect(screen.getByRole("navigation", { name: "Đường dẫn thư mục" }).textContent).toContain(
      "Mùa hè",
    );
  });

  it("creates a root folder inline even when another folder is selected", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Tạo mới" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Thư mục mới" }));

    const nameInput = await screen.findByRole("textbox", { name: "Tên thư mục mới" });
    fireEvent.change(nameInput, {
      target: { value: "Tài liệu mới" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thư mục mới" }));

    await waitFor(() => {
      expect(documentsLibraryApi.createFolder).toHaveBeenCalledWith("Tài liệu mới", undefined);
    });
    expect(await screen.findByText("Đã tạo thư mục.")).toBeTruthy();
  });

  it("creates a nested folder from the folder tree actions menu", async () => {
    renderPage();

    await screen.findByRole("button", { name: "Mở thư mục Bộ sưu tập" });
    fireEvent.click(screen.getByRole("button", { name: "Tùy chọn thư mục Bộ sưu tập" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Tạo thư mục con" }));

    const nameInput = await screen.findByRole("textbox", { name: "Tên thư mục mới" });
    fireEvent.change(nameInput, { target: { value: "Bản vẽ" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thư mục mới" }));

    await waitFor(() => {
      expect(documentsLibraryApi.createFolder).toHaveBeenCalledWith("Bản vẽ", rootFolder.id);
    });
    expect(await screen.findByText("Đã tạo thư mục.")).toBeTruthy();
  });

  it("renames a folder using the modal dialog", async () => {
    renderPage();

    await screen.findByRole("button", { name: "Mở thư mục Bộ sưu tập" });
    fireEvent.click(screen.getByRole("button", { name: "Tùy chọn thư mục Bộ sưu tập" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Đổi tên" }));

    const dialog = screen.getByRole("dialog", { name: "Đổi tên thư mục" });
    const nameInput = within(dialog).getByRole("textbox", { name: "Tên thư mục" });
    fireEvent.change(nameInput, { target: { value: "Bộ sưu tập mới" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() => {
      expect(documentsLibraryApi.renameFolder).toHaveBeenCalledWith(
        rootFolder.id,
        "Bộ sưu tập mới",
      );
    });
    expect(await screen.findByText("Đã đổi tên thư mục.")).toBeTruthy();
  });

  it("confirms how many documents will be affected before deleting a folder", async () => {
    vi.mocked(documentsLibraryApi.listFolders).mockResolvedValue([
      { ...rootFolder, hasChildren: false },
    ]);
    vi.mocked(documentsLibraryApi.deleteFolder).mockResolvedValue(undefined);

    renderPage();

    await screen.findByRole("button", { name: "Mở thư mục Bộ sưu tập" });
    fireEvent.click(screen.getByRole("button", { name: "Tùy chọn thư mục Bộ sưu tập" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Xóa thư mục" }));

    const dialog = screen.getByRole("dialog", { name: "Xóa thư mục và tài liệu?" });
    expect(dialog.textContent).toMatch(/đang chứa\s*2 tài liệu/i);
    expect(dialog.textContent).toMatch(/file gốc vẫn được giữ/i);

    fireEvent.click(within(dialog).getByRole("button", { name: "Xóa thư mục và 2 tài liệu" }));
    await waitFor(() =>
      expect(documentsLibraryApi.deleteFolder).toHaveBeenCalledWith(rootFolder.id),
    );
  });

  it("explains and prevents deleting a folder that still has child folders", async () => {
    renderPage();

    await screen.findByRole("button", { name: "Mở thư mục Bộ sưu tập" });
    fireEvent.click(screen.getByRole("button", { name: "Tùy chọn thư mục Bộ sưu tập" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Xóa thư mục" }));

    const dialog = screen.getByRole("dialog", { name: "Không thể xóa thư mục" });
    expect(dialog.textContent).toMatch(/đang chứa\s*2 tài liệu và có thư mục con/i);
    expect(
      (within(dialog).getByRole("button", { name: "Xóa thư mục" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(documentsLibraryApi.deleteFolder).not.toHaveBeenCalled();
  });

  it("hides folder management controls without the manage permission", async () => {
    useAuthStore.setState({
      user: {
        id: "user-2",
        email: "rd@example.com",
        fullName: "R&D",
        phone: null,
        roleCode: "RD",
        roleName: "R&D",
        permissions: ["master_data.documents.view"],
        purchaseOrderMode: "FULL_ACCESS",
      },
    });

    renderPage();

    expect(await screen.findByRole("button", { name: "Mở thư mục Bộ sưu tập" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Tạo mới" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Tùy chọn thư mục/ })).toBeNull();
  });

  it("renders the Explorer table and filters files by format", async () => {
    const documents: DocumentLibraryItem[] = [
      {
        documentId: "doc-word",
        title: "Áo Polo",
        folderId: rootFolder.id,
        folderName: rootFolder.folderName,
        versionId: "version-word",
        versionNo: 2,
        fileName: "thong-so.docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        byteSize: 2048,
        uploadedAt: "2026-10-01T10:00:00.000Z",
        isAssigned: false,
      },
      {
        documentId: "doc-pdf",
        title: "Bản vẽ",
        folderId: rootFolder.id,
        folderName: rootFolder.folderName,
        versionId: "version-pdf",
        versionNo: 1,
        fileName: "ban-ve.pdf",
        mimeType: "application/pdf",
        byteSize: 4096,
        uploadedAt: "2026-10-01T09:00:00.000Z",
        isAssigned: true,
      },
    ];
    vi.mocked(documentsLibraryApi.list).mockResolvedValue(libraryPage(documents));

    renderPage();
    await openRootFolderContents();

    const table = await screen.findByRole("table", { name: "Tài liệu trong kho" });
    expect(screen.getByText("thong-so.docx")).toBeTruthy();
    expect(screen.getByText("ban-ve.pdf")).toBeTruthy();
    expect(within(table).queryByText(/\d{1,2}:\d{2}/)).toBeNull();
    expect(screen.getByRole("combobox", { name: "Trạng thái tài liệu" })).toHaveProperty(
      "value",
      "all",
    );
  });

  it("keeps very long file names inside the fixed table column and preserves the full name on hover", async () => {
    const fileName = `spec-${"0123456789".repeat(12)}.pdf`;
    vi.mocked(documentsLibraryApi.list).mockResolvedValue(
      libraryPage([
        {
          documentId: "long-name-doc",
          title: fileName,
          folderId: rootFolder.id,
          folderName: rootFolder.folderName,
          versionId: "long-name-version",
          versionNo: 1,
          fileName,
          mimeType: "application/pdf",
          byteSize: 1024,
          uploadedAt: "2026-10-01T10:00:00.000Z",
          isAssigned: false,
        },
      ]),
    );

    renderPage();
    await selectDocumentStatus("processing");

    const table = await screen.findByRole("table", { name: "Tài liệu trong kho" });
    const fileNameButton = within(table).getByRole("button", { name: fileName });
    expect(table.className).toContain("table-fixed");
    expect(fileNameButton.className).toContain("truncate");
    expect(fileNameButton.getAttribute("title")).toBe(fileName);
  });

  it("shows 10 documents per page by default", async () => {
    const pageDocuments = Array.from({ length: 12 }, (_, index) => ({
      documentId: `page-doc-${index}`,
      title: `page-${index}.pdf`,
      folderId: rootFolder.id,
      folderName: rootFolder.folderName,
      versionId: `page-version-${index}`,
      versionNo: 1,
      fileName: `page-${index}.pdf`,
      mimeType: "application/pdf",
      byteSize: 1024,
      uploadedAt: "2026-10-01T10:00:00.000Z",
      isAssigned: false,
    }));
    vi.mocked(documentsLibraryApi.list).mockImplementation(async ({ page = 1, limit = 10 } = {}) =>
      libraryPage(pageDocuments.slice((page - 1) * limit, page * limit), {
        page,
        limit,
        total: pageDocuments.length,
        totalBytes: pageDocuments.reduce((sum, document) => sum + document.byteSize, 0),
      }),
    );
    renderPage();
    await selectDocumentStatus("processing");

    const table = await screen.findByRole("table", { name: "Tài liệu trong kho" });
    expect(screen.getByRole("combobox", { name: "Số tài liệu mỗi trang" })).toHaveProperty(
      "value",
      "10",
    );
    expect(within(table).getAllByRole("row")).toHaveLength(12);
    fireEvent.click(within(table).getByRole("checkbox", { name: "Chọn page-0.pdf" }));

    fireEvent.click(screen.getByRole("button", { name: "Trang sau" }));
    await waitFor(() => {
      expect(documentsLibraryApi.list).toHaveBeenLastCalledWith({
        folderId: rootFolder.id,
        assigned: false,
        page: 2,
        limit: 10,
      });
    });
    const secondPageTable = await screen.findByRole("table", { name: "Tài liệu trong kho" });
    expect(within(secondPageTable).getAllByRole("row")).toHaveLength(4);
    fireEvent.click(within(secondPageTable).getByRole("checkbox", { name: "Chọn page-10.pdf" }));
    const bulkToolbar = screen.getByRole("toolbar", { name: "Thao tác tài liệu đã chọn" });
    expect(within(bulkToolbar).getByText("Đã chọn 2 tài liệu")).toBeTruthy();
    fireEvent.click(within(bulkToolbar).getByRole("button", { name: "Thao tác chung" }));
    expect(within(bulkToolbar).queryByRole("menuitem", { name: /Ghim/ })).toBeNull();
  });

  it("shows Fit assignment status and closes the file menu outside its row", async () => {
    vi.mocked(documentsLibraryApi.list).mockResolvedValue(
      libraryPage([
        {
          documentId: "assigned-doc",
          title: "assigned.pdf",
          folderId: rootFolder.id,
          folderName: rootFolder.folderName,
          versionId: "version-assigned",
          versionNo: 1,
          fileName: "assigned.pdf",
          mimeType: "application/pdf",
          byteSize: 1024,
          uploadedAt: "2026-10-01T10:00:00.000Z",
          isAssigned: true,
        },
        {
          documentId: "unassigned-doc",
          title: "unassigned.pdf",
          folderId: rootFolder.id,
          folderName: rootFolder.folderName,
          versionId: "version-unassigned",
          versionNo: 1,
          fileName: "unassigned.pdf",
          mimeType: "application/pdf",
          byteSize: 1024,
          uploadedAt: "2026-10-01T09:00:00.000Z",
          isAssigned: false,
        },
      ]),
    );
    renderPage();
    await selectDocumentStatus("processing");

    const table = await screen.findByRole("table", { name: "Tài liệu trong kho" });
    expect(screen.getByRole("img", { name: "Đã gán vào mẫu Fit" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Chưa gán vào mẫu Fit" })).toBeTruthy();
    const assignedRow = within(table)
      .getAllByRole("row")
      .find((row) => within(row).queryByRole("button", { name: /^assigned\.pdf$/ }));
    expect(assignedRow).toBeTruthy();
    if (!assignedRow) throw new Error("Assigned document row was not rendered");
    expect(assignedRow.getAttribute("data-file-menu-open")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Thao tác assigned.pdf" }));
    const menu = await screen.findByRole("menu");
    expect(within(menu).queryByRole("menuitem", { name: /Ghim|Bỏ ghim/ })).toBeNull();
    expect(menu.parentElement).toBe(document.body);
    expect(within(table).queryByRole("menu")).toBeNull();
    expect(assignedRow.getAttribute("data-file-menu-open")).toBe("true");
    expect(assignedRow.className).toContain("ring-2");

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).toBeNull();
    expect(assignedRow.getAttribute("data-file-menu-open")).toBeNull();
    expect(assignedRow.className).not.toContain("ring-2");
  });

  it("assigns a warehouse document to a selected Fit style from its actions menu", async () => {
    const document: DocumentLibraryItem = {
      documentId: "document-to-assign",
      title: "tech-pack.pdf",
      folderId: rootFolder.id,
      folderName: rootFolder.folderName,
      versionId: "version-1",
      versionNo: 1,
      fileName: "tech-pack.pdf",
      mimeType: "application/pdf",
      byteSize: 1024,
      uploadedAt: "2026-10-01T10:00:00.000Z",
      isAssigned: false,
    };
    const style: Style = {
      id: "style-1",
      styleCode: "FIT-26-001",
      styleName: "Áo Polo",
      description: null,
      category: null,
      status: "active",
      baseImageKey: null,
      as3bCmBaseDays: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    vi.mocked(documentsLibraryApi.list).mockResolvedValue(libraryPage([document]));
    vi.mocked(stylesApi.getStyles).mockResolvedValue({
      data: [style],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    renderPage();
    await selectDocumentStatus("processing");
    await screen.findByRole("table", { name: "Tài liệu trong kho" });
    fireEvent.click(screen.getByRole("button", { name: "Thao tác tech-pack.pdf" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Gán vào mẫu Fit" }));

    const dialog = await screen.findByRole("dialog", { name: "Gán tài liệu vào mẫu Fit" });
    fireEvent.click(within(dialog).getByRole("radio", { name: /FIT-26-001/ }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Gán tài liệu" }));

    await waitFor(() => {
      expect(documentsLibraryApi.assignToStyle).toHaveBeenCalledWith("style-1", [
        "document-to-assign",
      ]);
    });
    expect(await screen.findByText("Đã gán tài liệu vào mẫu Fit.")).toBeTruthy();
  });

  it("assigns multiple selected warehouse documents to the same Fit style", async () => {
    const documents: DocumentLibraryItem[] = [
      {
        documentId: "document-one",
        title: "tech-pack-one.pdf",
        folderId: rootFolder.id,
        folderName: rootFolder.folderName,
        versionId: "version-one",
        versionNo: 1,
        fileName: "tech-pack-one.pdf",
        mimeType: "application/pdf",
        byteSize: 1024,
        uploadedAt: "2026-10-01T10:00:00.000Z",
        isAssigned: false,
      },
      {
        documentId: "document-two",
        title: "tech-pack-two.pdf",
        folderId: rootFolder.id,
        folderName: rootFolder.folderName,
        versionId: "version-two",
        versionNo: 1,
        fileName: "tech-pack-two.pdf",
        mimeType: "application/pdf",
        byteSize: 2048,
        uploadedAt: "2026-10-01T09:00:00.000Z",
        isAssigned: false,
      },
    ];
    const style: Style = {
      id: "style-1",
      styleCode: "FIT-26-001",
      styleName: "Áo Polo",
      description: null,
      category: null,
      status: "active",
      baseImageKey: null,
      as3bCmBaseDays: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    vi.mocked(documentsLibraryApi.list).mockResolvedValue(libraryPage(documents));
    vi.mocked(stylesApi.getStyles).mockResolvedValue({
      data: [style],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    renderPage();
    await selectDocumentStatus("processing");
    const table = await screen.findByRole("table", { name: "Tài liệu trong kho" });
    fireEvent.click(within(table).getByRole("checkbox", { name: "Chọn tech-pack-one.pdf" }));
    fireEvent.click(within(table).getByRole("checkbox", { name: "Chọn tech-pack-two.pdf" }));
    const bulkToolbar = screen.getByRole("toolbar", { name: "Thao tác tài liệu đã chọn" });
    expect(bulkToolbar).toBeTruthy();
    fireEvent.click(within(bulkToolbar).getByRole("button", { name: "Thao tác chung" }));
    expect(within(bulkToolbar).queryByRole("menuitem", { name: /Ghim/ })).toBeNull();
    expect(
      within(bulkToolbar).getByRole("menuitem", { name: "Xóa 2 tài liệu khỏi kho" }),
    ).toBeTruthy();
    fireEvent.click(
      within(bulkToolbar).getByRole("menuitem", { name: "Gán 2 tài liệu vào mẫu Fit" }),
    );

    const dialog = await screen.findByRole("dialog", { name: "Gán tài liệu vào mẫu Fit" });
    expect(within(dialog).getByText("2 tài liệu được chọn")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("radio", { name: /FIT-26-001/ }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Gán 2 tài liệu" }));

    await waitFor(() => {
      expect(documentsLibraryApi.assignToStyle).toHaveBeenCalledWith("style-1", [
        "document-one",
        "document-two",
      ]);
    });
    expect(await screen.findByText("Đã gán 2 tài liệu vào mẫu Fit.")).toBeTruthy();
    expect(screen.queryByRole("toolbar", { name: "Thao tác tài liệu đã chọn" })).toBeNull();
    expect(within(table).getByRole("checkbox", { name: "Chọn tech-pack-one.pdf" })).toHaveProperty(
      "checked",
      false,
    );
  });

  it("limits cross-page bulk selection to 100 documents and explains the limit", async () => {
    const documents: DocumentLibraryItem[] = Array.from({ length: 101 }, (_, index) => ({
      documentId: `document-${index + 1}`,
      title: `spec-${index + 1}.pdf`,
      folderId: rootFolder.id,
      folderName: rootFolder.folderName,
      versionId: `version-${index + 1}`,
      versionNo: 1,
      fileName: `spec-${index + 1}.pdf`,
      mimeType: "application/pdf",
      byteSize: 1024,
      uploadedAt: "2026-10-01T10:00:00.000Z",
      isAssigned: false,
    }));
    vi.mocked(documentsLibraryApi.list).mockImplementation(async (params = {}) => {
      const page = params.page ?? 1;
      const limit = params.limit ?? 10;
      return libraryPage(documents.slice((page - 1) * limit, page * limit), {
        page,
        limit,
        total: documents.length,
        totalPages: Math.ceil(documents.length / limit),
      });
    });

    renderPage();
    await selectDocumentStatus("processing");
    await screen.findByRole("table", { name: "Tài liệu trong kho" });
    fireEvent.change(screen.getByRole("combobox", { name: "Số tài liệu mỗi trang" }), {
      target: { value: "100" },
    });

    await screen.findByRole("checkbox", { name: "Chọn spec-100.pdf" });
    fireEvent.click(screen.getByRole("checkbox", { name: "Chọn tất cả tài liệu trên trang" }));
    expect(await screen.findByText("Đã chọn 100 tài liệu")).toBeTruthy();
    expect(screen.getByText("Tối đa 100 tài liệu mỗi lần")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Trang sau" }));
    const finalPageTable = await screen.findByRole("table", { name: "Tài liệu trong kho" });
    fireEvent.click(within(finalPageTable).getByRole("checkbox", { name: "Chọn spec-101.pdf" }));

    expect(
      await screen.findByText("Bạn chỉ có thể chọn tối đa 100 tài liệu cho một lần thao tác."),
    ).toBeTruthy();
    expect(screen.getByText("Đã chọn 100 tài liệu")).toBeTruthy();
  }, 15_000);

  it("archives selected documents together after confirmation", async () => {
    vi.mocked(documentsLibraryApi.list).mockResolvedValue(
      libraryPage([
        {
          documentId: "doc-a",
          title: "spec-a.pdf",
          folderId: rootFolder.id,
          folderName: rootFolder.folderName,
          versionId: "version-a",
          versionNo: 1,
          fileName: "spec-a.pdf",
          mimeType: "application/pdf",
          byteSize: 1024,
          uploadedAt: "2026-10-01T10:00:00.000Z",
          isAssigned: false,
        },
        {
          documentId: "doc-b",
          title: "spec-b.pdf",
          folderId: rootFolder.id,
          folderName: rootFolder.folderName,
          versionId: "version-b",
          versionNo: 1,
          fileName: "spec-b.pdf",
          mimeType: "application/pdf",
          byteSize: 1024,
          uploadedAt: "2026-10-01T10:00:00.000Z",
          isAssigned: false,
        },
      ]),
    );
    renderPage();
    await selectDocumentStatus("processing");
    const table = await screen.findByRole("table", { name: "Tài liệu trong kho" });
    fireEvent.click(within(table).getByRole("checkbox", { name: "Chọn spec-a.pdf" }));
    fireEvent.click(within(table).getByRole("checkbox", { name: "Chọn spec-b.pdf" }));
    const bulkToolbar = screen.getByRole("toolbar", { name: "Thao tác tài liệu đã chọn" });
    fireEvent.click(within(bulkToolbar).getByRole("button", { name: "Thao tác chung" }));
    fireEvent.click(within(bulkToolbar).getByRole("menuitem", { name: "Xóa 2 tài liệu khỏi kho" }));

    let confirmationDialog = await screen.findByRole("dialog", { name: "Xóa tài liệu khỏi kho?" });
    expect(confirmationDialog.textContent).toContain("2 tài liệu đã chọn khỏi kho");
    expect(documentsLibraryApi.archive).not.toHaveBeenCalled();
    fireEvent.click(within(confirmationDialog).getByRole("button", { name: "Hủy" }));
    expect(screen.queryByRole("dialog", { name: "Xóa tài liệu khỏi kho?" })).toBeNull();
    expect(documentsLibraryApi.archive).not.toHaveBeenCalled();

    fireEvent.click(within(bulkToolbar).getByRole("button", { name: "Thao tác chung" }));
    fireEvent.click(within(bulkToolbar).getByRole("menuitem", { name: "Xóa 2 tài liệu khỏi kho" }));
    confirmationDialog = await screen.findByRole("dialog", { name: "Xóa tài liệu khỏi kho?" });
    fireEvent.click(within(confirmationDialog).getByRole("button", { name: "Xóa 2 tài liệu" }));

    await waitFor(() => {
      expect(documentsLibraryApi.archive).toHaveBeenCalledWith("doc-a");
      expect(documentsLibraryApi.archive).toHaveBeenCalledWith("doc-b");
    });
    expect(await screen.findByText("Đã xóa 2 tài liệu khỏi kho.")).toBeTruthy();
    expect(screen.queryByRole("toolbar", { name: "Thao tác tài liệu đã chọn" })).toBeNull();
  });

  it("deletes an individual document from its actions menu after modal confirmation", async () => {
    vi.mocked(documentsLibraryApi.list).mockResolvedValue(
      libraryPage([
        {
          documentId: "doc-to-delete",
          title: "delete-me.pdf",
          folderId: rootFolder.id,
          folderName: rootFolder.folderName,
          versionId: "version-delete",
          versionNo: 1,
          fileName: "delete-me.pdf",
          mimeType: "application/pdf",
          byteSize: 1024,
          uploadedAt: "2026-10-01T10:00:00.000Z",
          isAssigned: false,
        },
      ]),
    );
    renderPage();
    await selectDocumentStatus("processing");
    await screen.findByRole("table", { name: "Tài liệu trong kho" });
    fireEvent.click(screen.getByRole("button", { name: "Thao tác delete-me.pdf" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Xóa khỏi kho" }));

    const confirmationDialog = await screen.findByRole("dialog", {
      name: "Xóa tài liệu khỏi kho?",
    });
    expect(confirmationDialog.textContent).toContain("delete-me.pdf");
    expect(documentsLibraryApi.archive).not.toHaveBeenCalled();
    fireEvent.click(within(confirmationDialog).getByRole("button", { name: "Xóa 1 tài liệu" }));

    await waitFor(() => expect(documentsLibraryApi.archive).toHaveBeenCalledWith("doc-to-delete"));
    expect(await screen.findByText("Đã xóa 1 tài liệu khỏi kho.")).toBeTruthy();
  });

  it("loads documents assigned to at least one Fit style", async () => {
    renderPage();

    await selectDocumentStatus("assigned");

    await waitFor(() => {
      expect(documentsLibraryApi.list).toHaveBeenCalledWith({
        folderId: rootFolder.id,
        assigned: true,
        page: 1,
        limit: 10,
      });
    });
    expect(screen.getByRole("combobox", { name: "Trạng thái tài liệu" })).toHaveProperty(
      "value",
      "assigned",
    );
  });

  it("filters the current folder to all, assigned, or processing documents", async () => {
    const documents: DocumentLibraryItem[] = [
      {
        documentId: "assigned-doc",
        title: "assigned.pdf",
        folderId: rootFolder.id,
        folderName: rootFolder.folderName,
        versionId: "version-assigned",
        versionNo: 1,
        fileName: "assigned.pdf",
        mimeType: "application/pdf",
        byteSize: 1024,
        uploadedAt: "2026-10-01T10:00:00.000Z",
        isAssigned: true,
      },
      {
        documentId: "unassigned-doc",
        title: "unassigned.pdf",
        folderId: rootFolder.id,
        folderName: rootFolder.folderName,
        versionId: "version-unassigned",
        versionNo: 1,
        fileName: "unassigned.pdf",
        mimeType: "application/pdf",
        byteSize: 1024,
        uploadedAt: "2026-10-01T09:00:00.000Z",
        isAssigned: false,
      },
    ];
    vi.mocked(documentsLibraryApi.list).mockImplementation(async (params = {}) => {
      if (params.assigned === true) return libraryPage([documents[0]]);
      if (params.assigned === false) return libraryPage([documents[1]]);
      return libraryPage(documents);
    });
    renderPage();

    await openRootFolderContents();
    const allDocumentsTable = await screen.findByRole("table", { name: "Tài liệu trong kho" });
    expect(within(allDocumentsTable).getByText("assigned.pdf")).toBeTruthy();
    expect(within(allDocumentsTable).getByText("unassigned.pdf")).toBeTruthy();

    await selectDocumentStatus("assigned");
    await waitFor(() => {
      expect(documentsLibraryApi.list).toHaveBeenLastCalledWith({
        folderId: rootFolder.id,
        assigned: true,
        page: 1,
        limit: 10,
      });
    });
    expect(await screen.findByText("assigned.pdf")).toBeTruthy();
    expect(screen.queryByText("unassigned.pdf")).toBeNull();

    await selectDocumentStatus("processing");
    await waitFor(() => {
      expect(documentsLibraryApi.list).toHaveBeenLastCalledWith({
        folderId: rootFolder.id,
        assigned: false,
        page: 1,
        limit: 10,
      });
    });

    const table = await screen.findByRole("table", { name: "Tài liệu trong kho" });
    expect(screen.getByRole("combobox", { name: "Trạng thái tài liệu" })).toHaveProperty(
      "value",
      "processing",
    );
    expect(within(table).getAllByRole("row")).toHaveLength(3);
    expect(within(table).queryByText("assigned.pdf")).toBeNull();
    expect(within(table).getByText("unassigned.pdf")).toBeTruthy();
  });

  it("shows unassigned warehouse documents from the selected folder", async () => {
    vi.mocked(documentsLibraryApi.list).mockResolvedValue(
      libraryPage([
        {
          documentId: "unassigned-doc",
          title: "spec.pdf",
          folderId: rootFolder.id,
          folderName: rootFolder.folderName,
          versionId: "version-1",
          versionNo: 1,
          fileName: "spec.pdf",
          mimeType: "application/pdf",
          byteSize: 1024,
          uploadedAt: "2026-10-01T10:00:00.000Z",
          isAssigned: false,
        },
      ]),
    );
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Mở thư mục Bộ sưu tập" }));

    await selectDocumentStatus("processing");

    await waitFor(() => {
      expect(documentsLibraryApi.list).toHaveBeenLastCalledWith({
        folderId: rootFolder.id,
        assigned: false,
        page: 1,
        limit: 10,
      });
    });
    expect(screen.getByRole("combobox", { name: "Trạng thái tài liệu" })).toHaveProperty(
      "value",
      "processing",
    );
    expect(screen.getByText("spec.pdf")).toBeTruthy();
    expect(screen.queryByText("Đang tải lên")).toBeNull();
  });
});
