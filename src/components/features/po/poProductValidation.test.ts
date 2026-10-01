import { describe, expect, it } from "vitest";
import {
  getPoProductDeadlineError,
  getPoProductTodayDate,
} from "./poProductValidation";

describe("getPoProductDeadlineError", () => {
  it("requires a deadline when creating a PO product", () => {
    expect(getPoProductDeadlineError("")).toBe(
      "Vui lòng chọn hạn giao sản phẩm.",
    );
    expect(getPoProductDeadlineError("   ")).toBe(
      "Vui lòng chọn hạn giao sản phẩm.",
    );
  });

  it("accepts a selected deadline", () => {
    expect(getPoProductDeadlineError("2999-12-23", "2026-10-01")).toBeUndefined();
  });

  it("rejects a deadline before today", () => {
    expect(getPoProductDeadlineError("2026-09-29", "2026-10-01")).toBe(
      "Hạn giao sản phẩm không được là ngày trong quá khứ.",
    );
  });

  it("accepts today as a deadline", () => {
    expect(getPoProductDeadlineError("2026-10-01", "2026-10-01")).toBeUndefined();
  });

  it("uses the Vietnam business date for the date input minimum", () => {
    expect(getPoProductTodayDate(new Date("2026-09-30T18:00:00.000Z"))).toBe(
      "2026-10-01",
    );
  });
});
