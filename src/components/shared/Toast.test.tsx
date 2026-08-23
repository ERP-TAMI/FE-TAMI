import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Toast } from "./Toast";

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("auto-dismisses after the given duration", () => {
    const onClose = vi.fn();
    render(<Toast open message="Đã lưu." duration={3000} onClose={onClose} />);

    expect(screen.getByText("Đã lưu.")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not auto-dismiss when duration is 0", () => {
    const onClose = vi.fn();
    render(<Toast open message="Đã lưu." duration={0} onClose={onClose} />);

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});
