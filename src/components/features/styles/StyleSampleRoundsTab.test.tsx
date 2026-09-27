import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StyleSampleRoundsTab } from "./StyleSampleRoundsTab";
import type { StyleSampleRoundItem } from "@/types/style-sample-round";

const showToastMock = vi.hoisted(() => vi.fn());
const createMutateAsyncMock = vi.hoisted(() => vi.fn());
const updateMutateAsyncMock = vi.hoisted(() => vi.fn());
const uploadMutateAsyncMock = vi.hoisted(() => vi.fn());
const removeImageMutateAsyncMock = vi.hoisted(() => vi.fn());
const useStyleSampleRoundsMock = vi.hoisted(() => vi.fn());
const startUploadMock = vi.hoisted(() => vi.fn());
const tickUploadMock = vi.hoisted(() => vi.fn());
const finishUploadMock = vi.hoisted(() => vi.fn());
const getImageDownloadUrlMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: null, showToast: showToastMock, hideToast: vi.fn() }),
}));

vi.mock("@/hooks/useUploadStore", () => ({
  useUploadStore: () => ({
    startUpload: startUploadMock,
    tickUpload: tickUploadMock,
    finishUpload: finishUploadMock,
  }),
}));

vi.mock("@/hooks/useStyleSampleRounds", () => ({
  useStyleSampleRounds: () => useStyleSampleRoundsMock(),
  useCreateStyleSampleRound: () => ({
    mutateAsync: createMutateAsyncMock,
    isPending: false,
  }),
  useUpdateStyleSampleRound: () => ({
    mutateAsync: updateMutateAsyncMock,
    isPending: false,
  }),
  useUploadStyleSampleImage: () => ({ mutateAsync: uploadMutateAsyncMock }),
  useRemoveStyleSampleImage: () => ({
    mutateAsync: removeImageMutateAsyncMock,
    isPending: false,
  }),
}));

vi.mock("@/api/style-sample-rounds.api", () => ({
  styleSampleRoundsApi: {
    getImageDownloadUrl: (...args: unknown[]) => getImageDownloadUrlMock(...args),
  },
}));

const STYLE_ID = "8f3a1c2e-4b6a-4e1a-9c2d-1a2b3c4d5e6f";

const mockRounds: StyleSampleRoundItem[] = [
  {
    id: "round-1",
    roundNo: 2,
    sampleDate: "2026-01-10",
    feedback: "Chưa đạt form vai",
    status: "needs_revision",
    createdBy: "user-1",
    createdAt: "2026-01-10T00:00:00.000Z",
    reviewedBy: "user-2",
    reviewedAt: "2026-01-11T00:00:00.000Z",
    images: [
      {
        id: "image-1",
        url: "https://s3.example/get/1",
        fileName: "anh.png",
        mimeType: "image/png",
        orderIndex: 0,
        uploadedAt: "2026-01-10T00:00:00.000Z",
      },
      {
        id: "image-2",
        url: "https://s3.example/get/2",
        fileName: "anh-2.png",
        mimeType: "image/png",
        orderIndex: 1,
        uploadedAt: "2026-01-10T00:00:00.000Z",
      },
    ],
  },
];

describe("StyleSampleRoundsTab", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows the empty state when there are no rounds", () => {
    useStyleSampleRoundsMock.mockReturnValue({ data: [], isLoading: false });

    render(<StyleSampleRoundsTab styleId={STYLE_ID} />);

    expect(screen.getByText("Chưa có lần may mẫu nào.")).toBeTruthy();
  });

  it("lists a round with its round number, status and note", () => {
    useStyleSampleRoundsMock.mockReturnValue({ data: mockRounds, isLoading: false });

    render(<StyleSampleRoundsTab styleId={STYLE_ID} />);

    expect(screen.getByText("Lần 2")).toBeTruthy();
    expect(screen.getByText("Chưa đạt")).toBeTruthy();
    expect(screen.getByText("Chưa đạt form vai")).toBeTruthy();
  });

  it("creates a new round with the form values", async () => {
    useStyleSampleRoundsMock.mockReturnValue({ data: [], isLoading: false });
    createMutateAsyncMock.mockResolvedValue({ id: "round-2" });

    render(<StyleSampleRoundsTab styleId={STYLE_ID} />);
    fireEvent.click(screen.getByRole("button", { name: /Thêm lần may mẫu/i }));

    const textarea = screen.getByPlaceholderText("Nhận xét về lần may mẫu này...");
    fireEvent.change(textarea, { target: { value: "Ghi chú test" } });

    fireEvent.click(screen.getByRole("button", { name: "Tạo lần may mẫu" }));

    await waitFor(() =>
      expect(createMutateAsyncMock).toHaveBeenCalledWith(
        expect.objectContaining({ feedback: "Ghi chú test", status: "working" }),
      ),
    );
    expect(showToastMock).toHaveBeenCalledWith("Đã thêm lần may mẫu mới.");
  });

  it("updates an existing round when editing", async () => {
    useStyleSampleRoundsMock.mockReturnValue({ data: mockRounds, isLoading: false });
    updateMutateAsyncMock.mockResolvedValue(mockRounds[0]);

    render(<StyleSampleRoundsTab styleId={STYLE_ID} />);
    fireEvent.click(screen.getByRole("button", { name: /Sửa/i }));
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() =>
      expect(updateMutateAsyncMock).toHaveBeenCalledWith({
        roundId: "round-1",
        input: expect.objectContaining({ status: "needs_revision" }),
      }),
    );
  });

  it("rejects a disallowed image file client-side without calling upload", async () => {
    useStyleSampleRoundsMock.mockReturnValue({ data: mockRounds, isLoading: false });
    render(<StyleSampleRoundsTab styleId={STYLE_ID} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const badFile = new File(["x"], "virus.exe", { type: "application/octet-stream" });
    fireEvent.change(input, { target: { files: [badFile] } });

    await waitFor(() =>
      expect(screen.getByText(/Chỉ chấp nhận file hình ảnh/)).toBeTruthy(),
    );
    expect(uploadMutateAsyncMock).not.toHaveBeenCalled();
  });

  it("uploads a valid image selected through the input and reports progress", async () => {
    useStyleSampleRoundsMock.mockReturnValue({ data: mockRounds, isLoading: false });
    uploadMutateAsyncMock.mockResolvedValue({ id: "image-2" });
    render(<StyleSampleRoundsTab styleId={STYLE_ID} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const goodFile = new File(["x"], "anh2.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [goodFile] } });

    await waitFor(() =>
      expect(uploadMutateAsyncMock).toHaveBeenCalledWith({
        roundId: "round-1",
        file: goodFile,
      }),
    );
    expect(startUploadMock).toHaveBeenCalledWith(1, "Lần 2 - mẫu Fit");
    await waitFor(() => expect(tickUploadMock).toHaveBeenCalledWith("anh2.png"));
    await waitFor(() => expect(finishUploadMock).toHaveBeenCalled());
  });

  it("removes an image after confirming", async () => {
    useStyleSampleRoundsMock.mockReturnValue({ data: mockRounds, isLoading: false });
    removeImageMutateAsyncMock.mockResolvedValue(undefined);

    render(<StyleSampleRoundsTab styleId={STYLE_ID} />);
    fireEvent.click(screen.getAllByTitle("Gỡ ảnh")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Xoá ảnh" }));

    await waitFor(() =>
      expect(removeImageMutateAsyncMock).toHaveBeenCalledWith({
        roundId: "round-1",
        imageId: "image-1",
      }),
    );
    expect(showToastMock).toHaveBeenCalledWith("Đã xoá ảnh khỏi lần may mẫu.");
  });

  it("changes the round status inline through the status picker, without opening the edit modal", async () => {
    useStyleSampleRoundsMock.mockReturnValue({ data: mockRounds, isLoading: false });
    updateMutateAsyncMock.mockResolvedValue({ ...mockRounds[0], status: "approved" });

    render(<StyleSampleRoundsTab styleId={STYLE_ID} />);
    fireEvent.click(screen.getByTitle("Bấm để đổi trạng thái"));
    fireEvent.click(screen.getByRole("option", { name: "Đạt" }));

    await waitFor(() =>
      expect(updateMutateAsyncMock).toHaveBeenCalledWith({
        roundId: "round-1",
        input: { status: "approved" },
      }),
    );
    expect(showToastMock).toHaveBeenCalledWith("Đã cập nhật trạng thái.");
    expect(screen.queryByText("Sửa lần may mẫu 2")).toBeNull();
  });

  it("does not call the update mutation when picking the status that is already active", async () => {
    useStyleSampleRoundsMock.mockReturnValue({ data: mockRounds, isLoading: false });

    render(<StyleSampleRoundsTab styleId={STYLE_ID} />);
    fireEvent.click(screen.getByTitle("Bấm để đổi trạng thái"));
    fireEvent.click(screen.getByRole("option", { name: "Chưa đạt" }));

    expect(updateMutateAsyncMock).not.toHaveBeenCalled();
  });

  it("opens the fullscreen viewer on image click and closes it with the close button", async () => {
    useStyleSampleRoundsMock.mockReturnValue({ data: mockRounds, isLoading: false });

    render(<StyleSampleRoundsTab styleId={STYLE_ID} />);
    fireEvent.click(screen.getAllByAltText("anh.png")[0]);

    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByText("1/2")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Đóng"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("steps to the next and previous image with the viewer's arrow buttons", async () => {
    useStyleSampleRoundsMock.mockReturnValue({ data: mockRounds, isLoading: false });

    render(<StyleSampleRoundsTab styleId={STYLE_ID} />);
    fireEvent.click(screen.getAllByAltText("anh.png")[0]);
    await screen.findByRole("dialog");

    expect(screen.queryByLabelText("Ảnh trước")).toBeNull();
    fireEvent.click(screen.getByLabelText("Ảnh sau"));

    await waitFor(() => expect(screen.getByText("2/2")).toBeTruthy());
    expect(screen.queryByLabelText("Ảnh sau")).toBeNull();

    fireEvent.click(screen.getByLabelText("Ảnh trước"));
    await waitFor(() => expect(screen.getByText("1/2")).toBeTruthy());
  });

  it("requests a fresh download URL for the current image from the viewer", async () => {
    useStyleSampleRoundsMock.mockReturnValue({ data: mockRounds, isLoading: false });
    getImageDownloadUrlMock.mockResolvedValue({
      url: "https://s3.example/download/1",
      expiresIn: 3600,
    });
    vi.spyOn(window, "open").mockImplementation(() => null);

    render(<StyleSampleRoundsTab styleId={STYLE_ID} />);
    fireEvent.click(screen.getAllByAltText("anh.png")[0]);
    await screen.findByRole("dialog");

    fireEvent.click(screen.getByRole("button", { name: /Tải xuống/i }));

    await waitFor(() =>
      expect(getImageDownloadUrlMock).toHaveBeenCalledWith(STYLE_ID, "round-1", "image-1"),
    );
  });
});
