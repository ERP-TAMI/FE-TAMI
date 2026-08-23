import { expect, test } from "@playwright/test";

const SA = { email: "sa@tami.test", password: "123456" };

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(SA.email);
  await page.getByLabel("Mật khẩu").fill(SA.password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe("Units management (real browser, real BE)", () => {
  test("creates, edits, toggles status, and deletes a unit", async ({ page }) => {
    const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const name = `E2E Unit ${suffix}`;
    const renamedName = `${name} (sua)`;

    await login(page);
    await page.goto("/masters/units");
    await expect(page.getByRole("heading", { name: "Đơn vị tính" })).toBeVisible();

    // Create — name is the only field.
    await page.getByRole("button", { name: "Tạo đơn vị tính mới" }).click();
    await page.getByLabel("Tên đơn vị").fill(name);
    await page.getByRole("button", { name: "Lưu đơn vị tính" }).click();

    await expect(page.getByRole("heading", { name: "Tạo đơn vị tính" })).toHaveCount(0);
    await page.getByLabel("Tìm kiếm đơn vị tính").fill(name);
    await expect(page.getByText(name, { exact: true })).toBeVisible();

    // Edit — rename the unit.
    await page.getByRole("button", { name: "Sửa" }).click();
    await page.getByLabel("Tên đơn vị").fill(renamedName);
    await page.getByRole("button", { name: "Lưu đơn vị tính" }).click();
    await expect(page.getByRole("heading", { name: "Chỉnh sửa đơn vị tính" })).toHaveCount(0);
    await expect(page.getByText(renamedName, { exact: true })).toBeVisible();

    // Toggle status off then back on — no confirmation dialog for the switch.
    await page.getByTitle("Đang sử dụng (Bấm để tắt)").click();
    await expect(page.getByText("Đã tắt")).toBeVisible();

    await page.getByTitle("Đã tắt (Bấm để bật)").click();
    await expect(page.getByText("Đang sử dụng")).toBeVisible();

    // Delete — requires confirmation.
    await page.getByRole("button", { name: "Xóa", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Xóa" }).click();
    await expect(page.getByText(renamedName, { exact: true })).toHaveCount(0);
  });

  test("validates the required name field", async ({ page }) => {
    await login(page);
    await page.goto("/masters/units");

    await page.getByRole("button", { name: "Tạo đơn vị tính mới" }).click();
    await page.getByRole("button", { name: "Lưu đơn vị tính" }).click();
    await expect(page.getByText("Tên đơn vị là bắt buộc")).toBeVisible();

    await page.getByRole("button", { name: "Hủy" }).click();
  });

  test("filters units by search and status", async ({ page }) => {
    const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const name = `E2E Filter Unit ${suffix}`;

    await login(page);
    await page.goto("/masters/units");

    await page.getByRole("button", { name: "Tạo đơn vị tính mới" }).click();
    await page.getByLabel("Tên đơn vị").fill(name);
    await page.getByRole("button", { name: "Lưu đơn vị tính" }).click();
    await expect(page.getByRole("heading", { name: "Tạo đơn vị tính" })).toHaveCount(0);

    await page.getByLabel("Tìm kiếm đơn vị tính").fill(name);
    await expect(page.getByText(name, { exact: true })).toBeVisible();

    // Deactivate it, then confirm the "Đang sử dụng" filter hides it.
    await page.getByTitle("Đang sử dụng (Bấm để tắt)").click();
    await expect(page.getByText("Đã tắt")).toBeVisible();

    const filterGroup = page.getByRole("group", { name: "Lọc theo trạng thái" });
    await filterGroup.getByRole("button", { name: "Đang sử dụng" }).click();
    await expect(page.getByText(name, { exact: true })).toHaveCount(0);

    await filterGroup.getByRole("button", { name: "Đã tắt" }).click();
    await expect(page.getByText(name, { exact: true })).toBeVisible();

    // Clean up — reactivate then delete the fixture unit.
    await page.getByTitle("Đã tắt (Bấm để bật)").click();
    await filterGroup.getByRole("button", { name: "Tất cả" }).click();
    await page.getByRole("button", { name: "Xóa", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Xóa" }).click();
    await expect(page.getByText(name, { exact: true })).toHaveCount(0);
  });
});
