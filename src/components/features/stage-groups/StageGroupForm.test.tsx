import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Stage } from "@/types/stage";
import type { StageGroup } from "@/types/stage-group";
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

const group: StageGroup = {
  id: "64bfc097-69d1-43f5-af97-cb0e7428f7df",
  groupCode: "NS-NHOM-MAY",
  groupName: "Nhóm may",
  description: null,
  status: "active",
  itemCount: 1,
  createdAt: "2026-08-24T01:00:00.000Z",
  updatedAt: "2026-08-24T01:00:00.000Z",
  items: [
    {
      stageId: stages[1].id,
      stageCode: stages[1].stageCode,
      stageName: stages[1].stageName,
      description: stages[1].description,
      ssv: "15.250",
      orderIndex: 0,
    },
  ],
};

describe("StageGroupForm", () => {
  afterEach(cleanup);

  it("uses the wide modal layout required by the interactive item table", () => {
    render(
      <StageGroupForm
        mode="edit"
        group={group}
        stages={stages}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog").className).toContain("max-w-7xl");
  });

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

    fireEvent.click(screen.getByRole("button", { name: "Tạo Nhóm Công Đoạn" }));

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
    fireEvent.click(screen.getByRole("button", { name: "Tạo Nhóm Công Đoạn" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        groupName: "Nhóm may chính",
        description: null,
        items: [{ stageId: stages[0].id, ssv: "10.000", orderIndex: 0 }],
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
    fireEvent.click(screen.getByRole("button", { name: "Tạo Nhóm Công Đoạn" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        groupCode: "NC-MAY",
        groupName: "Nhóm may",
        description: null,
        items: [
          { stageId: stages[1].id, ssv: "12.500", orderIndex: 0 },
          { stageId: stages[0].id, ssv: "10.000", orderIndex: 1 },
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
    fireEvent.click(screen.getByRole("button", { name: "Sửa công đoạn Cắt vải" }));
    fireEvent.change(screen.getByLabelText("Thay công đoạn ở vị trí 1"), {
      target: { value: stages[1].id },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tạo Nhóm Công Đoạn" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [{ stageId: stages[1].id, ssv: "12.500", orderIndex: 0 }],
        }),
      );
    });
  });

  it("edits the group-specific SSV without changing the master Stage value", async () => {
    const onSubmit = vi.fn();
    render(
      <StageGroupForm
        mode="edit"
        group={group}
        stages={stages}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByText("15.250")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Sửa công đoạn May thân" }));
    const input = screen.getByLabelText("SSV cho May thân");
    expect((input as HTMLInputElement).value).toBe("15.250");
    fireEvent.change(input, { target: { value: "18.750" } });
    fireEvent.click(screen.getByRole("button", { name: "Hoàn tất sửa công đoạn May thân" }));
    fireEvent.click(screen.getByRole("button", { name: "Lưu nhóm công đoạn" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        groupName: "Nhóm may",
        description: null,
        items: [{ stageId: stages[1].id, ssv: "18.750", orderIndex: 0 }],
      });
    });
    expect(stages[1].ssv).toBe("12.500");
  });

  it("rejects an invalid group-specific SSV", async () => {
    const onSubmit = vi.fn();
    render(
      <StageGroupForm
        mode="edit"
        group={group}
        stages={stages}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sửa công đoạn May thân" }));
    fireEvent.change(screen.getByLabelText("SSV cho May thân"), {
      target: { value: "-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu nhóm công đoạn" }));

    expect(
      await screen.findByText("SSV phải là số không âm và có tối đa 3 số thập phân"),
    ).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("keeps the invalid SSV editor visible instead of hiding its error", async () => {
    const groupWithTwoItems: StageGroup = {
      ...group,
      itemCount: 2,
      items: [
        { ...group.items[0], orderIndex: 0 },
        {
          stageId: stages[0].id,
          stageCode: stages[0].stageCode,
          stageName: stages[0].stageName,
          description: stages[0].description,
          ssv: "9.500",
          orderIndex: 1,
        },
      ],
    };
    render(
      <StageGroupForm
        mode="edit"
        group={groupWithTwoItems}
        stages={stages}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sửa công đoạn May thân" }));
    fireEvent.change(screen.getByLabelText("SSV cho May thân"), {
      target: { value: "-1" },
    });
    expect(
      await screen.findByText("SSV phải là số không âm và có tối đa 3 số thập phân"),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Sửa công đoạn Cắt vải" }));
    expect(screen.getByLabelText("SSV cho May thân")).toBeTruthy();
    expect(screen.queryByLabelText("SSV cho Cắt vải")).toBeNull();
    expect(
      (screen.getByRole("button", { name: "Đưa Cắt vải lên" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("reorders Stage Group items by dragging a table row", async () => {
    const onSubmit = vi.fn();
    const groupWithTwoItems: StageGroup = {
      ...group,
      itemCount: 2,
      items: [
        {
          stageId: stages[0].id,
          stageCode: stages[0].stageCode,
          stageName: stages[0].stageName,
          description: stages[0].description,
          ssv: "9.500",
          orderIndex: 0,
        },
        { ...group.items[0], orderIndex: 1 },
      ],
    };
    render(
      <StageGroupForm
        mode="edit"
        group={groupWithTwoItems}
        stages={stages}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    const firstRow = screen.getByRole("row", { name: /1 GD-CAT Cắt vải/ });
    const secondRow = screen.getByRole("row", { name: /2 GD-MAY May thân/ });
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = vi.fn(() => secondRow);
    fireEvent.mouseDown(firstRow, { buttons: 1 });
    fireEvent.mouseMove(document, { buttons: 1, clientX: 100, clientY: 200 });
    fireEvent.mouseUp(document);
    document.elementFromPoint = originalElementFromPoint;
    fireEvent.click(screen.getByRole("button", { name: "Lưu nhóm công đoạn" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [
            { stageId: stages[1].id, ssv: "15.250", orderIndex: 0 },
            { stageId: stages[0].id, ssv: "9.500", orderIndex: 1 },
          ],
        }),
      );
    });
  });

  it("keeps each customized SSV attached to its Stage after reordering", async () => {
    const onSubmit = vi.fn();
    const groupWithTwoItems: StageGroup = {
      ...group,
      itemCount: 2,
      items: [
        {
          stageId: stages[0].id,
          stageCode: stages[0].stageCode,
          stageName: stages[0].stageName,
          description: stages[0].description,
          ssv: "9.500",
          orderIndex: 0,
        },
        {
          stageId: stages[1].id,
          stageCode: stages[1].stageCode,
          stageName: stages[1].stageName,
          description: stages[1].description,
          ssv: "15.250",
          orderIndex: 1,
        },
      ],
    };
    render(
      <StageGroupForm
        mode="edit"
        group={groupWithTwoItems}
        stages={stages}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Đưa Cắt vải xuống" }));
    fireEvent.click(screen.getByRole("button", { name: "Lưu nhóm công đoạn" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [
            { stageId: stages[1].id, ssv: "15.250", orderIndex: 0 },
            { stageId: stages[0].id, ssv: "9.500", orderIndex: 1 },
          ],
        }),
      );
    });
  });

  it("keeps an inactive saved Stage visible in edit mode", () => {
    render(
      <StageGroupForm
        mode="edit"
        group={group}
        stages={[stages[0]]}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText("May thân")).toBeTruthy();
    expect(screen.getByText("Đã tắt")).toBeTruthy();
  });
});
