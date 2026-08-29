import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";
import { Table } from "./Table";
import { Toast } from "./Toast";

describe("shared component localization", () => {
  afterEach(cleanup);

  it("uses Vietnamese default labels and empty messages", () => {
    render(
      <>
        <Modal open title="Tiêu đề" onClose={vi.fn()}>
          Nội dung
        </Modal>
        <Toast open message="Đã lưu" onClose={vi.fn()} />
        <Table
          columns={[{ key: "name", header: "Tên" }]}
          rows={[]}
          getRowKey={(_, index) => index}
        />
      </>,
    );

    expect(screen.getAllByLabelText("Đóng hộp thoại")).toHaveLength(1);
    expect(screen.getByLabelText("Đóng thông báo")).toBeTruthy();
    expect(screen.getByText("Không có dữ liệu.")).toBeTruthy();
  });
});
