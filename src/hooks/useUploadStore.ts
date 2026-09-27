import { create } from "zustand";

type UploadState = {
  done: number;
  total: number;
  fileName: string;
  /** Mô tả nơi đang tải lên, ví dụ mã PO. */
  context: string;
};

type UploadStore = {
  upload: UploadState | null;
  startUpload: (total: number, context: string) => void;
  tickUpload: (fileName: string) => void;
  finishUpload: () => void;
};

export const useUploadStore = create<UploadStore>((set) => ({
  upload: null,
  startUpload: (total, context) =>
    set({ upload: { done: 0, total, fileName: "", context } }),
  tickUpload: (fileName) =>
    set((s) =>
      s.upload
        ? { upload: { ...s.upload, done: s.upload.done + 1, fileName } }
        : s,
    ),
  finishUpload: () => set({ upload: null }),
}));
