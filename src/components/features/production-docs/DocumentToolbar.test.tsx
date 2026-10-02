import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DocumentToolbar } from "./DocumentToolbar";

describe("DocumentToolbar read-only mode", () => {
  afterEach(cleanup);

  it("keeps preview available and hides edit, export, and workflow actions", () => {
    const onPreviewClick = vi.fn();

    render(
      <DocumentToolbar
        readOnly
        status="draft"
        isEditing={false}
        isSaving={false}
        isExporting={false}
        isResyncing={false}
        onEditClick={vi.fn()}
        onCancelEdit={vi.fn()}
        onSaveClick={vi.fn()}
        onPreviewClick={onPreviewClick}
        onExportExcelClick={vi.fn()}
        onResyncClick={vi.fn()}
        onCopyClick={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Xem trước" }));
    expect(onPreviewClick).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "Chỉnh sửa" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Xuất Excel" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Tùy chọn khác" })).toBeNull();
  });

  it("shows a visible sync action in editable view mode", () => {
    const onSyncClick = vi.fn();

    render(
      <DocumentToolbar
        status="draft"
        isEditing={false}
        isSaving={false}
        isExporting={false}
        isResyncing={false}
        onEditClick={vi.fn()}
        onCancelEdit={vi.fn()}
        onSaveClick={vi.fn()}
        onPreviewClick={vi.fn()}
        onSyncClick={onSyncClick}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Đồng bộ" }));
    expect(onSyncClick).toHaveBeenCalledOnce();
  });

  it("disables the sync action while a sync is pending", () => {
    render(
      <DocumentToolbar
        status="draft"
        isEditing={false}
        isSaving={false}
        isExporting={false}
        isResyncing={false}
        isSyncing
        onEditClick={vi.fn()}
        onCancelEdit={vi.fn()}
        onSaveClick={vi.fn()}
        onPreviewClick={vi.fn()}
        onSyncClick={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Đang đồng bộ..." })).toHaveProperty(
      "disabled",
      true,
    );
  });
});
