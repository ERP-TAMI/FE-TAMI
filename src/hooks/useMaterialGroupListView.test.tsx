import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MaterialGroup } from "@/types/material-group";
import { useMaterialGroupListView } from "./useMaterialGroupListView";

const groups: MaterialGroup[] = Array.from({ length: 12 }, (_, index) => ({
  id: `group-${index + 1}`,
  name: `Nhóm ${index + 1}`,
  status: "active",
}));

describe("useMaterialGroupListView", () => {
  it("derives the current page without waiting for an effect", () => {
    const { result, rerender } = renderHook(
      ({ materialGroups }) => useMaterialGroupListView(materialGroups),
      { initialProps: { materialGroups: groups } },
    );

    act(() => result.current.setPage(2));
    expect(result.current.page).toBe(2);

    rerender({ materialGroups: groups.slice(0, 1) });

    expect(result.current.page).toBe(1);
    expect(result.current.paginatedMaterialGroups).toHaveLength(1);
  });
});
