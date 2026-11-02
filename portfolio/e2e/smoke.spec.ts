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
        test(`${url} が開ける`, async ({ page, baseURL }) => {
            // 外のサイト（ブログの RSS のサムネイルなど）は読まない。届くかどうかで結果が変わらないように
            const origin = new URL(baseURL!).origin;
            await page.route((u) => u.origin !== origin, (route) => route.abort());

            const errors: string[] = [];
            page.on("pageerror", (e) => errors.push(e.message));
            page.on("console", (m) => {
                // 上で止めた外の読み込みの失敗は除く
                if (m.type() === "error" && !m.text().startsWith("Failed to load resource")) errors.push(m.text());
            });

            const res = await page.goto(url);
            expect(res?.status()).toBe(200);
            await expect(page.locator("main")).toBeVisible();
            // ハイドレーションのあとに出るエラーも拾えるよう、読み込みが落ち着くまで待つ
            await page.waitForLoadState("networkidle");
            expect(errors).toEqual([]);
        });
    }
}

test("存在しないページは 404", async ({ page }) => {
    expect((await page.goto("/no-such-page"))?.status()).toBe(404);
    expect((await page.goto("/catalog/no-such-concept"))?.status()).toBe(404);
});

test("/ja/ で始まる URL は接頭辞なしに 308 で転送される", async ({ page }) => {
    const res = await page.goto("/ja/catalog");
    expect(res?.request().redirectedFrom()).not.toBeNull();
    expect((await res!.request().redirectedFrom()!.response())?.status()).toBe(308);
    expect(new URL(page.url()).pathname).toBe("/catalog");
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
