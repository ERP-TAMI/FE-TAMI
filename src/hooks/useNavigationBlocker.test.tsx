import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUnsavedChangesWarning, useSafeBlocker } from "./useNavigationBlocker";

describe("useNavigationBlocker", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("adds and removes beforeunload listener when dirty", () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { rerender, unmount } = renderHook(
      ({ isDirty }) => useUnsavedChangesWarning(isDirty, "Custom warning message"),
      { initialProps: { isDirty: false } }
    );

    expect(addEventListenerSpy).not.toHaveBeenCalledWith("beforeunload", expect.any(Function));

    // When marked dirty
    rerender({ isDirty: true });
    expect(addEventListenerSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));

    // When marked clean again
    rerender({ isDirty: false });
    expect(removeEventListenerSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));

    unmount();
  });

  it("beforeunload event sets returnValue and prevents default when dirty", () => {
    let capturedHandler: ((e: BeforeUnloadEvent) => void) | null = null;
    vi.spyOn(window, "addEventListener").mockImplementation((event, handler) => {
      if (event === "beforeunload") {
        capturedHandler = handler as (e: BeforeUnloadEvent) => void;
      }
    });

    renderHook(() => useUnsavedChangesWarning(true, "Unsaved changes exist"));
    expect(capturedHandler).not.toBeNull();

    const mockEvent = {
      preventDefault: vi.fn(),
      returnValue: "",
    } as unknown as BeforeUnloadEvent;

    capturedHandler!(mockEvent);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.returnValue).toBe("Unsaved changes exist");
  });

  it("returns unblocked safe fallback when outside DataRouter", () => {
    const { result } = renderHook(() => useSafeBlocker(true));
    expect(result.current.state).toBe("unblocked");
    expect(typeof result.current.reset).toBe("function");
    expect(typeof result.current.proceed).toBe("function");
  });
});
