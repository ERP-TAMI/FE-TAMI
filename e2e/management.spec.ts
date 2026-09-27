import { expect, test } from "@playwright/test";

for (const roleCode of ["SA", "DIRECTOR", "NVKH"]) {
  test(`${roleCode}: landing, switch areas, reload and logout`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let loginCount = 0;
    const user = {
      id: "11111111-1111-4111-8111-111111111111",
      email: "fixture@example.test",
      fullName: "Người dùng kiểm thử",
      phone: null,
      roleCode,
      roleName: roleCode,
      permissions: roleCode === "SA" ? ["management.area.access"] : [],
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
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Mật khẩu").fill("fixture-password");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    if (roleCode === "SA") {
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
        await page.screenshot({ path: `test-results/management-${width}.png`, fullPage: true });
      }
      await page.getByRole("button", { name: "Switch to dark theme" }).click();
      await expect(page.locator("html")).toHaveClass(/dark/);
      await expect(page.getByLabel("Tháng báo cáo")).toHaveCSS(
        "background-color",
        "rgb(16, 24, 40)",
      );
      await expect(page.getByLabel("Tháng báo cáo")).toHaveCSS("color-scheme", "dark");
      await page.screenshot({ path: "test-results/management-dark-1440.png", fullPage: true });
      await page.getByRole("link", { name: "Tổng quan PO", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Tổng quan PO", exact: true })).toBeVisible();
      await page.reload();
      await expect(page.getByRole("heading", { name: "Tổng quan PO", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Tài khoản" }).click();
      await page.getByRole("link", { name: "Vào hệ thống nhân viên" }).click();
      await expect(page).toHaveURL(/(?<!management)\/dashboard$/);
      await page.reload();
      await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Tài khoản" }).click();
      await page.getByRole("link", { name: "Về khu Quản lý" }).click();
      await expect(page).toHaveURL(/\/management\/dashboard$/);
    } else {
      await expect(page).toHaveURL(/(?<!management)\/dashboard$/);
      await page.goto("/management/dashboard");
      await expect(page).toHaveURL(/(?<!management)\/dashboard$/);
    }
    await page.getByRole("button", { name: "Tài khoản" }).click();
    if (roleCode !== "SA")
      await expect(page.getByRole("link", { name: "Về khu Quản lý" })).toHaveCount(0);
    await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/management/dashboard");
    await expect(page).toHaveURL(/\/login$/);
    expect(loginCount).toBe(1);
    expect(errors).toEqual([]);
  });
}
