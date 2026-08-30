import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SizeChartForm } from "./SizeChartForm";

const sizeChart = {
  id: "f4ab3c98-2941-42e9-a92a-1e90f6087fd0",
  name: "Áo sơ mi nam",
  sizes: ["XS", "S", "M"],
  status: "active" as const,
  createdAt: "2026-08-26T00:00:00.000Z",
  updatedAt: "2026-08-26T00:00:00.000Z",
};

afterEach(cleanup);

describe("SizeChartForm", () => {
  it("submits pasted chips in normalized order while preserving casing", async () => {
    const onSubmit = vi.fn();
    render(
      <SizeChartForm mode="create" isSubmitting={false} onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByLabelText("Tên bảng Size"), {
      target: { value: "  Áo   thun nam  " },
    });
    fireEvent.paste(screen.getByLabelText("Nhập Size"), {
      clipboardData: { getData: () => " xs, S\n M  ,\nXL " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tạo bảng Size" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: "Áo thun nam",
        sizes: ["xs", "S", "M", "XL"],
      });
    });
  });

  it("blocks a duplicate chip immediately after whitespace normalization and case-folding", async () => {
    const onSubmit = vi.fn();
    render(
      <SizeChartForm mode="create" isSubmitting={false} onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByLabelText("Tên bảng Size"), {
      target: { value: "Áo thun" },
    });
    const sizeInput = screen.getByLabelText("Nhập Size");
    fireEvent.change(sizeInput, { target: { value: "Size  1" } });
    fireEvent.keyDown(sizeInput, { key: "Enter" });
    fireEvent.change(sizeInput, { target: { value: "size 1" } });
    fireEvent.keyDown(sizeInput, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "Tạo bảng Size" }));

    expect(await screen.findByText('Size "size 1" đã tồn tại')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("requires at least one non-blank size", async () => {
    const onSubmit = vi.fn();
    render(
      <SizeChartForm mode="create" isSubmitting={false} onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByLabelText("Tên bảng Size"), {
      target: { value: "Áo thun" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tạo bảng Size" }));

    expect(await screen.findByText("Cần thêm ít nhất một Size")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("includes a valid pending draft when the user submits without pressing Enter", async () => {
    const onSubmit = vi.fn();
    render(
      <SizeChartForm mode="create" isSubmitting={false} onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByLabelText("Tên bảng Size"), {
      target: { value: "Áo thun" },
    });
    fireEvent.change(screen.getByLabelText("Nhập Size"), {
      target: { value: " M " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tạo bảng Size" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ name: "Áo thun", sizes: ["M"] });
    });
  });

  it("preloads an edit and submits a full in-place replacement", async () => {
    const onSubmit = vi.fn();
    render(
      <SizeChartForm
        mode="edit"
        sizeChart={sizeChart}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "XS",
      "S",
      "M",
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Xóa Size XS" }));
    const sizeInput = screen.getByLabelText("Nhập Size");
    fireEvent.change(sizeInput, { target: { value: "L" } });
    fireEvent.keyDown(sizeInput, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "Lưu bảng Size" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: "Áo sơ mi nam",
        sizes: ["S", "M", "L"],
      });
    });
  });

  it("confirms before discarding an edited form", () => {
    const onClose = vi.fn();
    render(
      <SizeChartForm
        mode="edit"
        sizeChart={sizeChart}
        isSubmitting={false}
        onClose={onClose}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Tên bảng Size"), {
      target: { value: "Bảng đang sửa" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Hủy các thay đổi?" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Bỏ thay đổi" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
