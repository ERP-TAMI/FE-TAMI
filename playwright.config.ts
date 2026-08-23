import { defineConfig, devices } from "@playwright/test";

/**
 * Drives a real browser against the FE dev server (proxying to a real,
 * already-running BE) to verify the login/session flow end-to-end —
 * catches issues (cookie path/SameSite, reload behavior) that unit/component
 * tests and curl-level checks cannot.
 *
 * Requires both dev servers already running:
 *   FE-TAMI:  npm run dev        (http://127.0.0.1:5173)
 *   Erp-BE:   npm run start:dev  (http://localhost:3000)
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
