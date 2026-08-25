import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StageTable } from "./StageTable";
import type { Stage } from "@/types/stage";

const stage: Stage = {
  id: "8a3e42d1-6a72-4a54-a0c7-7508b5b4ae6b",
  stageCode: "GD-UI-TP",
  stageName: "Ủi thành phẩm",
  description: "Ủi hoàn thiện thành phẩm",
  ssv: "90.000",
  status: "active",
};

const inactiveStage: Stage = {
  ...stage,
  id: "b2308510-11ca-4f28-967d-75727235fe96",
  stageCode: "GD-BE-DINH-DAU-DAY",
  stageName: "Bẻ đính đầu dây",
  status: "inactive",
};

describe("StageTable", () => {
  afterEach(cleanup);

  it("balances the desktop columns and moves the status content closer to actions", () => {
    render(
      <StageTable
        stages={[stage, inactiveStage]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleStatus={vi.fn()}
      />,
    );

    const headers = screen
      .getByRole("columnheader", { name: "Mã công đoạn" })
      .closest("tr")?.children;

    expect(Array.from(headers ?? []).map((header) => header.className)).toEqual([
      "px-5 py-3.5 font-semibold whitespace-nowrap w-[18%] text-left",
      "px-5 py-3.5 font-semibold whitespace-nowrap w-[19%] text-left",
      "px-5 py-3.5 font-semibold whitespace-nowrap w-[19%] text-left",
      "px-5 py-3.5 font-semibold whitespace-nowrap w-[10%] text-right",
      "px-5 py-3.5 font-semibold whitespace-nowrap w-[17%] text-right",
      "px-5 py-3.5 font-semibold whitespace-nowrap w-[17%] text-center",
    ]);
    expect(screen.getByTitle("Đang sử dụng (Bấm để tắt)").parentElement?.className).toContain(
      "justify-end",
    );
    expect(screen.getByText("Đang sử dụng").className).toContain("w-20");
    expect(screen.getByText("Đã tắt").className).toContain("w-20");
  });
});
