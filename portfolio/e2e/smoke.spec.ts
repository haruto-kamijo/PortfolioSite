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
            // 外のサイトは読まない。届くかどうかで結果が変わらないように（サーバーの RSS 取得は BLOG_FEEDS_DISABLED で止めている）
            const origin = new URL(baseURL!).origin;
            await page.route((u) => u.origin !== origin, (route) => route.abort());

            const errors: string[] = [];
            page.on("pageerror", (e) => errors.push(e.message));
            // 読み込みの失敗は、文面ではなく相手で分ける。このサイトのファイル（_next の JS や画像）の失敗は拾い、上で止めた外のものは除く
            page.on("requestfailed", (r) => {
                const u = new URL(r.url());
                if (u.origin !== origin) return;
                // リンク先の先読み（?_rsc=）は、ページの読み込みが進むとブラウザが取り消すことがあるので除く
                if (u.searchParams.has("_rsc") && r.failure()?.errorText.includes("ERR_ABORTED")) return;
                errors.push(`読み込みに失敗：${r.url()}（${r.failure()?.errorText}）`);
            });
            page.on("response", (r) => {
                if (new URL(r.url()).origin === origin && r.status() >= 400) errors.push(`${r.status()}：${r.url()}`);
            });
            page.on("console", (m) => {
                // 読み込みの失敗はブラウザが console にも出すが、上の2つで相手を見て拾っているので、ここでは数えない
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

test("画像の最適化はサイト内の画像だけを受け付ける", async ({ request }) => {
    const optimize = (url: string) => request.get(`/_next/image?url=${encodeURIComponent(url)}&w=64&q=75`);
    expect((await optimize("/logo.png")).status()).toBe(200);
    // 外部の URL は、取りに行く前に 400 で断られる（next.config.mjs に remotePatterns を置かない）
    const remote = await optimize("https://firebasestorage.googleapis.com/v0/b/example.appspot.com/o/x.png?alt=media");
    expect(remote.status()).toBe(400);
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
