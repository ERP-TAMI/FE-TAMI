import { expect, test } from "@playwright/test";

const SA = { email: "sa@tami.test", password: "123456" };

test.describe("Authentication flow (real browser, real BE)", () => {
  test("redirects an unauthenticated visitor from a protected route to /login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Đăng nhập" })).toBeVisible();
  });

  test("shows a Vietnamese error for wrong credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(SA.email);
    await page.getByLabel("Mật khẩu").fill("wrong-password");
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    await expect(page.getByText("Email hoặc mật khẩu không đúng.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("logs in, survives a full page reload, and logs out cleanly", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(SA.email);
    await page.getByLabel("Mật khẩu").fill(SA.password);
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    // The seeded SA test account's full name and role name are the same
    // string ("Quản trị hệ thống"), so the header legitimately renders it
    // twice (name + role badge) — assert the first occurrence is present.
    await expect(page.getByText("Quản trị hệ thống").first()).toBeVisible();

    // The regression this guards against: access tokens live only in memory,
    // so a reload must silently restore the session via the refresh cookie
    // instead of bouncing the user back to /login.
    await page.reload();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.getByRole("button", { name: "Đăng xuất" }).click();
    await expect(page).toHaveURL(/\/login$/);

    // A direct visit to a protected route after logout must not restore the
    // old session.
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("never persists the password, access token, or refresh token in browser storage", async ({
    page,
    context,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(SA.email);
    await page.getByLabel("Mật khẩu").fill(SA.password);
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    const storageDump = await page.evaluate(() => ({
      local: { ...window.localStorage },
      session: { ...window.sessionStorage },
    }));
    const serialized = JSON.stringify(storageDump);
    expect(serialized).not.toContain(SA.password);
    expect(serialized).not.toContain("eyJ"); // base64url JWT header prefix ("{"a...)

    // The refresh token cookie must be httpOnly (invisible to page.evaluate's
    // document.cookie) and must never appear in localStorage/sessionStorage.
    expect(await page.evaluate(() => document.cookie)).not.toContain("refresh_token");
    const cookies = await context.cookies();
    const refreshCookie = cookies.find((cookie) => cookie.name === "refresh_token");
    expect(refreshCookie?.httpOnly).toBe(true);
    expect(refreshCookie?.sameSite).toBe("Lax");

    await page.getByRole("button", { name: "Đăng xuất" }).click();
  });

  test("sends an already-authenticated visitor away from /login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(SA.email);
    await page.getByLabel("Mật khẩu").fill(SA.password);
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.getByRole("button", { name: "Đăng xuất" }).click();
  });
});
