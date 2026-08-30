import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WorkshopTable } from "./WorkshopTable";

const workshop = {
  id: "f4ab3c98-2941-42e9-a92a-1e90f6087fd0",
  workshopCode: "X-01",
  name: "Xưởng May 1",
  manager: "Nguyễn Văn A",
  location: "Khu A",
  capacity: 1500,
  status: "active" as const,
  createdAt: "2026-08-26T00:00:00.000Z",
  updatedAt: "2026-08-26T00:00:00.000Z",
};

afterEach(cleanup);

describe("WorkshopTable", () => {
  it("renders all business fields and actions", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <WorkshopTable
        workshops={[workshop]}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleStatus={vi.fn()}
      />,
    );

    expect(screen.getByText("X-01")).toBeTruthy();
    expect(screen.getByText("Xưởng May 1")).toBeTruthy();
    expect(screen.getByText("Nguyễn Văn A")).toBeTruthy();
    expect(screen.getByText("Khu A")).toBeTruthy();
    expect(screen.getByText("1.500")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sửa" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Xóa" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Xóa" }));
    expect(onDelete).toHaveBeenCalledWith(workshop);
  });

  it("provides an accessible status action", () => {
    const onToggleStatus = vi.fn();
    render(
      <WorkshopTable
        workshops={[workshop]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleStatus={onToggleStatus}
      />,
    );

    fireEvent.click(screen.getByRole("switch", { name: "Tắt Xưởng May 1" }));
    expect(onToggleStatus).toHaveBeenCalledWith(workshop);
  });
});
