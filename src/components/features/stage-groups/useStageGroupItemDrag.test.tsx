import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Table, type TableColumn } from "@/components/shared/Table";
import { useStageGroupItemDrag } from "./useStageGroupItemDrag";

type TestRow = {
  fieldId: string;
  position: number;
  itemName: string;
};

const initialRows: TestRow[] = ["A", "B", "C", "D", "E"].map((itemName, index) => ({
  fieldId: itemName,
  position: index + 1,
  itemName,
}));

const columns: TableColumn<TestRow>[] = [
  {
    key: "stage",
    header: "Công đoạn",
    render: (row) => row.itemName,
  },
];

function DragHarness() {
  const [rows, setRows] = useState(initialRows);
  const move = (from: number, to: number) => {
    setRows((currentRows) => {
      const nextRows = [...currentRows];
      const [movedRow] = nextRows.splice(from, 1);
      nextRows.splice(to, 0, movedRow);
      return nextRows.map((row, index) => ({ ...row, position: index + 1 }));
    });
  };
  const { getRowProps } = useStageGroupItemDrag({ rows, disabled: false, onMove: move });

  return (
    <Table
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.fieldId}
      getRowProps={getRowProps}
    />
  );
}

function rowOrder() {
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => row.textContent);
}

describe("useStageGroupItemDrag", () => {
  const originalElementFromPoint = document.elementFromPoint;

  afterEach(() => {
    cleanup();
    document.elementFromPoint = originalElementFromPoint;
  });

  it("moves the first row to the fifth position only after mouseup", () => {
    render(<DragHarness />);
    const firstRow = screen.getByRole("row", { name: "A" });
    const fifthRow = screen.getByRole("row", { name: "E" });
    document.elementFromPoint = vi.fn(() => fifthRow);

    fireEvent.mouseDown(firstRow, { buttons: 1 });
    fireEvent.mouseMove(document, { buttons: 1, clientX: 100, clientY: 500 });

    expect(rowOrder()).toEqual(["A", "B", "C", "D", "E"]);

    fireEvent.mouseUp(document);

    expect(rowOrder()).toEqual(["B", "C", "D", "E", "A"]);
  });

  it("moves the fifth row to the first position on mouseup", () => {
    render(<DragHarness />);
    const firstRow = screen.getByRole("row", { name: "A" });
    const fifthRow = screen.getByRole("row", { name: "E" });
    document.elementFromPoint = vi.fn(() => firstRow);

    fireEvent.mouseDown(fifthRow, { buttons: 1 });
    fireEvent.mouseMove(document, { buttons: 1, clientX: 100, clientY: 100 });
    fireEvent.mouseUp(document);

    expect(rowOrder()).toEqual(["E", "A", "B", "C", "D"]);
  });
});
