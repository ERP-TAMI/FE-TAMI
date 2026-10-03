import { describe, expect, it } from "vitest";
import {
  changeDashboardPeriodType,
  getCurrentDashboardPeriod,
  getDashboardYearOptions,
  getDashboardPeriodBounds,
  formatDashboardPeriodLabel,
} from "./dashboardDate";

describe("dashboard date periods", () => {
  it("converts selected calendar periods without shifting dates by timezone", () => {
    expect(getDashboardPeriodBounds({ periodType: "month", month: "2024-02" })).toEqual({
      fromDate: "2024-02-01",
      toDate: "2024-02-29",
    });
    expect(getDashboardPeriodBounds({ periodType: "year", year: "2024" })).toEqual({
      fromDate: "2024-01-01",
      toDate: "2024-12-31",
    });
  });

  it("switches period modes while preserving the selected calendar context", () => {
    expect(changeDashboardPeriodType({ periodType: "month", month: "2026-09" }, "year")).toEqual({
      periodType: "year",
      year: "2026",
    });
    expect(changeDashboardPeriodType({ periodType: "year", year: "2024" }, "range")).toEqual({
      periodType: "range",
      fromDate: "2024-01-01",
      toDate: "2024-12-31",
    });
  });

  it("defaults to the current HCM calendar month", () => {
    expect(getCurrentDashboardPeriod(new Date("2026-09-30T18:00:00.000Z"))).toEqual({
      periodType: "month",
      month: "2026-10",
    });
  });

  it("offers recent years in descending order and keeps an older selected year available", () => {
    expect(getDashboardYearOptions("2010", new Date("2026-07-01T12:00:00.000Z"))).toEqual([
      "2026",
      "2025",
      "2024",
      "2023",
      "2022",
      "2021",
      "2020",
      "2019",
      "2018",
      "2017",
      "2010",
    ]);
  });

  it("formats incomplete periods without exposing undefined date parts", () => {
    expect(formatDashboardPeriodLabel({ periodType: "month", month: "" })).toBe(
      "Chưa chọn tháng",
    );
    expect(
      formatDashboardPeriodLabel({ periodType: "range", fromDate: "", toDate: "2026-09-30" }),
    ).toBe("Chưa chọn khoảng ngày");
  });
});
