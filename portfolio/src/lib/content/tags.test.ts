// src/lib/content/tags.test.ts
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { fill } from "@/lib/dictionary";
import { countTags, hasAllTags, readSelectedTags, tagsHref, toggleTagHref } from "./tags";
import type { PortfolioItem } from "./types";

/** タグでの絞り込みの決まり。`npm test` で動かす（E2E は作品が1枚しかなく、複数の作品での動きを確かめられないため） */

const item = (id: string, tags: string[]): PortfolioItem => ({
    id,
    category: "sites",
    title: { ja: id, en: "" },
    caption: { ja: "", en: "" },
    href: null,
    links: [],
    tags,
    order: 0,
    coverUrl: null,
    ready: true,
    createdAt: null,
});

describe("readSelectedTags", () => {
    test("1つでも配列でも読み、前後の空白を外す", () => {
        assert.deepEqual(readSelectedTags(" Next.js "), ["Next.js"]);
        assert.deepEqual(readSelectedTags(["Next.js", "Firebase"]), ["Next.js", "Firebase"]);
        assert.deepEqual(readSelectedTags(undefined), []);
    });

    test("空・31文字以上・見えない文字を含むものは捨てる", () => {
        assert.deepEqual(readSelectedTags(["", "  ", "a".repeat(31), "a".repeat(30)]), ["a".repeat(30)]);
        assert.deepEqual(readSelectedTags(["abc\u202Edef", "a\u200Bb", "a\nb", "ok", "機械学習"]), ["ok", "機械学習"]);
    });

    test("大文字・小文字だけが違う重複は、先のほうを残す", () => {
        assert.deepEqual(readSelectedTags(["Next.js", "next.js", "NEXT.JS"]), ["Next.js"]);
    });

    test("6個目より後ろは読まない", () => {
        assert.deepEqual(readSelectedTags(["a", "b", "c", "d", "e", "f"]), ["a", "b", "c", "d", "e"]);
    });
});

describe("hasAllTags", () => {
    const a = item("a", ["Next.js", "Firebase"]);
    const b = item("b", ["Next.js"]);

    test("選んだタグを全部持つものだけが当たる", () => {
        assert.equal(hasAllTags(a, ["Next.js", "Firebase"]), true);
        assert.equal(hasAllTags(b, ["Next.js", "Firebase"]), false);
        assert.equal(hasAllTags(b, ["Next.js"]), true);
    });

    test("大文字・小文字は区別しない", () => {
        assert.equal(hasAllTags(a, ["next.js", "FIREBASE"]), true);
    });
});

describe("countTags", () => {
    test("作品の多い順、同じ数なら名前順に並べる", () => {
        const items = [item("a", ["Python", "Next.js"]), item("b", ["Next.js", "Go"]), item("c", ["Next.js"])];
        assert.deepEqual(countTags(items), [
            { tag: "Next.js", count: 3 },
            { tag: "Go", count: 1 },
            { tag: "Python", count: 1 },
        ]);
    });

    test("書き方の揺れは1つにまとめ、作品の多いほうの書き方で出す", () => {
        const items = [item("a", ["nextjs"]), item("b", ["NextJS"]), item("c", ["NextJS"])];
        assert.deepEqual(countTags(items), [{ tag: "NextJS", count: 3 }]);
    });

    test("1つの作品に同じタグが2回あっても1件と数える", () => {
        assert.deepEqual(countTags([item("a", ["Go", "go"])]), [{ tag: "Go", count: 1 }]);
    });
});

describe("tagsHref と toggleTagHref", () => {
    test("記号の入ったタグもエンコードする", () => {
        assert.equal(tagsHref(["C#", "a&b", "1+1", "50%"], null, "ja"), "/portfolio?tag=C%23&tag=a%26b&tag=1%2B1&tag=50%25");
    });

    test("開いていたタブを残し、タグが無くなったらそのタブに戻る", () => {
        assert.equal(tagsHref(["Go"], "games", "ja"), "/portfolio?tab=games&tag=Go");
        assert.equal(tagsHref([], "games", "ja"), "/portfolio?tab=games");
        assert.equal(tagsHref([], null, "ja"), "/portfolio");
    });

    test("英語のページでは /en を付ける", () => {
        assert.equal(tagsHref(["Go"], null, "en"), "/en/portfolio?tag=Go");
    });

    test("選んでいないタグは足し、選んでいるタグは（大文字・小文字が違っても）外す", () => {
        assert.equal(toggleTagHref(["Go"], "Rust", null, "ja"), "/portfolio?tag=Go&tag=Rust");
        assert.equal(toggleTagHref(["Go", "Rust"], "go", null, "ja"), "/portfolio?tag=Rust");
    });
});

describe("fill", () => {
    test("差し込んだ値の中の {n} や $& はそのまま出る", () => {
        assert.equal(fill("{tags}：{n} 件", { tags: "{n}$&$'", n: 0 }), "{n}$&$'：0 件");
    });

    test("vars に無い名前は残す", () => {
        assert.equal(fill("{a}{b}", { a: 1 }), "1{b}");
    });
});
