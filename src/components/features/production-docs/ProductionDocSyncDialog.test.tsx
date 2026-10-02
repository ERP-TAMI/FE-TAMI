import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProductionDocSyncDialog } from "./ProductionDocSyncDialog";
import type { ProductionDocSyncSelection } from "./productionDocSync";

describe("ProductionDocSyncDialog", () => {
  afterEach(cleanup);

  const defaultSelection: ProductionDocSyncSelection = {
    image: true,
    accessories: true,
  };

  it("lets the user sync only the selected image or accessories", () => {
    const onConfirm = vi.fn();
    const onSelectionChange = vi.fn();

    const { rerender } = render(
      <ProductionDocSyncDialog
        source="po"
        open
        selection={defaultSelection}
        isSubmitting={false}
        isAccessoriesLoading={false}
        isAccessoriesError={false}
        onSelectionChange={onSelectionChange}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );

    const imageCheckbox = screen.getByRole("checkbox", { name: /Ảnh sản phẩm/ });
    const accessoriesCheckbox = screen.getByRole("checkbox", { name: /PO BOM/ });
    expect(imageCheckbox).toHaveProperty("checked", true);
    expect(accessoriesCheckbox).toHaveProperty("checked", true);

    fireEvent.click(imageCheckbox);
    expect(onSelectionChange).toHaveBeenCalledWith("image", false);

    rerender(
      <ProductionDocSyncDialog
        source="po"
        open
        selection={{ image: false, accessories: true }}
        isSubmitting={false}
        isAccessoriesLoading={false}
        isAccessoriesError={false}
        onSelectionChange={onSelectionChange}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận đồng bộ" }));

    expect(onConfirm).toHaveBeenCalledWith({ image: false, accessories: true });
  });

  it("allows image-only sync while BOM data is loading", () => {
    const onConfirm = vi.fn();

    const { rerender } = render(
      <ProductionDocSyncDialog
        source="po"
        open
        selection={defaultSelection}
        isSubmitting={false}
        isAccessoriesLoading
        isAccessoriesError={false}
        onSelectionChange={vi.fn()}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Xác nhận đồng bộ" })).toHaveProperty(
      "disabled",
      true,
    );

    rerender(
      <ProductionDocSyncDialog
        source="po"
        open
        selection={{ image: true, accessories: false }}
        isSubmitting={false}
        isAccessoriesLoading
        isAccessoriesError={false}
        onSelectionChange={vi.fn()}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận đồng bộ" }));

    expect(onConfirm).toHaveBeenCalledWith({ image: true, accessories: false });
  });

  it("requires at least one selected item", () => {
    render(
      <ProductionDocSyncDialog
        source="po"
        open
        selection={{ image: false, accessories: false }}
        isSubmitting={false}
        isAccessoriesLoading={false}
        isAccessoriesError={false}
        onSelectionChange={vi.fn()}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert").textContent).toContain(
      "Chọn ít nhất một nội dung cần đồng bộ.",
    );
    expect(screen.getByRole("button", { name: "Xác nhận đồng bộ" })).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("shows Fit sources and allows selecting only one section", () => {
    const onConfirm = vi.fn();
    render(
      <ProductionDocSyncDialog
        source="fit"
        open
        selection={{ image: true, accessories: false }}
        isSubmitting={false}
        onSelectionChange={vi.fn()}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("checkbox", { name: /Ảnh và mô tả Mẫu Fit/ })).toHaveProperty(
      "checked",
      true,
    );
    expect(screen.getByRole("checkbox", { name: /Fit BOM/ })).toHaveProperty("checked", false);
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận đồng bộ" }));
    expect(onConfirm).toHaveBeenCalledWith({ image: true, accessories: false });
  });
});
