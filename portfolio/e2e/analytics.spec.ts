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
    // 新しいタブを開き、ページも移るので時間がかかる。ほかのテストと並んで動くと 30 秒を超えることがある
    test.slow();
    // 外のサイトは開かない
    for (const site of ["https://github.com/**", "https://zenn.dev/**"]) {
        await context.route(site, (route) => route.fulfill({ status: 200, body: "" }));
    }
    const events = await collectEvents(page);
    await page.goto("/home");
    const popup = page.waitForEvent("popup");
    await page.locator("footer").getByRole("link", { name: "GitHub" }).click();
    await (await popup).close();
    await expect.poll(() => events).toEqual([{ type: "external", key: "https://github.com/haruto-kamijo" }]);

    // 中クリック（新しいタブで開く）も数える
    // （自動で動かしているブラウザでは、中クリックで新しいタブは開かない。送ったことだけを確かめる）
    await page.locator("footer").getByRole("link", { name: "Zenn" }).click({ button: "middle" });
    await expect.poll(() => events).toEqual([
        { type: "external", key: "https://github.com/haruto-kamijo" },
        { type: "external", key: "https://zenn.dev/kamijoharuto" },
    ]);

    // サイトの中のリンクは送らない
    await page.locator("header").first().getByRole("link", { name: "経歴" }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/career");
    expect(events).toHaveLength(2);
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

test("英語のページでも、タグの絞り込みを送る", async ({ page }) => {
    const events = await collectEvents(page);
    await page.goto("/en/portfolio");
    await page.getByRole("region", { name: "Filter by tag" }).getByRole("link", { name: /Next\.js/ }).first().click();
    await expect.poll(() => events).toEqual([{ type: "tag", key: "Next.js" }]);
});

test("パーツ図鑑でコードをコピーすると送る", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const events = await collectEvents(page);
    await page.goto("/catalog/parts#cta-button");
    const card = page.locator("section#cta-button article").first();
    await card.getByText("コードを見る").click();
    await expect(card.locator("pre code")).toContainText("<button");
    await card.getByRole("button", { name: "コピー" }).click();
    await expect(card.getByRole("status")).toHaveText("コピーしました");
    await expect.poll(() => events).toEqual([{ type: "catalog", key: "copy:cta-button" }]);
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
    // 大きすぎる本文は読まない。形は正しい（key の長さも上限内）ので、400 になるのは大きさのため。
    // 文字数では 1024 に届かなくても、バイト数で超えれば読まない（あ は UTF-8 で 3 バイト）。
    // Content-Length の無い（分けて送られる）本文は、src/lib/readLimited.test.ts で確かめる
    const padded = { type: "tag", key: "TypeScript", pad: "あ".repeat(340) };
    expect(JSON.stringify(padded).length).toBeLessThan(1024);
    expect((await request.post("/api/events", { data: padded, headers: sameOrigin })).status()).toBe(400);
});
