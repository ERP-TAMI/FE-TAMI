import { expect, test, type Page } from "@playwright/test";

const account = {
  email: process.env.E2E_EMAIL ?? "sa@tami.test",
  password: process.env.E2E_PASSWORD ?? "123456",
};

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe("List view preferences", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());
    await signIn(page);
  });

  test("remembers the Fit card view and opens a card by clicking anywhere on it", async ({ page }) => {
    await page.goto("/styles");
    const cardView = page.getByRole("button", { name: "Thẻ" });
    await cardView.click();
    await expect(cardView).toHaveAttribute("aria-pressed", "true");
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("tami.styles.view-mode")))
      .toBe("grid");

    await page.reload();
    await expect(page.getByRole("button", { name: "Thẻ" })).toHaveAttribute("aria-pressed", "true");
    const firstCard = page.getByRole("link", { name: /^Mở Mẫu Fit/ }).first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();
    await expect(page).toHaveURL(/\/styles\/[0-9a-f-]+\/detail/i);
  });

  test("remembers the PO card view and opens a card by clicking anywhere on it", async ({ page }) => {
    await page.goto("/po");
    const cardView = page.getByRole("button", { name: "Thẻ" });
    await cardView.click();
    await expect(cardView).toHaveAttribute("aria-pressed", "true");
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("tami.po-list.view-mode")))
      .toBe("grid");

    await page.reload();
    await expect(page.getByRole("button", { name: "Thẻ" })).toHaveAttribute("aria-pressed", "true");
    const firstCard = page.getByRole("link", { name: /^Mở đơn hàng PO/ }).first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();
    await expect(page).toHaveURL(/\/po\/[0-9a-f-]+/i);
  });
});
