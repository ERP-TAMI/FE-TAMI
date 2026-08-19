import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MaterialListPage from "../pages/MaterialListPage";

vi.mock("../../material-groups/hooks/useMaterialGroups", () => ({
  useMaterialGroup: () => ({ data: undefined }),
  useMaterialGroups: () => ({
    data: [],
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("../hooks/useUnits", () => ({
  useActiveUnits: () => ({
    data: [],
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("../hooks/useMaterials", () => ({
  useMaterials: () => ({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useCreateMaterial: () => ({ error: null, isPending: false, mutateAsync: vi.fn() }),
  useUpdateMaterial: () => ({ error: null, isPending: false, mutateAsync: vi.fn() }),
  useUpdateMaterialStatus: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

afterEach(cleanup);

describe("MaterialListPage filters", () => {
  it("renders a visible label for every filter so their controls align", () => {
    render(<MaterialListPage />);

    expect(screen.getByText("Search code or name", { selector: "label" })).toBeTruthy();
    expect(screen.getByText("Material group", { selector: "label" })).toBeTruthy();
    expect(screen.getByText("Status", { selector: "label" })).toBeTruthy();
  });
});
