// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

/**
 * 画面の動きを確かめる E2E テスト（e2e/）。
 *
 * `next build` 済みのものを `next start` で立てて、ブラウザで操作する。
 * Firebase の環境変数が無くても、サイトは静的な既定値で表示されるので、CI では秘密の値を使わずに動かす。
 *
 * 手元では Playwright のブラウザを入れずに、Edge で動かせる：
 *   npm run test:e2e:edge（PW_CHANNEL=msedge を付けて動かす）
 */
const PORT = 3100;

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    // CI の遅さでたまに落ちるのを1回だけ救う。2回続けて落ちたら本物の不具合とみなす
    retries: process.env.CI ? 1 : 0,
    // next start 1つに多く同時に繋ぐと、ページの切り替えが遅れて時間切れになるので絞る
    workers: process.env.CI ? 2 : 3,
    expect: { timeout: 10_000 },
    reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
    use: {
        baseURL: `http://localhost:${PORT}`,
        channel: process.env.PW_CHANNEL || undefined,
        trace: "retain-on-failure",
    },
    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } }],
    webServer: {
        command: `npm run start -- -p ${PORT}`,
        url: `http://localhost:${PORT}/catalog`,
        // 立ち上げ済みのサーバーは使わない（BLOG_FEEDS_DISABLED が付いているとは限らないため）。3100 番が使われていたら止めてから動かす
        reuseExistingServer: false,
        timeout: 60_000,
        // 外の RSS（Zenn・note）を読まない。ビルドのときも同じ値にする（e2e.yml・README）
        env: { BLOG_FEEDS_DISABLED: "true" },
    },
});
