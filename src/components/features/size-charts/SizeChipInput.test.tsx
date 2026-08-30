import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SizeChipInput } from "./SizeChipInput";

type HarnessProps = {
  initialLabels?: string[];
};

function Harness({ initialLabels = [] }: HarnessProps) {
  const [labels, setLabels] = useState(initialLabels);
  const [draft, setDraft] = useState("");

  return (
    <SizeChipInput
      id="test-size-input"
      labels={labels}
      draft={draft}
      onLabelsChange={setLabels}
      onDraftChange={setDraft}
    />
  );
}

afterEach(cleanup);

describe("SizeChipInput", () => {
  it("turns pasted comma/newline values into ordered wrapping chips", () => {
    render(<Harness />);

    fireEvent.paste(screen.getByLabelText("Nhập Size"), {
      clipboardData: { getData: () => " XS, S\nM " },
    });

    const chipList = screen.getByRole("list", { name: "Danh sách Size đã thêm" });
    expect(chipList.className).toContain("flex-wrap");
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "XS",
      "S",
      "M",
    ]);
    expect(screen.getByText("3 Size đã thêm")).toBeTruthy();
  });

  it("adds with Enter and removes a chip through an accessible button", () => {
    render(<Harness initialLabels={["XS", "S"]} />);

    const input = screen.getByLabelText("Nhập Size");
    fireEvent.change(input, { target: { value: " M " } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "Xóa Size XS" }));

    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["S", "M"]);
  });

  it("shows an immediate error and does not add a normalized duplicate", () => {
    render(<Harness initialLabels={["M"]} />);

    const input = screen.getByLabelText("Nhập Size");
    fireEvent.change(input, { target: { value: " m " } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByRole("alert").textContent).toBe('Size "m" đã tồn tại');
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });
});
