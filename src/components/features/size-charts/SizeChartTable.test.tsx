import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SizeChartTable } from "./SizeChartTable";

const sizeChart = {
  id: "f4ab3c98-2941-42e9-a92a-1e90f6087fd0",
  name: "Áo sơ mi nam",
  sizes: ["XS", "S", "M", "L", "XL"],
  status: "active" as const,
  createdAt: "2026-08-26T00:00:00.000Z",
  updatedAt: "2026-08-26T00:00:00.000Z",
};

afterEach(cleanup);

describe("SizeChartTable", () => {
  it("renders ordered sizes and exposes edit and delete actions", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <SizeChartTable
        sizeCharts={[sizeChart]}
        onEdit={onEdit}
        onToggleStatus={vi.fn()}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText("Áo sơ mi nam")).toBeTruthy();
    expect(screen.getAllByTestId("size-label").map((element) => element.textContent)).toEqual([
      "XS",
      "S",
      "M",
      "L",
      "XL",
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Sửa" }));
    expect(onEdit).toHaveBeenCalledWith(sizeChart);
    fireEvent.click(screen.getByRole("button", { name: "Xóa" }));
    expect(onDelete).toHaveBeenCalledWith(sizeChart);
  });

  it("provides an accessible status switch", () => {
    const onToggleStatus = vi.fn();
    render(
      <SizeChartTable
        sizeCharts={[sizeChart]}
        onEdit={vi.fn()}
        onToggleStatus={onToggleStatus}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("switch", { name: "Tắt Áo sơ mi nam" }));
    expect(onToggleStatus).toHaveBeenCalledWith(sizeChart);
  });
});
