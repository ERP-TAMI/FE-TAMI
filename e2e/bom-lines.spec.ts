import { expect, test, request as pwRequest, type APIRequestContext, type Page } from "@playwright/test";

const PASSWORD = "123456";
const SHOTS = process.env.E2E_SHOTS_DIR;

type Role = "sa" | "nvkh" | "tpkh" | "rd" | "accounting";

async function apiLogin(api: APIRequestContext, role: Role): Promise<string> {
  const res = await api.post("/api/auth/login", {
    data: { email: `${role}@tami.test`, password: PASSWORD },
  });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).accessToken as string;
}

async function login(page: Page, role: Role) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(`${role}@tami.test`);
  await page.getByPlaceholder("Nhập mật khẩu").fill(PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

async function shot(page: Page, name: string) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
}

test.describe.configure({ mode: "serial" });

test.describe("BOM lines: whole-table edit mode, shared history, promote", () => {
  let api: APIRequestContext;
  let tokens: Record<Role, string>;
  let bomId = "";
  let lineMaterials: { id: string; code: string; name: string }[] = [];
  let spareMaterials: { id: string; code: string; name: string }[] = [];

  const auth = (role: Role) => ({ Authorization: `Bearer ${tokens[role]}` });

  const getBom = async (role: Role = "tpkh") => {
    const res = await api.get(`/api/boms/${bomId}`, { headers: auth(role) });
    expect(res.ok()).toBeTruthy();
    return res.json();
  };

  test.beforeAll(async ({ baseURL }) => {
    api = await pwRequest.newContext({ baseURL });
    tokens = {
      sa: await apiLogin(api, "sa"),
      nvkh: await apiLogin(api, "nvkh"),
      tpkh: await apiLogin(api, "tpkh"),
      rd: await apiLogin(api, "rd"),
      accounting: await apiLogin(api, "accounting"),
    };

    const suffix = `${Date.now()}`.slice(-8);
    const styleRes = await api.post("/api/styles", {
      headers: auth("sa"),
      data: { styleCode: `E2E-${suffix}`, styleName: `Áo kiểm thử ${suffix}` },
    });
    expect(styleRes.ok(), await styleRes.text()).toBeTruthy();
    const style = await styleRes.json();

    const bomRes = await api.post("/api/boms", {
      headers: auth("tpkh"),
      data: { type: "fit", styleId: style.id },
    });
    expect(bomRes.ok(), await bomRes.text()).toBeTruthy();
    bomId = (await bomRes.json()).id;

    const matRes = await api.get("/api/masters/materials?limit=100&status=active", {
      headers: auth("sa"),
    });
    const all = ((await matRes.json()).data as { id: string; materialCode: string; materialName: string }[])
      .map((m) => ({ id: m.id, code: m.materialCode, name: m.materialName }));
    lineMaterials = all.slice(0, 5);
    spareMaterials = all.slice(5, 10);

    const saved = await api.put(`/api/boms/${bomId}/lines`, {
      headers: auth("nvkh"),
      data: {
        lines: lineMaterials.map((m, i) => ({ materialId: m.id, consumption: i + 1, note: i === 0 ? "ghi chú đầu" : undefined })),
      },
    });
    expect(saved.ok(), await saved.text()).toBeTruthy();
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  test("NVKH edits several rows and saves them with ONE request", async ({ page }) => {
    const writes: string[] = [];
    page.on("request", (req) => {
      if (/\/boms\/[^/]+\/lines/.test(req.url()) && req.method() !== "GET") {
        writes.push(`${req.method()} ${new URL(req.url()).pathname}`);
      }
    });

    await login(page, "nvkh");
    await page.goto(`/bom/${bomId}`);
    await expect(page.getByText(lineMaterials[0].name, { exact: true })).toBeVisible();
    await expect(page.getByTestId("save-all-costs-floating-btn")).toHaveCount(0);
    await shot(page, "01-view-mode");

    await page.getByRole("button", { name: "Chỉnh sửa" }).click();
    const rows = page.locator('[data-testid^="bom-line-row-"]');
    await expect(rows).toHaveCount(5);
    await shot(page, "02-edit-mode");

    const firstId = (await rows.nth(0).getAttribute("data-testid"))!.replace("bom-line-row-", "");
    const secondId = (await rows.nth(1).getAttribute("data-testid"))!.replace("bom-line-row-", "");
    await page.getByTestId(`consumption-input-${firstId}`).fill("9.5");
    await page.getByTestId(`note-input-${secondId}`).fill("ghi chú sửa qua UI");
    await expect(page.getByText("Có 2 thay đổi chưa lưu")).toBeVisible();
    await shot(page, "03-dirty-bar");

    await page.getByTestId("save-all-costs-floating-btn").click();
    await expect(page.getByText("Đã lưu định mức")).toBeVisible();
    await expect(page.getByRole("button", { name: "Chỉnh sửa" })).toBeVisible();

    expect(writes).toEqual([`PUT /api/boms/${bomId}/lines`]);

    await page.reload();
    await expect(page.getByText("9.50")).toBeVisible();
    await expect(page.getByText("ghi chú sửa qua UI")).toBeVisible();
  });

  test("picker hides materials already in the BOM, searches on the server and adds rows to the draft only", async ({ page }) => {
    const writes: string[] = [];
    page.on("request", (req) => {
      if (/\/boms\/[^/]+\/lines/.test(req.url()) && req.method() !== "GET") writes.push(req.method());
    });

    await login(page, "nvkh");
    await page.goto(`/bom/${bomId}`);
    await page.getByRole("button", { name: "Chỉnh sửa" }).click();
    await page.getByRole("button", { name: "Thêm vật tư" }).click();

    const drawer = page.getByRole("dialog");
    await expect(drawer.getByText(spareMaterials[0].code, { exact: false }).first()).toBeVisible();
    for (const used of lineMaterials) {
      await expect(drawer.getByText(used.code, { exact: true })).toHaveCount(0);
    }
    await shot(page, "04-picker");

    // server-side search
    await drawer.getByPlaceholder("Tìm mã hoặc tên vật tư...").fill(spareMaterials[1].code);
    await expect(drawer.getByText(spareMaterials[1].code, { exact: true })).toBeVisible();
    await expect(drawer.getByText(spareMaterials[2].code, { exact: true })).toHaveCount(0);
    await drawer.getByPlaceholder("Tìm mã hoặc tên vật tư...").fill("");

    await drawer.getByLabel(`Chọn ${spareMaterials[0].name}`).check();
    await drawer.getByLabel(`Chọn ${spareMaterials[1].name}`).check();
    await drawer.getByRole("button", { name: "Thêm 2 vật tư" }).click();

    await expect(page.getByText("Mới", { exact: true })).toHaveCount(2);
    expect(writes).toEqual([]);
    await shot(page, "05-draft-with-new-rows");

    // the just-added materials must no longer be offered
    await page.getByRole("button", { name: "Thêm vật tư" }).click();
    await expect(page.getByRole("dialog").getByText(spareMaterials[0].code, { exact: true })).toHaveCount(0);
    await page.getByRole("dialog").getByRole("button", { name: "Hủy" }).click();

    await page.getByTestId("save-all-costs-floating-btn").click();
    await expect(page.getByText("Đã lưu định mức")).toBeVisible();
    expect(writes).toEqual(["PUT"]);

    expect((await getBom()).lines).toHaveLength(7);
  });

  test("delete + reorder only apply on save, and Hủy throws the draft away", async ({ page }) => {
    await login(page, "nvkh");
    await page.goto(`/bom/${bomId}`);
    const before = (await getBom()).lines.map((l: { id: string }) => l.id) as string[];

    await page.getByRole("button", { name: "Chỉnh sửa" }).click();
    await page.getByTitle("Xóa dòng vật tư").first().click();
    await page.getByTitle("Di chuyển xuống").first().click();
    await expect(page.locator('[data-testid^="bom-line-row-"]')).toHaveCount(6);
    expect((await getBom()).lines).toHaveLength(7);

    await page.getByRole("button", { name: "Hủy", exact: true }).first().click();
    await expect(page.locator('[data-testid^="bom-line-row-"]')).toHaveCount(7);
    expect((await getBom()).lines.map((l: { id: string }) => l.id)).toEqual(before);

    await page.getByRole("button", { name: "Chỉnh sửa" }).click();
    await page.getByTitle("Xóa dòng vật tư").first().click();
    await page.getByTitle("Di chuyển xuống").first().click();
    await page.getByTestId("save-all-costs-floating-btn").click();
    await expect(page.getByText("Đã lưu định mức")).toBeVisible();

    const after = (await getBom()).lines as { id: string; orderIndex: number }[];
    expect(after).toHaveLength(6);
    expect(after.map((l) => l.orderIndex)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(after[0].id).toBe(before[2]);
    expect(after[1].id).toBe(before[1]);
  });

  test("leaving with unsaved edits asks first; staying keeps the draft", async ({ page }) => {
    await login(page, "nvkh");
    await page.goto(`/bom/${bomId}`);
    await page.getByRole("button", { name: "Chỉnh sửa" }).click();
    const firstRow = page.locator('[data-testid^="bom-line-row-"]').first();
    const id = (await firstRow.getAttribute("data-testid"))!.replace("bom-line-row-", "");
    await page.getByTestId(`consumption-input-${id}`).fill("77");

    await page.getByRole("link", { name: "Danh sách NPL" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Dữ liệu chưa lưu" });
    await expect(dialog).toBeVisible();
    await shot(page, "06-unsaved-dialog");

    await dialog.getByRole("button", { name: "Tiếp tục chỉnh sửa" }).click();
    await expect(page).toHaveURL(new RegExp(`/bom/${bomId}`));
    await expect(page.getByTestId(`consumption-input-${id}`)).toHaveValue("77");

    await page.getByRole("link", { name: "Danh sách NPL" }).first().click();
    await page.getByRole("dialog", { name: "Dữ liệu chưa lưu" }).getByRole("button", { name: "Rời khỏi trang (Bỏ thay đổi)" }).click();
    await expect(page).toHaveURL(/\/bom(\?.*)?$/);
  });

  test("TPKH may edit at step 1, Accounting may not", async ({ page, browser }) => {
    await login(page, "tpkh");
    await page.goto(`/bom/${bomId}`);
    await expect(page.getByRole("button", { name: "Chỉnh sửa" })).toBeVisible();
    await page.getByRole("button", { name: "Chỉnh sửa" }).click();
    await expect(page.getByRole("button", { name: "Thêm vật tư" })).toBeVisible();
    // TPKH never sees the price column
    await expect(page.getByText("Đơn giá ($)")).toHaveCount(0);

    const ctx = await browser.newContext();
    const accPage = await ctx.newPage();
    await login(accPage, "accounting");
    await accPage.goto(`/bom/${bomId}`);
    await expect(accPage.locator('[data-testid^="bom-line-row-"]').first()).toBeVisible();
    await expect(accPage.getByRole("button", { name: "Chỉnh sửa" })).toHaveCount(0);
    await ctx.close();
  });

  test("shared history drawer: BOM header + lines, grouped per row", async ({ page }) => {
    await login(page, "nvkh");
    await page.goto(`/bom/${bomId}`);

    await page.getByRole("button", { name: "Lịch sử", exact: true }).nth(1).click();
    const drawer = page.getByRole("dialog").last();
    await expect(drawer.getByText("Lịch sử: Định mức nguyên phụ liệu")).toBeVisible();
    await expect(drawer.getByText(/Thêm 2 dòng/).first()).toBeVisible();
    await shot(page, "07-lines-history");
    await drawer.getByText(/Thêm 2 dòng/).first().click();
    await expect(drawer.getByText("Mới", { exact: false }).first()).toBeVisible();
    await shot(page, "08-lines-history-expanded");
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Lịch sử", exact: true }).first().click();
    await expect(page.getByText("Lịch sử: Thông tin BOM")).toBeVisible();
    await expect(page.getByText("Tạo BOM").first()).toBeVisible();
    await shot(page, "09-bom-history");
  });

  test("Accounting enters prices at step 4 with one PATCH; price is masked in history for NVKH", async ({ page, browser }) => {
    // walk the BOM to wait_accounting through the API
    for (const role of ["nvkh", "rd", "tpkh"] as Role[]) {
      if (role === "rd") {
        const withRows = await getBom();
        const put = await api.put(`/api/boms/${bomId}/lines`, {
          headers: auth("rd"),
          data: { lines: withRows.lines.map((l: { id: string }) => ({ lineId: l.id, consumption: 2 })) },
        });
        expect(put.ok(), await put.text()).toBeTruthy();
      }
      const cur = await getBom();
      const r = await api.post(`/api/boms/${bomId}/forward`, {
        headers: auth(role),
        data: { expectedRowVersion: cur.rowVersion },
      });
      expect(r.ok(), `${role}: ${await r.text()}`).toBeTruthy();
    }
    expect((await getBom()).status).toBe("wait_accounting");

    const writes: string[] = [];
    page.on("request", (req) => {
      if (/\/boms\/[^/]+\/lines/.test(req.url()) && req.method() !== "GET") {
        writes.push(`${req.method()} ${new URL(req.url()).pathname}`);
      }
    });
    await login(page, "accounting");
    await page.goto(`/bom/${bomId}`);
    const inputs = page.locator('[data-testid^="unit-cost-input-"]');
    await expect(inputs).toHaveCount(6);
    await expect(page.getByRole("button", { name: "Chỉnh sửa" })).toHaveCount(0);
    await expect(page.getByTestId(/^consumption-input-/)).toHaveCount(0);

    await inputs.nth(0).fill("12,5");
    await inputs.nth(1).fill("3");
    await expect(page.getByText("Có 2 thay đổi chưa lưu")).toBeVisible();
    await expect(page.getByText("Dự kiến").first()).toBeVisible();
    await shot(page, "10-accounting-prices");
    await page.getByTestId("save-all-costs-floating-btn").click();
    await expect(page.getByText("Đã lưu định mức")).toBeVisible();
    expect(writes).toEqual([`PATCH /api/boms/${bomId}/lines/costs`]);

    const saved = (await getBom("accounting")).lines;
    expect(saved[0].unitCost).toBe(12.5);
    expect(saved[1].unitCost).toBe(3);

    // history: Accounting sees numbers, NVKH sees ***
    await page.getByRole("button", { name: "Lịch sử", exact: true }).nth(1).click();
    await page.getByText(/Cập nhật đơn giá 2 dòng/).first().click();
    await expect(page.getByRole("dialog").last().getByText("12.5").first()).toBeVisible();
    await expect(page.getByRole("dialog").last().getByText(/Chờ TPKH xác nhận → Chờ Kế toán/)).toBeVisible();
    await shot(page, "11-history-price-accounting");

    const ctx = await browser.newContext();
    const nvkhPage = await ctx.newPage();
    await login(nvkhPage, "nvkh");
    await nvkhPage.goto(`/bom/${bomId}`);
    await nvkhPage.getByRole("button", { name: "Lịch sử", exact: true }).nth(1).click();
    await nvkhPage.getByText(/Cập nhật đơn giá 2 dòng/).first().click();
    const nvkhDrawer = nvkhPage.getByRole("dialog").last();
    await expect(nvkhDrawer.getByText("***").first()).toBeVisible();
    await expect(nvkhDrawer.getByText("12.5")).toHaveCount(0);
    await shot(nvkhPage, "12-history-price-masked");
    await ctx.close();
  });

  test("SA promotes an older revision while a newer one is in progress", async ({ page }) => {
    const priced = await getBom("accounting");
    const fill = await api.patch(`/api/boms/${bomId}/lines/costs`, {
      headers: auth("accounting"),
      data: { items: priced.lines.map((l: { id: string }) => ({ lineId: l.id, unitCost: 5 })) },
    });
    expect(fill.ok(), await fill.text()).toBeTruthy();
    let cur = await getBom("sa");
    let r = await api.post(`/api/boms/${bomId}/forward`, {
      headers: auth("accounting"),
      data: { expectedRowVersion: cur.rowVersion },
    });
    expect(r.ok(), await r.text()).toBeTruthy();
    cur = await getBom("sa");
    r = await api.post(`/api/boms/${bomId}/approve`, {
      headers: auth("sa"),
      data: { expectedRowVersion: cur.rowVersion },
    });
    expect(r.ok(), await r.text()).toBeTruthy();
    const rev1 = (await getBom("sa")).currentRevision;
    r = await api.post(`/api/boms/${bomId}/revisions`, {
      headers: auth("tpkh"),
      data: { reason: "đổi định mức lần 2" },
    });
    expect(r.ok(), await r.text()).toBeTruthy();
    expect((await getBom("sa")).currentRevision.revisionNo).toBe(2);

    await login(page, "sa");
    await page.goto(`/bom/${bomId}`);
    await page.getByRole("button", { name: /Lịch sử phiên bản/ }).click();
    await expect(page.getByRole("cell", { name: /Phiên bản 2/ })).toBeVisible();
    await shot(page, "13-revisions-tab");

    await page.getByRole("button", { name: /Đặt làm hiện hành/ }).click();
    const modal = page.getByRole("dialog");
    await expect(modal.getByText(/đang ở bước/)).toBeVisible();
    const confirm = modal.getByRole("button", { name: "Đặt Phiên bản 1 làm hiện hành" });
    await expect(confirm).toBeDisabled();
    await modal.getByRole("textbox").fill("Bản 2 sai định mức");
    await shot(page, "14-promote-modal");
    await confirm.click();
    await expect(page.getByText("Đã đặt phiên bản 1 làm phiên bản hiện hành")).toBeVisible();

    const after = await getBom("sa");
    expect(after.currentRevision.id).toBe(rev1.id);
    expect(after.status).toBe("closed");

    // old revision is kept, and the next revision number does not collide
    const revs = await (await api.get(`/api/boms/${bomId}/revisions`, { headers: auth("sa") })).json();
    expect(revs).toHaveLength(2);
    r = await api.post(`/api/boms/${bomId}/revisions`, {
      headers: auth("tpkh"),
      data: { reason: "làm lại từ bản 1" },
    });
    expect(r.ok(), await r.text()).toBeTruthy();
    expect((await getBom("sa")).currentRevision.revisionNo).toBe(3);

    // BOM header history shows the promote event
    await page.reload();
    await page.getByRole("button", { name: "Lịch sử", exact: true }).first().click();
    await expect(page.getByText(/Đổi phiên bản hiện hành về phiên bản 1/).first()).toBeVisible();
    await shot(page, "15-promote-history");
  });

  test("a non-SA user never sees the promote button", async ({ page }) => {
    await login(page, "tpkh");
    await page.goto(`/bom/${bomId}`);
    await page.getByRole("button", { name: /Lịch sử phiên bản/ }).click();
    await expect(page.getByRole("cell", { name: /Phiên bản 3/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Đặt làm hiện hành/ })).toHaveCount(0);
  });
});

test.describe("BOM tab inside the PO product page shares the same editor", () => {
  test("edit mode, one PUT, history button and no stray header buttons", async ({ page, baseURL }) => {
    const api = await pwRequest.newContext({ baseURL });
    const token = await apiLogin(api, "tpkh");
    const headers = { Authorization: `Bearer ${token}` };

    const pos = await (await api.get("/api/purchase-orders?limit=1", { headers })).json();
    const poId = pos.items[0].id as string;
    const products = await (await api.get(`/api/purchase-orders/${poId}/products`, { headers })).json();
    const productId = products.items[0].id as string;

    const created = await api.post("/api/boms", {
      headers,
      data: { type: "po", purchaseOrderProductId: productId },
    });
    let poBomId: string;
    if (created.status() === 409) {
      const existing = await (await api.get(`/api/boms?product=${productId}&limit=1`, { headers })).json();
      poBomId = existing.data[0].id as string;
    } else {
      expect(created.ok(), await created.text()).toBeTruthy();
      poBomId = (await created.json()).id as string;
    }

    const nvkhToken = await apiLogin(api, "nvkh");
    const mats = (await (await api.get("/api/masters/materials?limit=3&status=active", { headers })).json()).data as { id: string }[];
    const seeded = await api.put(`/api/boms/${poBomId}/lines`, {
      headers: { Authorization: `Bearer ${nvkhToken}` },
      data: { lines: mats.map((m, i) => ({ materialId: m.id, consumption: i + 1 })) },
    });
    expect(seeded.ok(), await seeded.text()).toBeTruthy();

    const writes: string[] = [];
    page.on("request", (req) => {
      if (/\/boms\/[^/]+\/lines/.test(req.url()) && req.method() !== "GET") writes.push(req.method());
    });

    await login(page, "nvkh");
    await page.goto(`/po/${poId}/products/${productId}/bom`);
    await expect(page.getByRole("button", { name: "Chỉnh sửa" }).last()).toBeVisible();
    await expect(page.getByRole("button", { name: "Lịch sử", exact: true }).last()).toBeVisible();
    await shot(page, "16-po-product-bom-tab");

    await page.getByRole("button", { name: "Chỉnh sửa" }).last().click();
    const first = page.locator('[data-testid^="bom-line-row-"]').first();
    const id = (await first.getAttribute("data-testid"))!.replace("bom-line-row-", "");
    await page.getByTestId(`consumption-input-${id}`).fill("4.25");
    await page.getByTestId("save-all-costs-floating-btn").click();
    await expect(page.getByText("Đã lưu định mức")).toBeVisible();
    expect(writes).toEqual(["PUT"]);

    const after = await (await api.get(`/api/boms/${poBomId}`, { headers })).json();
    expect(Number(after.lines[0].consumption)).toBe(4.25);
    await api.dispose();
  });
});
