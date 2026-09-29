import { describe, expect, it } from "vitest";
import {
  getManagementPoDetailPath,
  getManagementPoOverviewContext,
  getManagementPoOverviewReturnPath,
} from "./managementPoNavigation";

describe("management PO navigation", () => {
  it("opens the selected PO by id and carries the selected month and page", () => {
    expect(getManagementPoDetailPath("po/42", "2026-09", 3)).toBe(
      "/management/purchase-orders/po%2F42?fromMonth=2026-09&fromPage=3",
    );
  });

  it("uses valid URL month and page values for the overview context", () => {
    expect(
      getManagementPoOverviewContext(new URLSearchParams("month=2026-10&page=4"), "2026-09"),
    ).toEqual({ month: "2026-10", page: 4 });
  });

  it("falls back for invalid month and unsafe page values", () => {
    expect(
      getManagementPoOverviewContext(
        new URLSearchParams("month=2026-99&page=9007199254740992"),
        "2026-09",
      ),
    ).toEqual({ month: "2026-09", page: 1 });
  });

  it("returns to the originating month and page, with safe defaults for invalid context", () => {
    expect(
      getManagementPoOverviewReturnPath(
        new URLSearchParams("fromMonth=2026-08&fromPage=2"),
        "2026-09",
      ),
    ).toBe("/management/purchase-orders?month=2026-08&page=2");
    expect(
      getManagementPoOverviewReturnPath(
        new URLSearchParams("fromMonth=bad&fromPage=-1"),
        "2026-09",
      ),
    ).toBe("/management/purchase-orders?month=2026-09&page=1");
  });
});
