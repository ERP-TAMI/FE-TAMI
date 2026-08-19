import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MaterialGroupConfirmDialog } from "./MaterialGroupConfirmDialog";
import type { MaterialGroup } from "../types/material-group.types";

const materialGroup: MaterialGroup = {
  id: "e41a0a7d-28b1-4d78-9c26-b017f5c5f890",
  code: "STEEL",
  name: "Steel",
  displayOrder: 10,
  status: "active",
};

describe("MaterialGroupConfirmDialog", () => {
  it("does not perform a destructive action until the confirmation button is clicked", () => {
    const onConfirm = vi.fn();
    render(<MaterialGroupConfirmDialog action="delete" materialGroup={materialGroup} isSubmitting={false} onClose={vi.fn()} onConfirm={onConfirm} />);

    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
