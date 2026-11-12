import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProductColorItem } from "../../../types/po";
import { ProductColorSizeEditor } from "./ProductColorSizeEditor";

afterEach(cleanup);

vi.mock("../../../hooks/useSizeCharts", () => ({
  useActiveSizeCharts: () => ({ data: { data: [] }, isLoading: false }),
}));

function TestEditorHarness({
  initialColors,
  onColorsChange,
}: {
  initialColors: ProductColorItem[];
  onColorsChange?: (colors: ProductColorItem[]) => void;
}) {
  const [colors, setColors] = useState<ProductColorItem[]>(initialColors);
  return (
    <div>
      <ProductColorSizeEditor
        colors={colors}
        onChange={(next) => {
          setColors(next);
          onColorsChange?.(next);
        }}
      />
      <div data-testid="ratio-preview">
        {colors.map((c, idx) => (
          <span key={idx} data-testid={`preview-ratio-${idx}`}>
            {c.ratio?.trim() ? c.ratio : "-"}
          </span>
        ))}
      </div>
    </div>
  );
}

describe("ProductColorSizeEditor - ratio per color (TAMI-125)", () => {
  it("defaults ratio to null and displays '-' when ratio is not entered", () => {
    const initialColors: ProductColorItem[] = [
      { colorName: "Đen", ratio: null, sizes: [{ sizeLabel: "M", quantity: 10 }] },
      { colorName: "Trắng", sizes: [{ sizeLabel: "L", quantity: 20 }] },
    ];

    render(<TestEditorHarness initialColors={initialColors} />);

    expect(screen.getByTestId("preview-ratio-0").textContent).toBe("-");
    expect(screen.getByTestId("preview-ratio-1").textContent).toBe("-");

    const blackRatioInput = screen.getByLabelText("Tỷ lệ màu Đen") as HTMLInputElement;
    const whiteRatioInput = screen.getByLabelText("Tỷ lệ màu Trắng") as HTMLInputElement;
    expect(blackRatioInput.value).toBe("");
    expect(whiteRatioInput.value).toBe("");
  });

  it("allows entering and editing ratio independently for each color without affecting other colors", () => {
    const onColorsChange = vi.fn();
    const initialColors: ProductColorItem[] = [
      { colorName: "Đen", ratio: "1:2:1", sizes: [{ sizeLabel: "M", quantity: 10 }] },
      { colorName: "Trắng", ratio: "30%", sizes: [{ sizeLabel: "L", quantity: 20 }] },
      { colorName: "Xanh", ratio: null, sizes: [{ sizeLabel: "XL", quantity: 15 }] },
    ];

    render(
      <TestEditorHarness
        initialColors={initialColors}
        onColorsChange={onColorsChange}
      />,
    );

    const blackRatioInput = screen.getByLabelText("Tỷ lệ màu Đen") as HTMLInputElement;
    const whiteRatioInput = screen.getByLabelText("Tỷ lệ màu Trắng") as HTMLInputElement;
    const blueRatioInput = screen.getByLabelText("Tỷ lệ màu Xanh") as HTMLInputElement;

    expect(blackRatioInput.value).toBe("1:2:1");
    expect(whiteRatioInput.value).toBe("30%");
    expect(blueRatioInput.value).toBe("");

    // Edit only "Đen" ratio -> "Trắng" and "Xanh" must remain unchanged
    fireEvent.change(blackRatioInput, { target: { value: "2:3:1" } });

    expect(blackRatioInput.value).toBe("2:3:1");
    expect(whiteRatioInput.value).toBe("30%");
    expect(blueRatioInput.value).toBe("");
    expect(screen.getByTestId("preview-ratio-0").textContent).toBe("2:3:1");
    expect(screen.getByTestId("preview-ratio-1").textContent).toBe("30%");
    expect(screen.getByTestId("preview-ratio-2").textContent).toBe("-");

    // Clear "Trắng" ratio -> stored as null and displayed as "-"
    fireEvent.change(whiteRatioInput, { target: { value: "" } });

    const lastCall = onColorsChange.mock.calls[onColorsChange.mock.calls.length - 1][0];
    expect(lastCall[0].ratio).toBe("2:3:1");
    expect(lastCall[1].ratio).toBeNull();
    expect(lastCall[2].ratio).toBeNull();
    expect(screen.getByTestId("preview-ratio-1").textContent).toBe("-");
  });
});
