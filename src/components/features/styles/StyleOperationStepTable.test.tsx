import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StyleOperationStepTable } from "./StyleOperationStepTable";
import type { StyleOperationStepItem } from "@/api/styleOperationStepsApi";

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
  afterEach(cleanup);

  it("renders empty state message when steps array is empty", () => {
    render(
      <StyleOperationStepTable
        styleId="style-1"
        steps={[]}
        canEdit={true}
        onSave={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Chưa có công đoạn nào được tạo"),
    ).toBeTruthy();
  });

  it("renders table rows and metric summary cards", () => {
    render(
      <StyleOperationStepTable
        styleId="style-1"
        steps={mockSteps}
        cmBaseDays={30}
        canEdit={true}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue("Cắt vải")).toBeTruthy();
    expect(screen.getByText("Nhóm may cổ")).toBeTruthy();
    expect(screen.getByText("Tổng thời gian")).toBeTruthy();
    expect(screen.getByText("SP/người/ngày")).toBeTruthy();
    expect(screen.getAllByText("CM Công Nghệ").length).toBeGreaterThan(0);
  });


  it("adds a new row locally when clicking Thêm công đoạn and saves on Lưu quy trình click", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <StyleOperationStepTable
        styleId="style-1"
        steps={mockSteps}
        canEdit={true}
        onSave={onSave}
      />,
    );

    const addButtons = screen.getAllByRole("button", { name: "Thêm công đoạn" });
    expect(addButtons.length).toBeGreaterThan(0);
    fireEvent.click(addButtons[0]);

    // onSave is not called immediately on addRow
    expect(onSave).not.toHaveBeenCalled();

    // Clicking Lưu quy trình triggers onSave with newly added row
    const saveButtons = screen.getAllByRole("button", { name: /Lưu quy trình/i });
    fireEvent.click(saveButtons[0]);
    expect(onSave).toHaveBeenCalled();
  });

  it("triggers triggerSave when clicking Lưu quy trình", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <StyleOperationStepTable
        styleId="style-1"
        steps={mockSteps}
        canEdit={true}
        onSave={onSave}
      />,
    );

    const saveButtons = screen.getAllByRole("button", { name: /Lưu quy trình/i });
    expect(saveButtons.length).toBe(2);
    fireEvent.click(saveButtons[0]);

    expect(onSave).toHaveBeenCalled();
  });

  it("removes row locally when clicking delete button and saves on Lưu quy trình click", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <StyleOperationStepTable
        styleId="style-1"
        steps={mockSteps}
        canEdit={true}
        onSave={onSave}
      />,
    );

    const deleteButtons = screen.getAllByTitle("Xóa công đoạn");
    expect(deleteButtons.length).toBeGreaterThan(0);
    fireEvent.click(deleteButtons[0]);

    // Confirm in dialog (select modal confirm button)
    const confirmButtons = screen.getAllByRole("button", { name: "Xóa công đoạn" });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    // onSave is not called immediately on removeRow
    expect(onSave).not.toHaveBeenCalled();

    // Clicking Lưu quy trình triggers onSave with updated rows
    const saveButtons = screen.getAllByRole("button", { name: /Lưu quy trình/i });
    fireEvent.click(saveButtons[0]);
    expect(onSave).toHaveBeenCalled();
  });
});
