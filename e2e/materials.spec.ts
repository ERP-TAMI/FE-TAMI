import { expect, test } from "@playwright/test";

const SA = { email: "sa@tami.test", password: "123456" };

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(SA.email);
  await page.getByLabel("Mật khẩu").fill(SA.password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function selectFirstRealUnit(page: import("@playwright/test").Page) {
  const unitSelect = page.getByLabel("Đơn vị tính");
  const firstRealUnitValue = await unitSelect.locator("option").nth(1).getAttribute("value");
  await unitSelect.selectOption(firstRealUnitValue!);
}

test.describe("Materials CRUD (real browser, real BE)", () => {
  test("creates, searches, edits, toggles status, and deletes a material", async ({ page }) => {
    const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const code = `E2E-${suffix}`;
    const name = `E2E Fabric ${suffix}`;
    const renamedName = `${name} (sua)`;

    await login(page);
    await page.goto("/masters/materials");
    await expect(page.getByRole("heading", { name: "Vật tư - Phụ liệu" })).toBeVisible();

    // Create — required fields only, unit left unselected first to prove validation.
    await page.getByRole("button", { name: "Tạo vật tư mới" }).click();
    await page.getByRole("button", { name: "Lưu vật tư" }).click();
    await expect(page.getByText("Mã vật tư là bắt buộc")).toBeVisible();
    await expect(page.getByText("Đơn vị tính là bắt buộc")).toBeVisible();

    await page.getByLabel("Mã vật tư").fill(code);
    await page.getByLabel("Tên vật tư").fill(name);
    await selectFirstRealUnit(page);
    await page.getByRole("button", { name: "Lưu vật tư" }).click();

    await expect(page.getByRole("heading", { name: "Tạo vật tư" })).toHaveCount(0);
    await page.getByLabel("Tìm kiếm vật tư").fill(code);
    await expect(page.getByText(name, { exact: true })).toBeVisible();

    // Edit — material code stays read-only; only the name changes.
    await page.getByRole("button", { name: "Sửa" }).click();
    await expect(page.getByLabel("Mã vật tư")).toBeDisabled();
    await page.getByLabel("Tên vật tư").fill(renamedName);
    await page.getByRole("button", { name: "Lưu vật tư" }).click();
    await expect(page.getByRole("heading", { name: "Chỉnh sửa vật tư" })).toHaveCount(0);
    await expect(page.getByText(renamedName)).toBeVisible();

    // Toggle status off then back on.
    await page.getByRole("button", { name: "Khóa" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Vô hiệu hóa" }).click();
    await expect(page.getByRole("button", { name: "Mở khóa" })).toBeVisible();

    await page.getByRole("button", { name: "Mở khóa" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Kích hoạt" }).click();
    await expect(page.getByRole("button", { name: "Khóa" })).toBeVisible();

    // Delete — the newly created (unreferenced) material can be hard-deleted.
    await page.getByRole("button", { name: "Xóa", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Xóa" }).click();
    await expect(page.getByText(renamedName)).toHaveCount(0);
  });

  test("rejects a duplicate material code", async ({ page }) => {
    const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const code = `DUP-${suffix}`;

    const createOne = async (name: string) => {
      await page.getByRole("button", { name: "Tạo vật tư mới" }).click();
      await page.getByLabel("Mã vật tư").fill(code);
      await page.getByLabel("Tên vật tư").fill(name);
      await selectFirstRealUnit(page);
      await page.getByRole("button", { name: "Lưu vật tư" }).click();
    };

    await login(page);
    await page.goto("/masters/materials");

    await createOne(`Original ${suffix}`);
    await expect(page.getByRole("heading", { name: "Tạo vật tư" })).toHaveCount(0);

    await createOne(`Duplicate ${suffix}`);
    await expect(page.getByText("Không thể lưu vật tư")).toBeVisible();
    // The form must still be open — the duplicate was rejected, not silently accepted.
    await expect(page.getByRole("heading", { name: "Tạo vật tư" })).toBeVisible();

    // Clean up the one material that did get created.
    await page.getByRole("button", { name: "Hủy" }).click();
    await page.getByRole("button", { name: "Bỏ thay đổi" }).click();
    await page.getByLabel("Tìm kiếm vật tư").fill(code);
    await page.getByRole("button", { name: "Xóa", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Xóa" }).click();
    await expect(page.getByText(`Original ${suffix}`)).toHaveCount(0);
  });

  test("creates a new unit inline (name only, no code) and uses it right away", async ({
    page,
  }) => {
    const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const code = `E2E-${suffix}`;
    const name = `E2E Fabric ${suffix}`;
    const unitName = `E2E Unit ${suffix}`;

    await login(page);
    await page.goto("/masters/materials");

    await page.getByRole("button", { name: "Tạo vật tư mới" }).click();
    await page.getByLabel("Mã vật tư").fill(code);
    await page.getByLabel("Tên vật tư").fill(name);

    await page.getByRole("button", { name: "+ Thêm đơn vị tính mới" }).click();
    await expect(page.getByLabel("Mã đơn vị")).toHaveCount(0);
    await page.getByLabel("Tên đơn vị").fill(unitName);
    await page.getByRole("button", { name: "Tạo đơn vị" }).click();
    await expect(page.getByRole("heading", { name: "Thêm đơn vị tính mới" })).toHaveCount(0);

    await page.getByRole("button", { name: "Lưu vật tư" }).click();
    await expect(page.getByRole("heading", { name: "Tạo vật tư" })).toHaveCount(0);

    await page.getByLabel("Tìm kiếm vật tư").fill(code);
    await expect(page.getByText(unitName)).toBeVisible();

    // Clean up the material (the newly created unit itself has no delete UI yet).
    await page.getByRole("button", { name: "Xóa", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Xóa" }).click();
    await expect(page.getByText(name, { exact: true })).toHaveCount(0);
  });
});
