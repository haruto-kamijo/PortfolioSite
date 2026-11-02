// e2e/smoke.spec.ts
import { expect, test } from "@playwright/test";

/**
 * 公開ページが日英とも開け、スクリプトのエラーが出ないこと。
 * 中身は Firebase が無いときの既定値（site.ts）で表示される
 */

const PAGES = [
    "/home",
    "/about",
    "/portfolio",
    "/portfolio?tab=blog",
    "/contact",
    "/catalog",
    "/catalog/kissa",
    "/catalog/saas",
    "/catalog/magazine",
    "/catalog/studio",
    "/catalog/parts",
];

for (const path of PAGES) {
    for (const prefix of ["", "/en"]) {
        const url = `${prefix}${path}`;
        test(`${url} が開ける`, async ({ page }) => {
            const errors: string[] = [];
            page.on("pageerror", (e) => errors.push(e.message));
            const res = await page.goto(url);
            expect(res?.status()).toBe(200);
            await expect(page.locator("main")).toBeVisible();
            expect(errors).toEqual([]);
        });
    }
}

test("存在しないページは 404", async ({ page }) => {
    expect((await page.goto("/no-such-page"))?.status()).toBe(404);
    expect((await page.goto("/catalog/no-such-concept"))?.status()).toBe(404);
});

test("/ja/ で始まる URL は接頭辞なしに転送される", async ({ page }) => {
    await page.goto("/ja/catalog");
    await expect(page).toHaveURL(/\/catalog$/);
});

test("OGP 画像とカバー画像が PNG で返る", async ({ request }) => {
    for (const path of ["/og.png", "/catalog-cover.png"]) {
        const res = await request.get(path);
        expect(res.status()).toBe(200);
        expect(res.headers()["content-type"]).toContain("image/png");
    }
});

test("ページに OGP の画像とカードの指定がある", async ({ page }) => {
    await page.goto("/home");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/og\.png$/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
});

test("ヘッダーの現在地：ブログのタブではブログ、ほかのタブでは制作物", async ({ page }) => {
    const header = page.locator("header").first();
    await page.goto("/portfolio?tab=blog");
    await expect(header.locator('a[aria-current="page"]')).toHaveText("ブログ");
    await page.goto("/portfolio?tab=pocs");
    await expect(header.locator('a[aria-current="page"]')).toHaveText("制作物");
});
