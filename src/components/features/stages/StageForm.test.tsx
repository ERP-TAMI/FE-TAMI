import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StageForm } from "./StageForm";

const stage = {
  id: "64bfc097-69d1-43f5-af97-cb0e7428f7df",
  stageCode: "GD-CAT",
  stageName: "Cắt vải",
  description: "Cắt chi tiết theo sơ đồ",
  ssv: "12.500",
  status: "active" as const,
};

describe("StageForm", () => {
  afterEach(cleanup);

  it("requires a name and rejects invalid SSV while allowing an empty code", async () => {
    const onSubmit = vi.fn();
    render(<StageForm mode="create" isSubmitting={false} onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("SSV (giây/sản phẩm)"), {
      target: { value: "-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu công đoạn" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText("Tên công đoạn là bắt buộc")).toBeTruthy();
    expect(screen.queryByText("Mã công đoạn là bắt buộc")).toBeNull();
    expect(screen.getByText("SSV phải là số không âm, tối đa 3 chữ số thập phân")).toBeTruthy();
  });

  it("omits the stage code so the server can generate it", async () => {
    const onSubmit = vi.fn();
    render(<StageForm mode="create" isSubmitting={false} onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Tên công đoạn"), {
      target: { value: "Ủi TP + phà hơi" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu công đoạn" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        stageName: "Ủi TP + phà hơi",
        description: null,
        ssv: "0",
      });
    });
  });

  it("submits normalized text and an exact decimal string", async () => {
    const onSubmit = vi.fn();
    render(<StageForm mode="create" isSubmitting={false} onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Mã công đoạn"), { target: { value: " gd-may " } });
    fireEvent.change(screen.getByLabelText("Tên công đoạn"), {
      target: { value: " May thân trước " },
    });
    fireEvent.change(screen.getByLabelText("Mô tả"), { target: { value: " Công đoạn may " } });
    fireEvent.change(screen.getByLabelText("SSV (giây/sản phẩm)"), {
      target: { value: "15.250" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu công đoạn" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        stageCode: "GD-MAY",
        stageName: "May thân trước",
        description: "Công đoạn may",
        ssv: "15.250",
      });
    });
  });

  it("toggles the stage code between locked and editable states", () => {
    render(
      <StageForm
        mode="edit"
        stage={stage}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const codeInput = screen.getByLabelText("Mã công đoạn") as HTMLInputElement;

    expect(codeInput.disabled).toBe(true);
    expect(codeInput.className).toContain("cursor-not-allowed");
    expect(codeInput.className).toContain("bg-gray-100");
    fireEvent.click(screen.getByRole("button", { name: "Mở khóa mã công đoạn" }));

    expect(codeInput.disabled).toBe(false);
    expect(document.activeElement).toBe(codeInput);
    expect(screen.getByRole("button", { name: "Khóa mã công đoạn" })).toBeTruthy();
    expect(screen.getByText("Mã công đoạn đang mở khóa và có thể chỉnh sửa.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Khóa mã công đoạn" }));
    expect(codeInput.disabled).toBe(true);
  });

  it("submits a normalized stage code after unlocking it", async () => {
    const onSubmit = vi.fn();
    render(
      <StageForm
        mode="edit"
        stage={stage}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Mở khóa mã công đoạn" }));
    fireEvent.change(screen.getByLabelText("Mã công đoạn"), {
      target: { value: " gd-cat-laser " },
    });
    fireEvent.change(screen.getByLabelText("Tên công đoạn"), { target: { value: "Cắt laser" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu công đoạn" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        stageCode: "GD-CAT-LASER",
        stageName: "Cắt laser",
        description: "Cắt chi tiết theo sơ đồ",
        ssv: "12.500",
      });
    });
  });

  it("keeps the existing stage code when saving while it remains locked", async () => {
    const onSubmit = vi.fn();
    render(
      <StageForm
        mode="edit"
        stage={stage}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText("Tên công đoạn"), {
      target: { value: "Cắt laser" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu công đoạn" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        stageCode: "GD-CAT",
        stageName: "Cắt laser",
        description: "Cắt chi tiết theo sơ đồ",
        ssv: "12.500",
      });
    });
  });

  it("requires a stage code when an existing stage is unlocked for editing", async () => {
    const onSubmit = vi.fn();
    render(
      <StageForm
        mode="edit"
        stage={stage}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Mở khóa mã công đoạn" }));
    fireEvent.change(screen.getByLabelText("Mã công đoạn"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu công đoạn" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText("Mã công đoạn là bắt buộc")).toBeTruthy();
  });

  it("uses the shared confirmation dialog for dirty forms", () => {
    const onClose = vi.fn();
    render(<StageForm mode="create" isSubmitting={false} onClose={onClose} onSubmit={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Tên công đoạn"), { target: { value: "Cắt vải" } });
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Hủy các thay đổi?" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Bỏ thay đổi" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
