import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MaterialGroupListPage from "./MaterialGroupListPage";

const hooks = vi.hoisted(() => ({
  useMaterialGroups: vi.fn(),
  create: { isPending: false, error: null, mutateAsync: vi.fn() },
  update: { isPending: false, error: null, mutateAsync: vi.fn() },
  updateStatus: { isPending: false, error: null, mutateAsync: vi.fn() },
  remove: { isPending: false, error: null, mutateAsync: vi.fn() },
}));

vi.mock("../hooks/useMaterialGroups", () => ({
  useMaterialGroups: hooks.useMaterialGroups,
  useCreateMaterialGroup: () => hooks.create,
  useUpdateMaterialGroup: () => hooks.update,
  useUpdateMaterialGroupStatus: () => hooks.updateStatus,
  useDeleteMaterialGroup: () => hooks.remove,
}));

const materialGroup = {
  id: "e41a0a7d-28b1-4d78-9c26-b017f5c5f890",
  code: "FABRIC",
  name: "Fabric",
  displayOrder: 0,
  status: "active" as const,
};

describe("MaterialGroupListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it("renders the loading state", () => {
    hooks.useMaterialGroups.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
      error: null,
      refetch: vi.fn(),
    });

    render(<MaterialGroupListPage />);

    expect(screen.getByLabelText("Loading material groups")).toBeTruthy();
  });

  it("renders an API error and retries on request", () => {
    const refetch = vi.fn();
    hooks.useMaterialGroups.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      error: new Error("offline"),
      refetch,
    });

    render(<MaterialGroupListPage />);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(screen.getByText(/Cannot reach the Backend API/)).toBeTruthy();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("renders the empty state", () => {
    hooks.useMaterialGroups.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
      error: null,
      refetch: vi.fn(),
    });

    render(<MaterialGroupListPage />);

    expect(screen.getByText("No material groups match this filter.")).toBeTruthy();
  });

  it("creates a material group from the list screen", async () => {
    hooks.create.mutateAsync.mockResolvedValue({
      ...materialGroup,
      name: "Accessories",
      displayOrder: 3,
    });
    hooks.useMaterialGroups.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
      error: null,
      refetch: vi.fn(),
    });

    render(<MaterialGroupListPage />);
    fireEvent.click(screen.getByRole("button", { name: "Create material group" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Accessories" } });
    fireEvent.change(screen.getByLabelText("Display order"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Save material group" }));

    await waitFor(() => {
      expect(hooks.create.mutateAsync).toHaveBeenCalledWith({
        name: "Accessories",
        displayOrder: 3,
      });
    });
  });

  it("edits a material group from the list screen", async () => {
    hooks.update.mutateAsync.mockResolvedValue({
      ...materialGroup,
      name: "Main fabric",
      displayOrder: 2,
    });
    hooks.useMaterialGroups.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [materialGroup],
      error: null,
      refetch: vi.fn(),
    });

    render(<MaterialGroupListPage />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Main fabric" } });
    fireEvent.change(screen.getByLabelText("Display order"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Save material group" }));

    await waitFor(() => {
      expect(hooks.update.mutateAsync).toHaveBeenCalledWith({
        id: materialGroup.id,
        input: { name: "Main fabric", displayOrder: 2 },
      });
    });
  });

  it("changes status only after confirmation", async () => {
    hooks.updateStatus.mutateAsync.mockResolvedValue({
      ...materialGroup,
      status: "inactive",
    });
    hooks.useMaterialGroups.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [materialGroup],
      error: null,
      refetch: vi.fn(),
    });

    render(<MaterialGroupListPage />);
    fireEvent.click(screen.getByRole("button", { name: "Deactivate" }));

    expect(hooks.updateStatus.mutateAsync).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Deactivate" }));

    await waitFor(() => {
      expect(hooks.updateStatus.mutateAsync).toHaveBeenCalledWith({
        id: materialGroup.id,
        status: "inactive",
      });
    });
  });
});
