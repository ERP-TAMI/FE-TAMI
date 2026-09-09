import { expect, test } from "@playwright/test";
import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

test("uploads, views, downloads and removes a Fit document without deleting the underlying file", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  // The "Xem"/"Tải xuống" buttons open a blank popup synchronously (to survive the
  // browser's popup blocker) then navigate it to a cross-origin S3 URL once the
  // presigned URL resolves. That cross-origin navigation on an about:blank popup
  // triggers a Chromium process swap (site isolation), so Playwright's `popup`
  // event Page object stops reflecting the real navigation — a known CDP/Playwright
  // limitation, not an app bug. Verifying via the context's own request stream
  // (tracked independently of any single Page object) sidesteps that limitation.
  const s3Requests: string[] = [];
  page.context().on("request", (req) => {
    if (req.url().includes(".s3.")) s3Requests.push(req.url());
  });

  const uniqueSuffix = Date.now();
  const styleCode = `E2E-DOC-${uniqueSuffix}`;
  const styleName = `E2E Fit Document Test ${uniqueSuffix}`;

  await page.goto("/login");
  await page.getByLabel("Email").fill("nvkh@tami.test");
  await page.getByLabel("Mật khẩu").fill("Test@12345");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/styles");
  await page.getByRole("button", { name: "+ Tạo Mẫu Fit Mới" }).click();
  await page.locator("#style-code").fill(styleCode);
  await page.locator("#style-name").fill(styleName);
  await page.getByRole("button", { name: "Tạo Mới" }).click();

  await page.getByRole("link", { name: styleCode }).click();
  await expect(page).toHaveURL(/\/styles\/.+\/detail$/);

  await page.getByRole("button", { name: "Tài liệu đính kèm" }).click();
  await expect(page).toHaveURL(/\/styles\/.+\/documents$/);
  await expect(page.getByText("Chưa có tài liệu nào được đính kèm.")).toBeVisible();

  const tempDir = mkdtempSync(join(tmpdir(), "erp-e2e-"));
  const filePath = join(tempDir, "fit-e2e.pdf");
  writeFileSync(filePath, `%PDF-1.4 E2E test content ${uniqueSuffix}`);

  await page.locator('input[type="file"]').setInputFiles(filePath);

  await expect(page.getByText("Tệp chờ tải lên (1):")).toBeVisible();
  await expect(page.getByText("fit-e2e.pdf")).toBeVisible();
  await page.getByRole("button", { name: /Tải lên/i }).click();

  await expect(page.getByText("Đang tải lên...")).toHaveCount(0, { timeout: 20000 });
  await expect(page.getByRole("cell", { name: "fit-e2e.pdf" })).toBeVisible({ timeout: 20000 });

  const viewPopupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Xem" }).click();
  const viewPopup = await viewPopupPromise;
  await expect
    .poll(() => s3Requests.some((url) => url.includes("response-content-disposition=inline")), {
      timeout: 10000,
    })
    .toBe(true);
  await viewPopup.close();

  const downloadPopupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Tải xuống" }).click();
  const downloadPopup = await downloadPopupPromise;
  await expect
    .poll(
      () => s3Requests.some((url) => url.includes("response-content-disposition=attachment")),
      { timeout: 10000 },
    )
    .toBe(true);
  await downloadPopup.close();

  await page.getByTitle("Gỡ khỏi mẫu Fit").click();
  await page.getByRole("button", { name: "Gỡ tài liệu" }).click();

  await expect(page.getByText("Đã gỡ tài liệu khỏi mẫu Fit.")).toBeVisible();
  await expect(page.getByText("Chưa có tài liệu nào được đính kèm.")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Chưa có tài liệu nào được đính kèm.")).toBeVisible();

  expect(errors).toEqual([]);
});
