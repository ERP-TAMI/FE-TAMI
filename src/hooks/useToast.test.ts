import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useToast } from "./useToast";

describe("useToast", () => {
  it("starts with no toast and defaults to a success variant", () => {
    const { result } = renderHook(() => useToast());

    expect(result.current.toast).toBeNull();

    act(() => result.current.showToast("Đã lưu."));
    expect(result.current.toast).toEqual({ message: "Đã lưu.", variant: "success" });
  });

  it("supports an explicit error variant and can be hidden", () => {
    const { result } = renderHook(() => useToast());

    act(() => result.current.showToast("Thất bại.", "error"));
    expect(result.current.toast).toEqual({ message: "Thất bại.", variant: "error" });

    act(() => result.current.hideToast());
    expect(result.current.toast).toBeNull();
  });
});
