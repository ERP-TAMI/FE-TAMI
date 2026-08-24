import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Stage } from "@/types/stage";
import { StageGroupForm } from "./StageGroupForm";

const stages: Stage[] = [
  {
    id: "771c0dc2-cd59-44e3-9b16-cacb200f20e5",
    stageCode: "GD-CAT",
    stageName: "Cắt vải",
    description: null,
    ssv: "10.000",
    status: "active",
  },
  {
    id: "56cda798-0d5b-4ea9-9d95-036fcb6b92d0",
    stageCode: "GD-MAY",
    stageName: "May thân",
    description: "May ráp thân",
    ssv: "12.500",
    status: "active",
  },
];

describe("StageGroupForm", () => {
  afterEach(cleanup);

  it("requires a name and at least one stage while allowing an omitted code", async () => {
    const onSubmit = vi.fn();
    render(
      <StageGroupForm
        mode="create"
        stages={stages}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Lưu nhóm công đoạn" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText("Tên nhóm là bắt buộc")).toBeTruthy();
    expect(screen.queryByText("Mã nhóm là bắt buộc")).toBeNull();
    expect(screen.getByText("Nhóm phải có ít nhất một công đoạn")).toBeTruthy();
  });

  it("omits a blank group code so the backend can generate it", async () => {
    const onSubmit = vi.fn();
    render(
      <StageGroupForm
        mode="create"
        stages={stages}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText("Tên nhóm công đoạn"), {
      target: { value: " Nhóm may chính " },
    });
    fireEvent.change(screen.getByLabelText("Chọn công đoạn"), {
      target: { value: stages[0].id },
    });
    fireEvent.click(screen.getByRole("button", { name: "Thêm công đoạn" }));
    fireEvent.click(screen.getByRole("button", { name: "Lưu nhóm công đoạn" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        groupName: "Nhóm may chính",
        description: null,
        items: [{ stageId: stages[0].id, orderIndex: 0 }],
      });
    });
  });

  it("adds stages, reorders them, and submits contiguous order indices", async () => {
    const onSubmit = vi.fn();
    render(
      <StageGroupForm
        mode="create"
        stages={stages}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText("Mã nhóm công đoạn"), {
      target: { value: " nc-may " },
    });
    fireEvent.change(screen.getByLabelText("Tên nhóm công đoạn"), {
      target: { value: " Nhóm may " },
    });
    fireEvent.change(screen.getByLabelText("Chọn công đoạn"), {
      target: { value: stages[0].id },
    });
    fireEvent.click(screen.getByRole("button", { name: "Thêm công đoạn" }));
    fireEvent.change(screen.getByLabelText("Chọn công đoạn"), {
      target: { value: stages[1].id },
    });
    fireEvent.click(screen.getByRole("button", { name: "Thêm công đoạn" }));
    fireEvent.click(screen.getByRole("button", { name: "Đưa May thân lên" }));
    fireEvent.click(screen.getByRole("button", { name: "Lưu nhóm công đoạn" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        groupCode: "NC-MAY",
        groupName: "Nhóm may",
        description: null,
        items: [
          { stageId: stages[1].id, orderIndex: 0 },
          { stageId: stages[0].id, orderIndex: 1 },
        ],
      });
    });
  });

  it("changes an existing child stage without creating a duplicate row", async () => {
    const onSubmit = vi.fn();
    render(
      <StageGroupForm
        mode="create"
        stages={stages}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText("Mã nhóm công đoạn"), {
      target: { value: "NC-MAY" },
    });
    fireEvent.change(screen.getByLabelText("Tên nhóm công đoạn"), {
      target: { value: "Nhóm may" },
    });
    fireEvent.change(screen.getByLabelText("Chọn công đoạn"), {
      target: { value: stages[0].id },
    });
    fireEvent.click(screen.getByRole("button", { name: "Thêm công đoạn" }));
    fireEvent.click(screen.getByRole("button", { name: "Thay công đoạn Cắt vải" }));
    fireEvent.change(screen.getByLabelText("Thay công đoạn ở vị trí 1"), {
      target: { value: stages[1].id },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu nhóm công đoạn" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [{ stageId: stages[1].id, orderIndex: 0 }],
        }),
      );
    });
  });
});
