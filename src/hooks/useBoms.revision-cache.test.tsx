import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBomRevisionDetail, useBomRevisionDiff } from "./useBoms";

const api = vi.hoisted(() => ({
  getRevisionDetail: vi.fn(),
  getRevisionDiff: vi.fn(),
}));

vi.mock("@/api/boms.api", () => ({ bomsApi: api }));

describe("NPL revision cache after another client updates a promoted revision", () => {
  beforeEach(() => vi.clearAllMocks());

  const setup = () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    return {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    };
  };

  it("refetches revision detail when reopened after an external edit", async () => {
    api.getRevisionDetail.mockResolvedValueOnce({ rowVersion: 1 });
    const { wrapper } = setup();
    const first = renderHook(() => useBomRevisionDetail("bom-1", "rev-1"), { wrapper });
    await waitFor(() => expect(first.result.current.data).toEqual({ rowVersion: 1 }));
    first.unmount();

    api.getRevisionDetail.mockResolvedValueOnce({ rowVersion: 2 });
    const reopened = renderHook(() => useBomRevisionDetail("bom-1", "rev-1"), { wrapper });
    await waitFor(() => expect(reopened.result.current.data).toEqual({ rowVersion: 2 }));
    expect(api.getRevisionDetail).toHaveBeenCalledTimes(2);
  });

  it("refetches a diff when reopened after an external edit", async () => {
    api.getRevisionDiff.mockResolvedValueOnce({ totalChanged: 1 });
    const { wrapper } = setup();
    const first = renderHook(() => useBomRevisionDiff("bom-1", "rev-1"), { wrapper });
    await waitFor(() => expect(first.result.current.data).toEqual({ totalChanged: 1 }));
    first.unmount();

    api.getRevisionDiff.mockResolvedValueOnce({ totalChanged: 2 });
    const reopened = renderHook(() => useBomRevisionDiff("bom-1", "rev-1"), { wrapper });
    await waitFor(() => expect(reopened.result.current.data).toEqual({ totalChanged: 2 }));
    expect(api.getRevisionDiff).toHaveBeenCalledTimes(2);
  });
});
