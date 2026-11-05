// e2e/analytics.spec.ts
import { expect, test, type Page } from "@playwright/test";

/**
 * アクセス解析。ページの閲覧数は Cloudflare Web Analytics（本番のドメインでだけ読み込む）、
 * 外へのリンク・タグの絞り込み・カタログの操作は /api/events に送って数える。
 * ここでは送る中身だけを確かめ、/api/events には届かせない（E2E は Firestore に繋がないので）
 */

/** /api/events に送られた中身を集める */
const collectEvents = async (page: Page) => {
    const events: { type: string; key: string }[] = [];
    await page.route("**/api/events", async (route) => {
        events.push(JSON.parse(route.request().postData() ?? "{}"));
        await route.fulfill({ status: 204 });
    });
    return events;
};

test("フッターで、閲覧数を数えていることを知らせる。手元では Cloudflare のスクリプトを読み込まない", async ({ page }) => {
    await page.goto("/home");
    await expect(page.locator("footer").getByText("Cloudflare Web Analytics で閲覧数を数えています")).toBeVisible();
    await expect(page.locator('script[src*="cloudflareinsights"]')).toHaveCount(0);
    await page.goto("/en/home");
    await expect(page.locator("footer").getByText("counts page views with Cloudflare Web Analytics")).toBeVisible();
});

test("外へのリンクを押すと、リンク先の URL を送る", async ({ page, context }) => {
    // 外のサイトは開かない
    await context.route("https://github.com/**", (route) => route.fulfill({ status: 200, body: "" }));
    const events = await collectEvents(page);
    await page.goto("/home");
    const popup = page.waitForEvent("popup");
    await page.locator("footer").getByRole("link", { name: "GitHub" }).click();
    await (await popup).close();
    await expect.poll(() => events).toEqual([{ type: "external", key: "https://github.com/haruto-kamijo" }]);

    // サイトの中のリンクは送らない
    await page.locator("header").first().getByRole("link", { name: "経歴" }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/career");
    expect(events).toHaveLength(1);
});

test("タグで絞り込むと、選んだタグを送る。外すときは送らない", async ({ page }) => {
    const events = await collectEvents(page);
    await page.goto("/portfolio");
    const tags = page.getByRole("region", { name: "タグで探す" });
    await tags.getByRole("link", { name: /TypeScript/ }).first().click();
    await expect.poll(() => new URL(page.url()).searchParams.getAll("tag")).toEqual(["TypeScript"]);
    await expect.poll(() => events).toEqual([{ type: "tag", key: "TypeScript" }]);

    await tags.getByRole("link", { name: /TypeScript/ }).first().click();
    await expect.poll(() => new URL(page.url()).searchParams.getAll("tag")).toEqual([]);
    expect(events).toHaveLength(1);
});

test("カタログの幅の切り替えと、パーツの名前を見るモードを送る", async ({ page }) => {
    const events = await collectEvents(page);
    await page.goto("/catalog/kissa");
    await page.getByRole("group", { name: "表示する幅" }).getByRole("button", { name: "スマホ" }).click();
    await page.getByRole("group", { name: "見本の見方" }).getByRole("button", { name: "パーツの名前を見る" }).click();
    await expect.poll(() => events).toEqual([
        { type: "catalog", key: "width:kissa:phone" },
        { type: "catalog", key: "parts:kissa" },
    ]);
});

test("/api/events は、ほかのサイトから送られたものと形の違うものを数えない", async ({ request }) => {
    const sameOrigin = { "sec-fetch-site": "same-origin", "user-agent": "Mozilla/5.0 Chrome/120.0" };
    expect((await request.post("/api/events", { data: { type: "tag", key: "TypeScript" }, headers: { "sec-fetch-site": "cross-site" } })).status()).toBe(204);
    expect((await request.post("/api/events", { data: { type: "view", key: "/home" }, headers: sameOrigin })).status()).toBe(400);
    expect((await request.post("/api/events", { data: { type: "tag", key: "TypeScript" }, headers: sameOrigin })).status()).toBe(204);
});
