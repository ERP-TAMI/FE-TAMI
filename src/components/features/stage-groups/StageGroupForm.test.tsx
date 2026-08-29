import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { StageGroup } from "@/types/stage-group";
import { StageGroupForm } from "./StageGroupForm";

const firstId = "771c0dc2-cd59-44e3-9b16-cacb200f20e5";
const secondId = "56cda798-0d5b-4ea9-9d95-036fcb6b92d0";
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
      id: firstId,
      itemName: "May thân",
      description: "May ráp thân",
      ssv: "15.250",
      status: "active",
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
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole("dialog").className).toContain("max-w-7xl");
  });

  it("toggles the stage group code between locked and editable states", () => {
    render(
      <StageGroupForm
        mode="edit"
        group={group}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const codeInput = screen.getByLabelText("Mã nhóm công đoạn") as HTMLInputElement;

    expect(codeInput.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Mở khóa mã nhóm công đoạn" }));

    expect(codeInput.disabled).toBe(false);
    expect(document.activeElement).toBe(codeInput);
    expect(screen.getByRole("button", { name: "Khóa mã nhóm công đoạn" })).toBeTruthy();
    expect(screen.getByText("Mã nhóm công đoạn đang mở khóa và có thể chỉnh sửa.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Khóa mã nhóm công đoạn" }));
    expect(codeInput.disabled).toBe(true);
  });

  it("submits a normalized stage group code after unlocking it", async () => {
    const onSubmit = vi.fn();
    render(
      <StageGroupForm
        mode="edit"
        group={group}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Mở khóa mã nhóm công đoạn" }));
    fireEvent.change(screen.getByLabelText("Mã nhóm công đoạn"), {
      target: { value: " ns-nhom-may-2 " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu nhóm công đoạn" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ groupCode: "NS-NHOM-MAY-2" }),
      );
    });
  });

  it("requires a group name and at least one independent child", async () => {
    const onSubmit = vi.fn();
    render(
      <StageGroupForm mode="create" isSubmitting={false} onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Tạo Nhóm Công Đoạn" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText("Tên nhóm là bắt buộc")).toBeTruthy();
    expect(screen.getByText("Nhóm phải có ít nhất một công đoạn con")).toBeTruthy();
  });

  it("creates a child directly without a Stage Master selector", async () => {
    const onSubmit = vi.fn();
    render(
      <StageGroupForm mode="create" isSubmitting={false} onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByLabelText("Tên nhóm công đoạn"), {
      target: { value: " Nhóm may chính " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Thêm công đoạn con" }));
    fireEvent.change(await screen.findByLabelText("Tên công đoạn con ở vị trí 1"), {
      target: { value: " May thân " },
    });
    fireEvent.change(screen.getByLabelText("Mô tả công đoạn con ở vị trí 1"), {
      target: { value: " May ráp thân " },
    });
    fireEvent.change(screen.getByLabelText("SSV cho May thân"), {
      target: { value: "12.500" },
    });
    expect(screen.queryByLabelText("Chọn công đoạn")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Tạo Nhóm Công Đoạn" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        groupName: "Nhóm may chính",
        description: null,
        items: [
          {
            itemName: "May thân",
            description: "May ráp thân",
            ssv: "12.500",
            status: "active",
            orderIndex: 0,
          },
        ],
      });
    });
  });

  it("keeps a stable child ID while editing all owned fields", async () => {
    const onSubmit = vi.fn();
    render(
      <StageGroupForm
        mode="edit"
        group={group}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sửa công đoạn May thân" }));
    fireEvent.change(screen.getByLabelText("Tên công đoạn con ở vị trí 1"), {
      target: { value: "May thân đã sửa" },
    });
    fireEvent.change(screen.getByLabelText("SSV cho May thân đã sửa"), {
      target: { value: "18.750" },
    });
    fireEvent.change(screen.getByLabelText("Trạng thái công đoạn con May thân đã sửa"), {
      target: { value: "inactive" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu nhóm công đoạn" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        groupName: "Nhóm may",
        description: null,
        items: [
          {
            id: firstId,
            itemName: "May thân đã sửa",
            description: "May ráp thân",
            ssv: "18.750",
            status: "inactive",
            orderIndex: 0,
          },
        ],
      });
    });
  });

  it("keeps the invalid child editor visible and blocks reorder", async () => {
    const twoItemGroup: StageGroup = {
      ...group,
      itemCount: 2,
      items: [
        group.items[0],
        {
          id: secondId,
          itemName: "Cắt vải",
          description: null,
          ssv: "9.500",
          status: "active",
          orderIndex: 1,
        },
      ],
    };
    render(
      <StageGroupForm
        mode="edit"
        group={twoItemGroup}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sửa công đoạn May thân" }));
    fireEvent.change(screen.getByLabelText("SSV cho May thân"), { target: { value: "-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu nhóm công đoạn" }));

    expect(
      await screen.findByText("SSV phải là số không âm và có tối đa 3 số thập phân"),
    ).toBeTruthy();
    expect(screen.getByLabelText("SSV cho May thân")).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Đưa Cắt vải lên" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("keeps child data attached while moving rows up and down", async () => {
    const onSubmit = vi.fn();
    const twoItemGroup: StageGroup = {
      ...group,
      itemCount: 2,
      items: [
        {
          id: secondId,
          itemName: "Cắt vải",
          description: null,
          ssv: "9.500",
          status: "active",
          orderIndex: 0,
        },
        { ...group.items[0], orderIndex: 1 },
      ],
    };
    render(
      <StageGroupForm
        mode="edit"
        group={twoItemGroup}
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
            { ...group.items[0], orderIndex: 0 },
            { ...twoItemGroup.items[0], orderIndex: 1 },
          ],
        }),
      );
    });
  });

  it("reorders independent children by dragging a table row", async () => {
    const onSubmit = vi.fn();
    const twoItemGroup: StageGroup = {
      ...group,
      itemCount: 2,
      items: [
        {
          id: secondId,
          itemName: "Cắt vải",
          description: null,
          ssv: "9.500",
          status: "active",
          orderIndex: 0,
        },
        { ...group.items[0], orderIndex: 1 },
      ],
    };
    render(
      <StageGroupForm
        mode="edit"
        group={twoItemGroup}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    const firstRow = screen.getByRole("row", { name: /1 Cắt vải/ });
    const secondRow = screen.getByRole("row", { name: /2 May thân/ });
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
            { ...group.items[0], orderIndex: 0 },
            { ...twoItemGroup.items[0], orderIndex: 1 },
          ],
        }),
      );
    });
  });
});
