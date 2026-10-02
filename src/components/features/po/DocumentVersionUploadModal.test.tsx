import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DocumentVersionUploadModal } from "./DocumentVersionUploadModal";

describe("DocumentVersionUploadModal", () => {
  afterEach(cleanup);

  it("submits a required reason while leaving evidence optional", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<DocumentVersionUploadModal title="tech-pack.pdf" currentVersionNo={1} isPending={false} onClose={vi.fn()} onSave={onSave} />);

    const file = new File(["%PDF-test"], "tech-pack-v2.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText(/Tệp phiên bản mới/), { target: { files: [file] } });
    fireEvent.change(screen.getByLabelText(/Lý do thay đổi/), { target: { value: "Khách yêu cầu sửa mẫu" } });
    fireEvent.submit(screen.getByRole("button", { name: /Xác nhận tải lên v2/ }).closest("form")!);

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(file, "Khách yêu cầu sửa mẫu", undefined));
  });

  it("rejects an oversized evidence image before submit", () => {
    render(<DocumentVersionUploadModal title="tech-pack.pdf" currentVersionNo={1} isPending={false} onClose={vi.fn()} onSave={vi.fn()} />);
    const image = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText(/Ảnh bằng chứng/), { target: { files: [image] } });
    expect(screen.getByRole("alert").textContent).toContain("tối đa 5 MB");
  });
});
