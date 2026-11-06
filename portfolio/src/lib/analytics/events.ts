// src/lib/analytics/events.ts

import { CATALOG_CONCEPT_IDS } from "@/lib/catalog/concepts";
import { CATALOG_PART_IDS } from "@/lib/catalog/parts";
import { CATALOG_WIDTHS } from "@/lib/catalog/widths";

/**
 * 自前で数える操作（クライアントとサーバーの両方で使う決まり）。
 *
 * ページの閲覧数は Cloudflare Web Analytics で数え、ここでは Cloudflare で数えられない操作だけを数える。
 * 記録するのは「日付・種類・対象ごとの回数」だけで、誰が押したかは残さない（Cookie も使わない）。
 * 問い合わせの送信は、保存した問い合わせ（contacts）を数えれば分かるので、ここでは数えない
 */

/** 回数を入れるコレクション。ドキュメントは日本時間の日付ごと（2026-11-05） */
export const ANALYTICS_COLLECTION = "analytics";

/**
 * external: サイトの外へのリンク（対象はリンク先の URL。# 以降は除く）
 * tag: /portfolio のタグで絞り込んだ（対象は選んだタグ）
 * catalog: デザインカタログの操作（対象は catalogKey の形）
 */
export const EVENT_TYPES = ["external", "tag", "catalog"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export type AnalyticsEvent = { type: EventType; key: string };

/** 対象の長さの上限。URL がこれより長いリンクは数えない */
export const MAX_EVENT_KEY = 300;

/**
 * 外へのリンクの URL を、数えるときの形にする。https で、このサイトの外を指すものだけ。
 * ? 以降は残す（youtube.com/watch?v= のように、? の後ろでページが決まるリンクがあるため）。# 以降はページの中の位置なので除く
 */
export const externalKey = (href: string, siteHost: string): string | null => {
    let url: URL;
    try {
        url = new URL(href);
    } catch {
        return null;
    }
    if (url.protocol !== "https:" || url.hostname === siteHost) return null;
    // 末尾の / は付けても付けなくても同じページなので、そろえる
    const key = `${url.origin}${url.pathname.replace(/\/+$/, "")}${url.search}`;
    return key.length > MAX_EVENT_KEY ? null : key;
};

/**
 * カタログの操作の対象。
 * width:<見本>:<幅>（幅の切り替え）・parts:<見本>（パーツの名前を見るモードにした）・copy:<パーツ>（図鑑でコードをコピーした）
 */
export const catalogKey = {
    width: (concept: string, width: string) => `width:${concept}:${width}`,
    parts: (concept: string) => `parts:${concept}`,
    copy: (part: string) => `copy:${part}`,
};

const includes = (list: readonly string[], value: string | undefined) => value !== undefined && list.includes(value);

/** カタログの操作の対象が、実際にある見本・幅・パーツを指しているか */
export const isCatalogKey = (key: string) => {
    const [action, a, b, ...rest] = key.split(":");
    if (rest.length > 0) return false;
    if (action === "width") return includes(CATALOG_CONCEPT_IDS, a) && includes(CATALOG_WIDTHS, b);
    if (action === "parts") return includes(CATALOG_CONCEPT_IDS, a) && b === undefined;
    if (action === "copy") return includes(CATALOG_PART_IDS, a) && b === undefined;
    return false;
};

/** 送られてきた本文を読む。形が違えば null */
export const parseEvent = (body: unknown): AnalyticsEvent | null => {
    if (typeof body !== "object" || body === null) return null;
    const { type, key } = body as Record<string, unknown>;
    if (typeof type !== "string" || !includes(EVENT_TYPES, type)) return null;
    if (typeof key !== "string" || !key || key.length > MAX_EVENT_KEY) return null;
    return { type: type as EventType, key };
};

/** 日本時間の日付（2026-11-05）。ドキュメントの id にする */
export const dayInTokyo = (now: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);

/** 本文の大きさの上限（バイト）。これより大きいものは読まずに捨てる */
export const MAX_EVENT_BODY = 1024;

/**
 * サイトのページから送られたものか。ほかのサイトのページに送らせないためのもの（curl などでは偽れるので、悪用の対策ではない）。
 * Sec-Fetch-Site を送らない古いブラウザでは、Origin（無ければ Referer）で確かめる
 */
export const isSameOriginRequest = (
    headers: { secFetchSite: string | null; origin: string | null; referer: string | null },
    siteOrigins: readonly string[]
) => {
    if (headers.secFetchSite) return headers.secFetchSite === "same-origin";
    const from = headers.origin ?? headers.referer;
    if (!from) return false;
    try {
        return siteOrigins.includes(new URL(from).origin);
    } catch {
        return false;
    }
};

/** 検索エンジンなどのボットと、自動で動かしているブラウザ。数えない */
export const isBotUserAgent = (ua: string) => !ua || /bot|crawl|spider|slurp|headless|lighthouse|preview/i.test(ua);
