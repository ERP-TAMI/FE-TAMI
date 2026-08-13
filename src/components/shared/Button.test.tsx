import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/shared/Button";

describe("Button", () => {
  it("renders its label and forwards click events", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Save changes</Button>);

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
