import { expect, test, type Page } from "@playwright/test";

const account = {
  email: process.env.E2E_EMAIL ?? "sa@tami.test",
  password: process.env.E2E_PASSWORD ?? "Test@12345",
};

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(account.email);
  await page.locator('input[name="password"]').fill(account.password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function openPoStep(page: Page) {
  await page.goto("/bom");
  await page.getByRole("button", { name: /Tạo NPL/i }).click();
  await page.getByRole("button", { name: "Tiếp tục" }).click();
}

test("PO picker only shows orders with products eligible for NPL", async ({ page }) => {
  await signIn(page);
  const login = await page.request.post("/api/auth/login", { data: account });
  const { accessToken } = await login.json();
  const response = await page.request.get("/api/boms/create-targets/po?page=1&limit=20", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(response.ok()).toBeTruthy();
  const result = await response.json();
  for (const po of result.items) {
    const products = await page.request.get(
      `/api/boms/create-targets/po/${po.id}/products`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    expect(products.ok()).toBeTruthy();
    expect((await products.json()).length).toBeGreaterThan(0);
  }

  await openPoStep(page);
  await page.getByLabel("-- Chọn Đơn hàng PO --").click();
  if (result.total === 0) {
    await expect(page.getByText("Không có PO nào còn sản phẩm chưa có NPL.")).toBeVisible();
  } else {
    await expect(page.getByRole("option")).toHaveCount(result.items.length);
  }
});

test("PO picker can load and select an eligible order after the first page", async ({ page }) => {
  await signIn(page);
  await page.route("**/api/boms/create-targets/po?**", async (route) => {
    const requestedPage = Number(new URL(route.request().url()).searchParams.get("page"));
    const items = (requestedPage === 1 ? Array.from({ length: 20 }, (_, i) => i + 1) : [21]).map(
      (number) => ({
        id: `mock-po-${number}`,
        poCode: `PO-MOCK-${String(number).padStart(3, "0")}`,
        customerNameSnapshot: "KH thử nghiệm",
      }),
    );
    await route.fulfill({
      json: { items, total: 21, page: requestedPage, limit: 20, totalPages: 2 },
    });
  });
  await page.route("**/api/boms/create-targets/po/mock-po-21/products", async (route) => {
    await route.fulfill({
      json: [{
        id: "mock-product-21",
        status: "draft",
        productCode: "PRODUCT-021",
        productName: "Sản phẩm thứ 21",
        colors: [],
        totalQuantity: 0,
      }],
    });
  });

  await openPoStep(page);
  await page.getByLabel("-- Chọn Đơn hàng PO --").click();
  await page.getByRole("button", { name: "Tải thêm PO" }).click();
  await page.getByRole("option", { name: /PO-MOCK-021/ }).click();
  await expect(page.getByText("PRODUCT-021")).toBeVisible();
});

test("Fit confirmation shows the selected styles once", async ({ page }) => {
  await signIn(page);
  await page.route("**/api/boms/create-targets/fit?**", async (route) => {
    await route.fulfill({
      json: {
        items: [{
          id: "mock-style-1",
          styleCode: "STYLE-MOCK-001",
          styleName: "Mẫu kiểm tra",
          category: null,
        }],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    });
  });
  await page.goto("/bom");
  await page.getByRole("button", { name: /Tạo NPL/i }).click();
  await page.getByRole("button", { name: /FIT NPL/ }).click();
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await page.getByRole("checkbox", { name: /^Chọn mẫu/ }).first().check();
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await expect(page.getByText("Sẽ tạo 1 NPL")).toBeVisible();
  await expect(page.getByText("Mẫu Fit tạo NPL")).toBeHidden();
});

test("Fit picker hides styles that already have NPL", async ({ page }) => {
  await signIn(page);
  const login = await page.request.post("/api/auth/login", { data: account });
  const { accessToken } = await login.json();
  const response = await page.request.get("/api/boms/create-targets/fit?page=1&limit=20", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(response.ok()).toBeTruthy();
  const result = await response.json();

  await page.goto("/bom");
  await page.getByRole("button", { name: /Tạo NPL/i }).click();
  await page.getByRole("button", { name: /FIT NPL/ }).click();
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  if (result.total === 0) {
    await expect(page.getByText("Không còn Mẫu Fit chưa có NPL.")).toBeVisible();
  } else {
    await expect(page.getByRole("checkbox", { name: /^Chọn mẫu/ })).toHaveCount(
      result.items.length,
    );
  }
});
