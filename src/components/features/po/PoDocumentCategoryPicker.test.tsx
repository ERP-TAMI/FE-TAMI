import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PoDocumentCategoryPicker } from "./PoDocumentCategoryPicker";

describe("PoDocumentCategoryPicker", () => {
  afterEach(cleanup);

  it("hiển thị nhãn của phân loại hiện tại", () => {
    render(<PoDocumentCategoryPicker value="other" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Khác/ })).toBeTruthy();
  });

  it("mở menu ra ngoài cây DOM của nút để không bị vùng cuộn cắt", () => {
    const { container } = render(
      <PoDocumentCategoryPicker value="other" onChange={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Khác/ }));

    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeTruthy();
    // Menu phải nằm ngoài container của component (portal sang body).
    expect(container.contains(listbox)).toBe(false);
    expect(document.body.contains(listbox)).toBe(true);
  });

  it("chọn một phân loại khác thì báo ra ngoài và đóng menu", () => {
    const onChange = vi.fn();
    render(<PoDocumentCategoryPicker value="other" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /Khác/ }));
    fireEvent.click(screen.getByRole("option", { name: /PO Tổng/ }));

    expect(onChange).toHaveBeenCalledWith("po_original");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("chọn lại đúng phân loại đang dùng thì không gọi onChange", () => {
    const onChange = vi.fn();
    render(<PoDocumentCategoryPicker value="other" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /Khác/ }));
    fireEvent.click(screen.getByRole("option", { name: /Khác/ }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("bấm ra ngoài thì đóng menu", () => {
    render(<PoDocumentCategoryPicker value="other" onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Khác/ }));
    expect(screen.getByRole("listbox")).toBeTruthy();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("mousedown bên trong menu không làm đóng trước khi click kịp bắn", () => {
    const onChange = vi.fn();
    render(<PoDocumentCategoryPicker value="other" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /Khác/ }));
    const option = screen.getByRole("option", { name: /Ảnh mẫu/ });

    fireEvent.mouseDown(option);
    expect(screen.queryByRole("listbox")).toBeTruthy();

    fireEvent.click(option);
    expect(onChange).toHaveBeenCalledWith("sample_image");
  });

  it("không mở menu khi bị vô hiệu hóa", () => {
    render(<PoDocumentCategoryPicker value="other" disabled onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Khác/ }));
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
