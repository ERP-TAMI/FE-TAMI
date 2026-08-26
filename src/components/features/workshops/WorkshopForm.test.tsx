import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WorkshopForm } from "./WorkshopForm";

const workshop = {
  id: "f4ab3c98-2941-42e9-a92a-1e90f6087fd0",
  workshopCode: "X-01",
  name: "Xưởng May 1",
  manager: "Nguyễn Văn A",
  location: "Khu A",
  capacity: 500,
  status: "active" as const,
  createdAt: "2026-08-26T00:00:00.000Z",
  updatedAt: "2026-08-26T00:00:00.000Z",
};

afterEach(cleanup);

describe("WorkshopForm", () => {
  it("normalizes create values and submits capacity as a number", async () => {
    const onSubmit = vi.fn();
    render(
      <WorkshopForm mode="create" isSubmitting={false} onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByLabelText("Mã xưởng"), { target: { value: " x-09 " } });
    fireEvent.change(screen.getByLabelText("Tên xưởng"), {
      target: { value: " Xưởng May Xuất Khẩu " },
    });
    fireEvent.change(screen.getByLabelText("Công suất/ngày"), { target: { value: "550" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu xưởng" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        workshopCode: "X-09",
        name: "Xưởng May Xuất Khẩu",
        manager: null,
        location: null,
        capacity: 550,
      });
    });
  });

  it("locks the code during edit and excludes it from the update payload", async () => {
    const onSubmit = vi.fn();
    render(
      <WorkshopForm
        mode="edit"
        workshop={workshop}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    expect((screen.getByLabelText("Mã xưởng") as HTMLInputElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Tên xưởng"), {
      target: { value: "Xưởng May Chính" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu xưởng" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: "Xưởng May Chính",
        manager: "Nguyễn Văn A",
        location: "Khu A",
        capacity: 500,
      });
    });
  });

  it("blocks negative and decimal capacity values", async () => {
    const onSubmit = vi.fn();
    render(
      <WorkshopForm mode="create" isSubmitting={false} onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByLabelText("Mã xưởng"), { target: { value: "X-09" } });
    fireEvent.change(screen.getByLabelText("Tên xưởng"), { target: { value: "Xưởng 9" } });
    fireEvent.change(screen.getByLabelText("Công suất/ngày"), { target: { value: "1.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu xưởng" }));

    expect(await screen.findByText("Công suất phải là số nguyên không âm")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("blocks capacity values beyond the PostgreSQL integer range", async () => {
    const onSubmit = vi.fn();
    render(
      <WorkshopForm mode="create" isSubmitting={false} onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByLabelText("Mã xưởng"), { target: { value: "X-09" } });
    fireEvent.change(screen.getByLabelText("Tên xưởng"), { target: { value: "Xưởng 9" } });
    fireEvent.change(screen.getByLabelText("Công suất/ngày"), {
      target: { value: "2147483648" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu xưởng" }));

    expect(await screen.findByText("Công suất phải từ 0 đến 2.147.483.647")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("confirms before discarding an edited form", () => {
    const onClose = vi.fn();
    render(
      <WorkshopForm
        mode="edit"
        workshop={workshop}
        isSubmitting={false}
        onClose={onClose}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Tên xưởng"), {
      target: { value: "Xưởng đang sửa" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Hủy các thay đổi?" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Bỏ thay đổi" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
