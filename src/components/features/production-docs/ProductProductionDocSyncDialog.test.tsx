import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProductProductionDocSyncDialog } from "./ProductProductionDocSyncDialog";
import type { ProductProductionDocSyncSelection } from "./productionDocSync";

describe("ProductProductionDocSyncDialog", () => {
  afterEach(cleanup);

  const defaultSelection: ProductProductionDocSyncSelection = {
    image: true,
    accessories: true,
  };

  it("lets the user sync only the selected image or accessories", () => {
    const onConfirm = vi.fn();
    const onSelectionChange = vi.fn();

    const { rerender } = render(
      <ProductProductionDocSyncDialog
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
    const accessoriesCheckbox = screen.getByRole("checkbox", {
      name: /Nguyên phụ liệu/,
    });
    expect(imageCheckbox).toHaveProperty("checked", true);
    expect(accessoriesCheckbox).toHaveProperty("checked", true);

    fireEvent.click(imageCheckbox);
    expect(onSelectionChange).toHaveBeenCalledWith("image", false);

    rerender(
      <ProductProductionDocSyncDialog
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
      <ProductProductionDocSyncDialog
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
      <ProductProductionDocSyncDialog
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
      <ProductProductionDocSyncDialog
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
});
