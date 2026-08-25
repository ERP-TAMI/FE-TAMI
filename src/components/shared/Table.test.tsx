import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Table } from "./Table";

type Row = { id: string; name: string };

const rows: Row[] = [{ id: "1", name: "Fabric" }];
const columns = [{ key: "name", header: "Tên" }];

describe("Table", () => {
  afterEach(cleanup);

  it("renders skeleton rows instead of data while loading", () => {
    render(
      <Table<Row> columns={columns} rows={rows} getRowKey={(row) => row.id} loading loadingRowCount={3} />,
    );

    expect(screen.queryByText("Fabric")).toBeNull();
    expect(document.querySelectorAll("tbody tr")).toHaveLength(3);
  });

  it("accepts a ReactNode empty message with interactive content", () => {
    render(
      <Table<Row>
        columns={columns}
        rows={[]}
        getRowKey={(row) => row.id}
        emptyMessage={
          <div>
            <p>Chưa có dữ liệu</p>
            <button type="button">Tạo mới</button>
          </div>
        }
      />,
    );

    expect(screen.getByText("Chưa có dữ liệu")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tạo mới" })).toBeTruthy();
  });

  it("applies additive interactive props to each data row", () => {
    const onDragStart = vi.fn();
    render(
      <Table<Row>
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        getRowProps={() => ({ draggable: true, onDragStart, title: "Kéo để sắp xếp" })}
      />,
    );

    const row = document.querySelector("tbody tr")!;
    expect(row.getAttribute("draggable")).toBe("true");
    expect(row.getAttribute("title")).toBe("Kéo để sắp xếp");
    fireEvent.dragStart(row);
    expect(onDragStart).toHaveBeenCalledTimes(1);
  });
});
