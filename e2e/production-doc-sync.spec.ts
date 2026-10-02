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

async function authorizedHeaders(page: Page) {
  const response = await page.request.post("/api/auth/login", { data: account });
  expect(response.ok()).toBeTruthy();
  const { accessToken } = await response.json();
  return { Authorization: `Bearer ${accessToken}` };
}

async function findFitDocument(page: Page, needsContent: boolean) {
  const headers = await authorizedHeaders(page);
  const response = await page.request.get("/api/styles?limit=100", { headers });
  expect(response.ok()).toBeTruthy();
  const { data: styles } = await response.json();
  for (const style of styles) {
    const docResponse = await page.request.get(`/api/styles/${style.id}/production-docs`, {
      headers,
    });
    if (!docResponse.ok()) continue;
    const doc = await docResponse.json();
    if (!doc?.id) continue;
    const hasSection1 = Boolean(doc.section1ImageUrl || doc.section1Description);
    if (hasSection1 === needsContent) return { styleId: style.id, docId: doc.id };
  }
  throw new Error(`No Fit production document with section 1 content=${needsContent}`);
}

async function findPoDocument(page: Page, needsContent: boolean) {
  const headers = await authorizedHeaders(page);
  const response = await page.request.get("/api/purchase-orders?limit=50", { headers });
  expect(response.ok()).toBeTruthy();
  const { items: orders } = await response.json();
  for (const order of orders) {
    if (order.status === "closed" || order.status === "cancelled") continue;
    const productsResponse = await page.request.get(
      `/api/purchase-orders/${order.id}/products?limit=100`,
      { headers },
    );
    if (!productsResponse.ok()) continue;
    const { items: products } = await productsResponse.json();
    for (const product of products) {
      if (product.status === "closed") continue;
      const docResponse = await page.request.get(
        `/api/purchase-orders/${order.id}/products/${product.id}/production-doc`,
        { headers },
      );
      if (!docResponse.ok()) continue;
      const doc = await docResponse.json();
      if (!doc?.id) continue;
      if (Boolean(doc.section1ImageUrl) === needsContent) {
        return { poId: order.id, productId: product.id };
      }
    }
  }
  throw new Error(`No editable PO production document with image content=${needsContent}`);
}

test("Fit sync exposes independent sections and handles the backend overwrite conflict", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const { styleId } = await findFitDocument(page, true);
  await signIn(page);
  await page.goto(`/styles/${styleId}/production-doc`);

  await page.getByRole("button", { name: "Đồng bộ", exact: true }).click();
  await expect(page.getByRole("checkbox", { name: /Ảnh và mô tả Mẫu Fit/ })).toBeVisible();
  await page.getByRole("checkbox", { name: /Fit BOM/ }).uncheck();
  const conflict = page.waitForResponse(
    (response) =>
      response.url().includes("/production-docs/") &&
      response.url().endsWith("/resync") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Xác nhận đồng bộ" }).click();
  const response = await conflict;
  expect(response.status()).toBe(409);
  expect(response.request().postDataJSON()).toMatchObject({ sections: ["section1"] });
  await expect(page.getByRole("heading", { name: "Ghi đè nội dung đã có?" })).toBeVisible();
  await page.getByRole("button", { name: "Hủy" }).click();
  expect(errors).toEqual([]);
});

test("Fit sync updates only the selected empty section", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const { styleId } = await findFitDocument(page, false);
  await signIn(page);
  await page.goto(`/styles/${styleId}/production-doc`);

  await page.getByRole("button", { name: "Đồng bộ", exact: true }).click();
  await page.getByRole("checkbox", { name: /Fit BOM/ }).uncheck();
  const update = page.waitForResponse(
    (response) =>
      response.url().endsWith("/resync") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Xác nhận đồng bộ" }).click();
  const response = await update;
  expect(response.status()).toBe(200);
  expect(response.request().postDataJSON()).toMatchObject({ sections: ["section1"] });
  await expect(page.getByText("Đã đồng bộ Mục 1 từ Mẫu Fit.")).toBeVisible();
  expect(errors).toEqual([]);
});

test("PO sync asks before overwriting an existing image", async ({ page }) => {
  const { poId, productId } = await findPoDocument(page, true);
  await signIn(page);
  await page.goto(`/po/${poId}/products/${productId}/production-doc`);

  let patchCount = 0;
  page.on("request", (request) => {
    if (request.method() === "PATCH" && request.url().endsWith("/production-doc")) patchCount++;
  });
  await page.getByRole("button", { name: "Đồng bộ", exact: true }).click();
  await page.getByRole("checkbox", { name: /PO BOM/ }).uncheck();
  await page.getByRole("button", { name: "Xác nhận đồng bộ" }).click();
  await expect(page.getByRole("heading", { name: "Ghi đè nội dung đã có?" })).toBeVisible();
  expect(patchCount).toBe(0);
  await page.getByRole("button", { name: "Hủy" }).click();
  expect(patchCount).toBe(0);
});

test("PO image-only sync sends a valid partial update to the backend", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const { poId, productId } = await findPoDocument(page, false);
  await signIn(page);
  await page.goto(`/po/${poId}/products/${productId}/production-doc`);

  await page.getByRole("button", { name: "Đồng bộ", exact: true }).click();
  await page.getByRole("checkbox", { name: /PO BOM/ }).uncheck();
  const update = page.waitForResponse(
    (response) =>
      response.url().endsWith("/production-doc") && response.request().method() === "PATCH",
  );
  await page.getByRole("button", { name: "Xác nhận đồng bộ" }).click();
  const response = await update;
  expect(response.status()).toBe(200);
  expect(response.request().postDataJSON()).toHaveProperty("section1ImageUrl");
  expect(response.request().postDataJSON()).not.toHaveProperty("section2Accessories");
  await expect(page.getByText("Đã đồng bộ ảnh sản phẩm thành công.")).toBeVisible();
  expect(errors).toEqual([]);
});
