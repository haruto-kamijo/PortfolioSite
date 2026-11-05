// src/lib/analytics/events.test.ts
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { sumCounts } from "../admin/analytics";
import { catalogKey, dayInTokyo, externalKey, isBotUserAgent, isCatalogKey, isSameOriginRequest, parseEvent } from "./events";

/** 自前で数える操作の決まり。`npm test` で動かす */

describe("externalKey", () => {
    const host = "kamijoharuto.com";

    test("https の外のリンクは、# と末尾の / を除いた形にする。? 以降は残す", () => {
        assert.equal(externalKey("https://github.com/haruto-kamijo/#top", host), "https://github.com/haruto-kamijo");
        assert.equal(externalKey("https://www.youtube.com/watch?v=AAA#t=10", host), "https://www.youtube.com/watch?v=AAA");
        assert.notEqual(externalKey("https://www.youtube.com/watch?v=AAA", host), externalKey("https://www.youtube.com/watch?v=BBB", host));
        assert.equal(externalKey("https://note.com/pon20020929/", host), externalKey("https://note.com/pon20020929", host));
        assert.equal(externalKey("https://zenn.dev/", host), "https://zenn.dev");
    });

    test("サイトの中・https でないもの・URL でないもの・長すぎるものは数えない", () => {
        for (const bad of ["https://kamijoharuto.com/home", "http://example.com", "mailto:a@example.com", "javascript:alert(1)", "/home", `https://example.com/${"a".repeat(300)}`]) {
            assert.equal(externalKey(bad, host), null, bad);
        }
    });
});

describe("isCatalogKey", () => {
    test("ある見本・幅・パーツだけを通す", () => {
        assert.equal(isCatalogKey(catalogKey.width("kissa", "pc")), true);
        assert.equal(isCatalogKey(catalogKey.parts("saas")), true);
        assert.equal(isCatalogKey(catalogKey.copy("hero")), true);
        for (const bad of ["width:kissa:huge", "width:nope:pc", "width:kissa", "parts:kissa:pc", "copy:nope", "copy:hero:x", "open:kissa", ""]) {
            assert.equal(isCatalogKey(bad), false, bad);
        }
    });
});

describe("isSameOriginRequest", () => {
    const origins = ["https://kamijoharuto.com"];
    const h = (over: Partial<Record<"secFetchSite" | "origin" | "referer", string>>) => ({ secFetchSite: null, origin: null, referer: null, ...over });

    test("Sec-Fetch-Site があればそれで、無ければ Origin・Referer で決める", () => {
        assert.equal(isSameOriginRequest(h({ secFetchSite: "same-origin" }), origins), true);
        assert.equal(isSameOriginRequest(h({ secFetchSite: "cross-site", origin: "https://kamijoharuto.com" }), origins), false);
        assert.equal(isSameOriginRequest(h({ origin: "https://kamijoharuto.com" }), origins), true);
        assert.equal(isSameOriginRequest(h({ referer: "https://kamijoharuto.com/portfolio?tag=Python" }), origins), true);
        assert.equal(isSameOriginRequest(h({ origin: "https://evil.example" }), origins), false);
        assert.equal(isSameOriginRequest(h({ origin: "null" }), origins), false);
        assert.equal(isSameOriginRequest(h({}), origins), false);
    });
});

describe("parseEvent", () => {
    test("種類と対象のそろったものだけを読む", () => {
        assert.deepEqual(parseEvent({ type: "tag", key: "Next.js" }), { type: "tag", key: "Next.js" });
        for (const bad of [null, "x", { type: "view", key: "a" }, { type: "tag", key: "" }, { type: "tag", key: 1 }, { type: "tag", key: "a".repeat(301) }]) {
            assert.equal(parseEvent(bad), null, JSON.stringify(bad));
        }
    });
});

describe("dayInTokyo と isBotUserAgent", () => {
    test("日本時間の日付にする", () => {
        assert.equal(dayInTokyo(new Date("2026-11-04T15:00:00Z")), "2026-11-05");
        assert.equal(dayInTokyo(new Date("2026-11-04T14:59:59Z")), "2026-11-04");
    });

    test("ボットと自動で動かしているブラウザを見分ける", () => {
        assert.equal(isBotUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
        assert.equal(isBotUserAgent("Mozilla/5.0 HeadlessChrome/120.0"), true);
        assert.equal(isBotUserAgent(""), true);
        assert.equal(isBotUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0 Safari/537.36"), false);
    });
});

describe("sumCounts", () => {
    test("日ごとの回数を足し、多い順（同じなら名前順）に並べる。形の違う値は飛ばす", () => {
        const counts = sumCounts([
            { tag: { python: 2, "next.js": 1 }, external: { "https://github.com/haruto-kamijo": 1 } },
            { tag: { "next.js": 1, broken: "x" }, catalog: null },
        ]);
        assert.deepEqual(counts.tag, [
            { key: "next.js", count: 2 },
            { key: "python", count: 2 },
        ]);
        assert.deepEqual(counts.external, [{ key: "https://github.com/haruto-kamijo", count: 1 }]);
        assert.deepEqual(counts.catalog, []);
    });
});
