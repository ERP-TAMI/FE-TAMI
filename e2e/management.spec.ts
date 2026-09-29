import { expect, test } from "@playwright/test";

for (const roleCode of ["SA", "TPKH", "DIRECTOR", "NVKH"]) {
  test(`${roleCode}: landing, switch areas, reload and logout`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let loginCount = 0;
    const hasManagementAccess = roleCode === "SA" || roleCode === "TPKH";
    const user = {
      id: "11111111-1111-4111-8111-111111111111",
      email: "fixture@example.test",
      fullName: "Người dùng kiểm thử",
      phone: null,
      roleCode,
      roleName: roleCode,
      permissions: hasManagementAccess ? ["management.area.access"] : [],
      purchaseOrderMode: "READ_ONLY",
    };
    const payload = Buffer.from(
      JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
    ).toString("base64url");
    await page.route("**/auth/login", async (route) => {
      loginCount++;
      await route.fulfill({ json: { accessToken: `fixture.${payload}.fixture`, user } });
    });
    await page.route("**/auth/logout", (route) => route.fulfill({ status: 204 }));
    const requestedMonths: string[] = [];
    await page.route("**/management/dashboard/summary?*", async (route) => {
      const month = new URL(route.request().url()).searchParams.get("month") ?? "";
      requestedMonths.push(month);
      await route.fulfill({
        json: {
          month,
          totalPurchaseOrders: month === "2025-02" ? 7 : 12,
          completedPurchaseOrders: 5,
          overduePurchaseOrders: 3,
          activeEmployees: 24,
        },
      });
    });
    const overviewRequests: string[] = [];
    await page.route("**/management/dashboard/purchase-orders?*", async (route) => {
      const url = new URL(route.request().url());
      const month = url.searchParams.get("month") ?? "";
      overviewRequests.push(month);
      const crossMonthPo = {
        id: "11111111-1111-4111-8111-111111111112",
        poCode: "QA-CROSS-MONTH",
        customerNameSnapshot: "Khách hàng giao nhiều tháng",
        receivedDate: "2026-09-20",
        deadline: "2026-10-10",
        status: "in_progress",
        managementStatus: "not_completed",
        daysToDeadline: 11,
      };
      const items =
        month === "2090-01"
          ? []
          : month === "2026-10"
            ? [crossMonthPo]
            : [
                crossMonthPo,
                {
                  id: "11111111-1111-4111-8111-111111111113",
                  poCode: "QA-OVERDUE",
                  customerNameSnapshot: "Khách hàng quá hạn",
                  receivedDate: "2026-09-01",
                  deadline: "2026-09-25",
                  status: "in_progress",
                  managementStatus: "overdue",
                  daysToDeadline: -4,
                },
                {
                  id: "11111111-1111-4111-8111-111111111114",
                  poCode: "QA-CLOSED",
                  customerNameSnapshot: "Khách hàng đã hoàn thành",
                  receivedDate: "2026-09-02",
                  deadline: "2026-09-26",
                  status: "closed",
                  managementStatus: "completed",
                  daysToDeadline: -3,
                },
                {
                  id: "11111111-1111-4111-8111-111111111115",
                  poCode: "QA-CANCELLED",
                  customerNameSnapshot: "Khách hàng đã hủy",
                  receivedDate: "2026-09-03",
                  deadline: "2026-09-27",
                  status: "cancelled",
                  managementStatus: "cancelled",
                  daysToDeadline: -2,
                },
                {
                  id: "11111111-1111-4111-8111-111111111116",
                  poCode: "QA-UPCOMING",
                  customerNameSnapshot: "Khách hàng sắp hạn",
                  receivedDate: "2026-09-08",
                  deadline: "2026-09-30",
                  status: "in_progress",
                  managementStatus: "not_completed",
                  daysToDeadline: 1,
                },
              ];
      await route.fulfill({
        json: {
          month,
          totalPurchaseOrders: items.length,
          overduePurchaseOrders: month === "2026-09" ? 1 : 0,
          upcomingPurchaseOrders: month === "2026-09" ? 1 : 0,
          items,
          meta: {
            total: items.length,
            page: Number(url.searchParams.get("page") ?? 1),
            limit: 10,
            totalPages: 1,
          },
        },
      });
    });
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Mật khẩu").fill("fixture-password");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    if (hasManagementAccess) {
      await expect(page).toHaveURL(/\/management\/dashboard$/);
      await expect(page.getByText("Tổng số PO").locator("..").getByText("12")).toBeVisible();
      await expect(
        page.getByText("Nhân viên đang hoạt động").locator("..").getByText("24"),
      ).toBeVisible();
      await page.getByLabel("Tháng báo cáo").fill("2025-02");
      await expect(page.getByText("Tổng số PO").locator("..").getByText("7")).toBeVisible();
      expect(requestedMonths).toContain("2025-02");
      for (const width of [320, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(
          page.getByRole("navigation", { name: "Điều hướng Quản lý" }).getByRole("link"),
        ).toHaveCount(2);
        await page.getByRole("button", { name: "Tài khoản" }).click();
        await expect(page.getByRole("link", { name: "Vào hệ thống nhân viên" })).toBeVisible();
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        ).toBe(true);
        await page.keyboard.press("Escape");
        await expect(page.getByRole("button", { name: "Tài khoản" })).toBeFocused();
        if (roleCode === "SA") {
          await page.screenshot({ path: `test-results/management-${width}.png`, fullPage: true });
        }
      }
      await page.getByRole("button", { name: "Switch to dark theme" }).click();
      await expect(page.locator("html")).toHaveClass(/dark/);
      await expect(page.getByLabel("Tháng báo cáo")).toHaveCSS(
        "background-color",
        "rgb(16, 24, 40)",
      );
      await expect(page.getByLabel("Tháng báo cáo")).toHaveCSS("color-scheme", "dark");
      if (roleCode === "SA") {
        await page.screenshot({ path: "test-results/management-dark-1440.png", fullPage: true });
      }
      await page.getByRole("button", { name: "Switch to light theme" }).click();
      await page.getByRole("link", { name: "Tổng quan PO", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Tổng quan PO", exact: true })).toBeVisible();
      await page.getByLabel("Tháng xem báo cáo").fill("2026-09");
      await expect(page.getByRole("link", { name: "QA-OVERDUE" }).first()).toBeVisible();
      for (const code of ["QA-CROSS-MONTH", "QA-CLOSED", "QA-CANCELLED", "QA-UPCOMING"]) {
        await expect(page.getByRole("link", { name: code }).first()).toBeVisible();
      }
      await expect(page.getByText("Tổng số PO").locator("..").getByText("5")).toBeVisible();
      await expect(page.getByText("PO trễ hạn").locator("..").getByText("1")).toBeVisible();
      await expect(page.getByText("PO sắp đến hạn").locator("..").getByText("1")).toBeVisible();
      await page.getByRole("heading", { name: "Tổng quan PO", exact: true }).click();
      for (const width of [768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(page.getByRole("navigation", { name: "Điều hướng Quản lý" })).toBeVisible();
        await expect(page.getByRole("complementary", { name: "Primary navigation" })).toHaveCount(
          0,
        );
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        if (roleCode === "SA") {
          await page.screenshot({
            path: `test-results/management-overview-${width}.png`,
            fullPage: true,
          });
        }
      }
      await page.getByLabel("Tháng xem báo cáo").fill("2026-10");
      await expect(page.getByRole("link", { name: "QA-CROSS-MONTH" }).first()).toBeVisible();
      await expect(page.getByRole("link", { name: "QA-OVERDUE" })).toHaveCount(0);
      await page.getByLabel("Tháng xem báo cáo").fill("2090-01");
      await expect(page.getByText("Không có PO giao trong tháng 01/2090")).toBeVisible();
      expect(overviewRequests).toEqual(expect.arrayContaining(["2026-09", "2026-10", "2090-01"]));
      await page.reload();
      await expect(page.getByRole("heading", { name: "Tổng quan PO", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Tài khoản" }).click();
      await page.getByRole("link", { name: "Vào hệ thống nhân viên" }).click();
      await expect(page).toHaveURL(/(?<!management)\/dashboard$/);
      await expect(page.getByRole("complementary", { name: "Primary navigation" })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Điều hướng Quản lý" })).toHaveCount(0);
      await page.reload();
      await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Tài khoản" }).click();
      await page.getByRole("link", { name: "Về khu Quản lý" }).click();
      await expect(page).toHaveURL(/\/management\/dashboard$/);
    } else {
      await expect(page).toHaveURL(/(?<!management)\/dashboard$/);
      await page.goto("/management/dashboard");
      await expect(page).toHaveURL(/(?<!management)\/dashboard$/);
      await page.goto("/management/purchase-orders?month=2026-09");
      await expect(page).toHaveURL(/(?<!management)\/dashboard$/);
    }
    await page.getByRole("button", { name: "Tài khoản" }).click();
    if (!hasManagementAccess)
      await expect(page.getByRole("link", { name: "Về khu Quản lý" })).toHaveCount(0);
    await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/management/dashboard");
    await expect(page).toHaveURL(/\/login$/);
    expect(loginCount).toBe(1);
    expect(errors).toEqual([]);
  });
}
