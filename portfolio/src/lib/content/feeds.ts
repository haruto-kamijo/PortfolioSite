// src/lib/content/feeds.ts

import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { blogFeeds } from "@/lib/site";
import { PORTFOLIO_LIMITS } from "./portfolioItem";
import type { PortfolioItem } from "./types";

/**
 * Zenn・note の RSS から、ブログのタブに並べる記事を作る（サーバー専用）。
 *
 * 記事を出すたびに登録しなくても載るようにするためのもの。
 * RSS は1時間ごとに読み直す。読めなかった RSS は飛ばし、ほかの記事だけで表示する
 * （失敗した結果はキャッシュしないので、次のリクエストで読み直す）。
 */

const REVALIDATE_SECONDS = 60 * 60;
const FETCH_TIMEOUT_MS = 4000;
/** 1つの RSS から載せる記事の数 */
const MAX_ITEMS_PER_FEED = 20;

type Feed = (typeof blogFeeds)[number];

type FeedEntry = { title: string; description: string; link: string; publishedAt: string | null; imageUrl: string | null };

const decodeEntities = (s: string) =>
    s
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, "&");

/** 要素の中身。CDATA を外し、HTML のタグを取り除いた文字列にする */
const textOf = (xml: string, tag: string) => {
    const m = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`));
    if (!m) return "";
    const raw = m[1].replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1");
    // 段落や改行のタグは空白に、<b> などの文中のタグは何も入れずに外す（日本語の文の途中に空白が入らないように）
    const plain = raw.replace(/<\/?(?:p|br|div|li|h[1-6])\b[^>]*>/gi, " ").replace(/<[^>]*>/g, "");
    return decodeEntities(plain)
        .replace(/\s+/g, " ")
        .trim();
};

const attrOf = (xml: string, tag: string, attr: string) => {
    const m = xml.match(new RegExp(`<${tag}\\s[^>]*${attr}="([^"]*)"`));
    return m ? decodeEntities(m[1]) : "";
};

/** http(s) の URL だけを通す。host を渡したときは、そのドメインかサブドメインのものだけ */
const safeUrl = (value: string, host?: string) => {
    try {
        const url = new URL(value);
        if (url.protocol !== "https:" && url.protocol !== "http:") return null;
        if (host && url.hostname !== host && !url.hostname.endsWith(`.${host}`)) return null;
        return url.href;
    } catch {
        return null;
    }
};

export const parseFeed = (xml: string, host: string): FeedEntry[] =>
    Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g))
        .map(([, item]) => {
            const link = safeUrl(textOf(item, "link"), host);
            const date = new Date(textOf(item, "pubDate"));
            // Zenn は enclosure、note は media:thumbnail にアイキャッチ画像がある
            const image = attrOf(item, "enclosure", "url") || textOf(item, "media:thumbnail");
            return {
                title: textOf(item, "title"),
                description: textOf(item, "description"),
                link,
                publishedAt: Number.isNaN(date.getTime()) ? null : date.toISOString(),
                imageUrl: image ? safeUrl(image) : null,
            };
        })
        .filter((e): e is FeedEntry => !!e.title && !!e.link)
        .slice(0, MAX_ITEMS_PER_FEED);

const fetchFeed = (feed: Feed) =>
    unstable_cache(
        async () => {
            const res = await fetch(feed.url, { cache: "no-store", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return parseFeed(await res.text(), feed.host);
        },
        ["blog-feed", feed.url],
        { revalidate: REVALIDATE_SECONDS }
    )();

const truncate = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

/** 同じ記事かどうかを比べるための形（クエリ・末尾の / を外す） */
export const articleKey = (href: string) => {
    try {
        const url = new URL(href);
        return `${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/\/+$/, "")}`;
    } catch {
        return href;
    }
};

/**
 * RSS の記事を、ブログのタブのカードにして新しい順に返す。
 * registered（公開中の作品）のリンク先と同じ記事は除く。PoC のカードに付けた検証記事が二重に並ばないようにするため
 */
export const getFeedItems = async (registered: PortfolioItem[]): Promise<PortfolioItem[]> => {
    const known = new Set(
        registered.flatMap((item) => [item.href, ...item.links.map((l) => l.href)]).filter(Boolean).map((h) => articleKey(h!))
    );

    const results = await Promise.allSettled(blogFeeds.map(async (feed) => ({ feed, entries: await fetchFeed(feed) })));

    const items: PortfolioItem[] = [];
    for (const r of results) {
        if (r.status === "rejected") {
            console.warn("[content] RSS を読めなかったため飛ばします:", r.reason);
            continue;
        }
        for (const e of r.value.entries) {
            if (known.has(articleKey(e.link))) continue;
            known.add(articleKey(e.link));
            items.push({
                id: `feed-${createHash("sha1").update(e.link).digest("hex").slice(0, 16)}`,
                category: "blog",
                title: { ja: truncate(e.title, PORTFOLIO_LIMITS.title), en: "" },
                caption: { ja: truncate(e.description, 120), en: "" },
                href: e.link,
                links: [],
                tags: [r.value.feed.name],
                order: 0,
                coverUrl: e.imageUrl,
                ready: true,
                createdAt: e.publishedAt,
            });
        }
    }

    return items.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
};
