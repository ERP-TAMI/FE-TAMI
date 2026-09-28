import { describe, expect, it } from "vitest";
import type { ManagementPurchaseOrderSummaryStatus } from "@/types/management-dashboard";
import {
  getManagementPoDeadlineDisplay,
  getManagementPoStatusDisplay,
  getVietnamBusinessDate,
  resolveManagementPoSummary,
} from "./managementPoOverviewPresentation";

describe("management PO overview presentation", () => {
  it.each([
    ["not_completed", "Chưa xong"],
    ["completed", "Hoàn thành"],
    ["overdue", "Trễ hạn"],
    ["cancelled", "Đã hủy"],
  ] as const)("maps %s to the manager-facing label %s", (status, label) => {
    expect(getManagementPoStatusDisplay(status).label).toBe(label);
  });

  it("formats overdue, due-today, and future deadline deltas", () => {
    expect(getManagementPoDeadlineDisplay("overdue", -2).label).toBe("Trễ 2 ngày");
    expect(getManagementPoDeadlineDisplay("not_completed", 0).label).toBe("Đến hạn hôm nay");
    expect(getManagementPoDeadlineDisplay("not_completed", 6).label).toBe("Còn 6 ngày");
    expect(getManagementPoDeadlineDisplay("not_completed", 7).label).toBe("Còn 7 ngày");
  });

  it.each<ManagementPurchaseOrderSummaryStatus>(["completed", "cancelled"])(
    "does not show an actionable countdown for %s POs",
    (status) => {
      expect(getManagementPoDeadlineDisplay(status, -8)).toMatchObject({
        label: "—",
        tone: "neutral",
      });
    },
  );

  it("uses server status and deadline values when they are available", () => {
    expect(
      resolveManagementPoSummary(
        {
          status: "in_progress",
          deadline: "2026-09-30",
          managementStatus: "overdue",
          daysToDeadline: -2,
        },
        "2026-09-27",
      ),
    ).toEqual({ managementStatus: "overdue", daysToDeadline: -2 });
  });

  it.each([
    ["cancelled", "2026-09-25", "cancelled", -2],
    ["closed", "2026-09-20", "completed", -7],
    ["in_progress", "2026-09-25", "overdue", -2],
    ["draft", "2026-09-30", "not_completed", 3],
  ] as const)(
    "derives parent-version response status for %s PO",
    (status, deadline, managementStatus, daysToDeadline) => {
      expect(resolveManagementPoSummary({ status, deadline }, "2026-09-27")).toEqual({
        managementStatus,
        daysToDeadline,
      });
    },
  );

  it("uses Vietnam's business date near midnight instead of the browser UTC date", () => {
    expect(getVietnamBusinessDate(new Date("2026-09-26T17:30:00.000Z"))).toBe("2026-09-27");
  });
});
