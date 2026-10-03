import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HorizontalCountChart, PoStatusDonut } from "./DashboardCharts";

afterEach(cleanup);

describe("dashboard chart interactions", () => {
  it("shows quantities and exact bar lengths, including zero and small counts", () => {
    render(
      <HorizontalCountChart
        label="Trạng thái"
        unit="NPL"
        rows={[
          { key: "one", label: "Chờ RD", count: 1 },
          { key: "largest", label: "Chờ NVKH", count: 100 },
          { key: "zero", label: "Chờ SA duyệt", count: 0 },
        ]}
      />,
    );
    const row = screen.getByRole("button", { name: "Chờ RD: 1 NPL" });
    expect(row.querySelector('[style="width: 1%;"]')).not.toBeNull();
    fireEvent.focus(row);
    expect(screen.getByRole("tooltip").textContent).toContain("1 NPL");
    fireEvent.keyDown(row, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.mouseEnter(screen.getByRole("button", { name: "Chờ SA duyệt: 0 NPL" }));
    expect(screen.getByRole("tooltip").textContent).toContain("0 NPL");
  });

  it("dims other donut segments without changing geometry, from either segment or legend", () => {
    render(
      <PoStatusDonut
        rows={[
          { key: "active", label: "Đang xử lý", count: 3, color: "blue" },
          { key: "closed", label: "Hoàn thành", count: 1, color: "green" },
        ]}
      />,
    );
    const active = screen.getByRole("img", { name: "Đang xử lý: 3 PO" });
    const closed = screen.getByRole("img", { name: "Hoàn thành: 1 PO" });
    const path = active.getAttribute("d");
    fireEvent.mouseEnter(active);
    expect(active.getAttribute("opacity")).toBe("1");
    expect(closed.getAttribute("opacity")).toBe("0.25");
    expect(active.getAttribute("d")).toBe(path);
    expect(screen.getByRole("tooltip").textContent).toContain("Đang xử lý3");
    fireEvent.mouseLeave(active);
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.focus(screen.getByRole("button", { name: "Hoàn thành: 1 PO" }));
    expect(active.getAttribute("opacity")).toBe("0.25");
    expect(closed.getAttribute("opacity")).toBe("1");
  });

  it("handles an empty distribution without NaN or misleading colored slices", () => {
    const { container } = render(
      <PoStatusDonut rows={[{ key: "draft", label: "Nháp", count: 0, color: "gray" }]} />,
    );
    expect(container.querySelectorAll("path")).toHaveLength(0);
    expect(container.innerHTML).not.toContain("NaN");
  });
});
