import { expect, test, type Page } from "@playwright/test";

const payload = Buffer.from(
  JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
).toString("base64url");

async function mockLogin(page: Page, roleCode: string, permissions: string[]) {
  const user = {
    id: "22222222-2222-4222-8222-222222222222",
    email: `${roleCode.toLowerCase()}@tami.test`,
    fullName: roleCode === "IT" ? "Nhân viên IT" : "Người dùng kiểm thử",
    roleCode,
    roleName: roleCode === "IT" ? "Công nghệ thông tin" : roleCode,
    permissions,
  };

  await page.route("**/auth/login", (route) =>
    route.fulfill({ json: { accessToken: `fixture.${payload}.fixture`, user } }),
  );
  await page.route("**/auth/logout", (route) => route.fulfill({ status: 204 }));
}

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu").fill("fixture-password");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
}

test("IT lands in its own area and opens user management", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await mockLogin(page, "IT", ["system.users.manage"]);
  await login(page, "it@tami.test");

  await expect(page).toHaveURL(/\/it\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Khu IT" })).toBeVisible();
  const navigation = page.getByRole("navigation", { name: "Điều hướng IT" });
  await expect(navigation.getByRole("link")).toHaveCount(1);
  await navigation.getByRole("link", { name: "Quản trị người dùng" }).click();
  await expect(page).toHaveURL(/\/it\/users$/);
  await expect(page.getByRole("heading", { name: "Quản trị người dùng" })).toBeVisible();

  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("heading", { name: "Quản trị người dùng" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
      true,
    );
  }

  await page.reload();
  await expect(page).toHaveURL(/\/it\/users$/);
  await page.getByRole("button", { name: "Tài khoản" }).click();
  await expect(page.getByText("Công nghệ thông tin")).toBeVisible();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(errors).toEqual([]);
});

test("SA opens the shared user page from the management area", async ({ page }) => {
  await mockLogin(page, "SA", ["management.area.access", "system.users.manage"]);
  await login(page, "sa@tami.test");

  await expect(page).toHaveURL(/\/management\/dashboard$/);
  const navigation = page.getByRole("navigation", { name: "Điều hướng Quản lý" });
  await navigation.getByRole("link", { name: "Quản trị người dùng" }).click();
  await expect(page).toHaveURL(/\/management\/users$/);
  await expect(page.getByRole("heading", { name: "Quản trị người dùng" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Điều hướng Quản lý" })).toBeVisible();
});

test("an account without permission cannot use any user-management entry", async ({ page }) => {
  await mockLogin(page, "NVKH", []);
  await login(page, "nvkh@tami.test");
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/admin/users");
  await expect(page.getByRole("heading", { name: "Bạn không có quyền truy cập" })).toBeVisible();
  await page.goto("/it/users");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/management/users");
  await expect(page).toHaveURL(/\/dashboard$/);
});
