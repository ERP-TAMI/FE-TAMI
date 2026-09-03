import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StyleOperationStepTable } from "./StyleOperationStepTable";
import type { StyleOperationStepItem } from "@/api/styleOperationStepsApi";

const showToastMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    toast: null,
    showToast: showToastMock,
    hideToast: vi.fn(),
  }),
}));

const mockSteps: StyleOperationStepItem[] = [
  {
    id: "step-1",
    stepName: "Cắt vải",
    description: "Cắt thân trước và thân sau",
    timePerPiece: 15,
    ssv: 15,
    targetTotal: 1000,
    note: "Ghi chú cắt",
    orderIndex: 0,
    isGroup: false,
  },
  {
    id: "group-1",
    stepName: "Nhóm may cổ",
    description: "Các công đoạn thuộc cổ áo",
    timePerPiece: 0,
    ssv: 0,
    targetTotal: 1000,
    note: "",
    orderIndex: 1,
    isGroup: true,
    groupId: "group-master-1",
    groupItems: [
      { id: "s1", name: "May xẻ cổ", ssv: 10, orderIndex: 0 },
      { id: "s2", name: "Tra lá cổ", ssv: 15, orderIndex: 1 },
    ],
  },
  {
    id: "child-1",
    parentStepId: "group-1",
    stepName: "May xẻ cổ",
    timePerPiece: 10,
    ssv: 10,
    targetTotal: 1000,
    note: "",
    orderIndex: 2,
    isGroup: false,
  },
];

describe("StyleOperationStepTable", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows edit controls only after clicking Chỉnh sửa", () => {
    render(
      <StyleOperationStepTable
        styleId="style-1"
        steps={mockSteps}
        canEdit={true}
        onSave={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByRole("button", { name: "Chỉnh sửa" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Lưu quy trình/i })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Chỉnh sửa" }));

    expect(screen.queryByRole("button", { name: "Chỉnh sửa" })).toBeNull();
    expect(screen.getByRole("button", { name: /Lưu quy trình/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Thêm công đoạn/i })).toBeTruthy();
  });

  it("keeps delete local until the final save", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <StyleOperationStepTable
        styleId="style-1"
        steps={mockSteps}
        canEdit={true}
        onSave={onSave}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Chỉnh sửa" }));

    const deleteButtons = screen.getAllByTitle("Xóa công đoạn");
    fireEvent.click(deleteButtons[0]);

    const confirmButtons = screen.getAllByRole("button", { name: "Xóa công đoạn" });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    expect(onSave).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Lưu quy trình/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const savedSteps = onSave.mock.calls[0][0] as Partial<StyleOperationStepItem>[];
    expect(savedSteps).toHaveLength(2);
    expect(savedSteps.map((step) => step.stepName)).toEqual(["Nhóm may cổ", "May xẻ cổ"]);
  });

  it("saves rows in the current order after moving a block", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <StyleOperationStepTable
        styleId="style-1"
        steps={mockSteps}
        canEdit={true}
        onSave={onSave}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Chỉnh sửa" }));

    const downButtons = screen.getAllByTitle("Đưa công đoạn xuống");
    fireEvent.click(downButtons[0]);

    fireEvent.click(screen.getByRole("button", { name: /Lưu quy trình/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const savedSteps = onSave.mock.calls[0][0] as Partial<StyleOperationStepItem>[];
    expect(savedSteps.map((step) => step.stepName)).toEqual([
      "Nhóm may cổ",
      "May xẻ cổ",
      "Cắt vải",
    ]);
  });

  it("edits one common note and applies it to every saved row", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <StyleOperationStepTable
        styleId="style-1"
        steps={mockSteps}
        canEdit={true}
        onSave={onSave}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Chỉnh sửa" }));
    const noteInput = screen.getByRole("textbox", { name: "Ghi chú chung" });
    expect((noteInput as HTMLTextAreaElement).value).toBe("Ghi chú cắt");
    fireEvent.change(noteInput, { target: { value: "Ghi chú chung" } });
    fireEvent.click(screen.getByRole("button", { name: /Lưu quy trình/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const savedSteps = onSave.mock.calls[0][0] as Partial<StyleOperationStepItem>[];
    expect(savedSteps.every((step) => step.note === "Ghi chú chung")).toBe(true);
  });

  it("jumps to and marks the first row with an empty operation name", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <StyleOperationStepTable
        styleId="style-1"
        steps={mockSteps}
        canEdit={true}
        onSave={onSave}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Chỉnh sửa" }));
    fireEvent.click(screen.getByRole("button", { name: /Thêm công đoạn/i }));
    fireEvent.click(screen.getByRole("button", { name: /Lưu quy trình/i }));

    const error = await screen.findByRole("alert");
    expect(onSave).not.toHaveBeenCalled();
    expect(showToastMock).not.toHaveBeenCalled();
    expect(error.textContent).toContain("Vui lòng chọn tên công đoạn");
    await waitFor(() => expect(document.activeElement?.getAttribute("placeholder")).toBe("Tìm công đoạn..."));
  });
});
