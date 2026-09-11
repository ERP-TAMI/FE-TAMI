import { expect, test, type Page } from "@playwright/test";

const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString(
  "base64url",
);

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

const users = [
  {
    id: "22222222-2222-4222-8222-222222222222",
    fullName: "Nhân viên IT",
    email: "it@tami.test",
    phone: "0901234567",
    role: { code: "IT", name: "Công nghệ thông tin" },
    accountStatus: "active",
  },
  {
    id: "11111111-1111-4111-8111-111111111111",
    fullName: "Quản trị hệ thống",
    email: "sa@tami.test",
    phone: null,
    role: { code: "SA", name: "Quản trị hệ thống" },
    accountStatus: "locked",
  },
];

async function mockUserList(page: Page) {
  await page.route("**/system/users**", (route) => {
    const url = new URL(route.request().url());
    const search = url.searchParams.get("search")?.toLocaleLowerCase("vi") ?? "";
    const role = url.searchParams.get("role");
    const status = url.searchParams.get("status");
    const filtered = users.filter(
      (user) =>
        (!search ||
          [user.fullName, user.email, user.phone ?? ""].some((value) =>
            value.toLocaleLowerCase("vi").includes(search),
          )) &&
        (!role || user.role.code === role) &&
        (!status || user.accountStatus === status),
    );
    return route.fulfill({
      json: {
        data: filtered,
        meta: { total: filtered.length, page: 1, limit: 10, totalPages: 1 },
      },
    });
  });
}

test("IT lands in its own area and opens user management", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await mockLogin(page, "IT", ["system.users.manage"]);
  await mockUserList(page);
  await login(page, "it@tami.test");

  await expect(page).toHaveURL(/\/it\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Khu IT" })).toBeVisible();
  const navigation = page.getByRole("navigation", { name: "Điều hướng IT" });
  await expect(navigation.getByRole("link")).toHaveCount(1);
  await navigation.getByRole("link", { name: "Quản trị người dùng" }).click();
  await expect(page).toHaveURL(/\/it\/users$/);
  await expect(page.getByRole("heading", { name: "Quản trị người dùng" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Nhân viên IT" })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "sa@tami.test" })).toBeVisible();

  const searchRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname.endsWith("/system/users") && url.searchParams.get("search") === "it@tami";
  });
  await page.getByLabel("Tìm kiếm người dùng").fill("it@tami");
  await searchRequest;
  await expect(page.getByRole("cell", { name: "Nhân viên IT" })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "sa@tami.test" })).toHaveCount(0);

  await page.getByLabel("Tìm kiếm người dùng").fill("");
  await page.getByLabel("Lọc theo vai trò").selectOption("SA");
  await page
    .getByRole("group", { name: "Lọc theo trạng thái" })
    .getByRole("button", { name: "Bị khóa" })
    .click();
  await expect(page.getByRole("row").filter({ hasText: "sa@tami.test" })).toBeVisible();
  await expect(page.getByRole("table").getByText("Bị khóa", { exact: true })).toBeVisible();

  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("heading", { name: "Quản trị người dùng" })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }

  await page.reload();
  await expect(page).toHaveURL(/\/it\/users$/);
  await page.getByRole("button", { name: "Tài khoản" }).click();
  await expect(page.locator("#account-actions").getByText("Công nghệ thông tin")).toBeVisible();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(errors).toEqual([]);
});

test("SA opens the shared user page from the management area", async ({ page }) => {
  await mockLogin(page, "SA", ["management.area.access", "system.users.manage"]);
  await mockUserList(page);
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
