// src/app/api/events/route.ts

import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import {
    ANALYTICS_COLLECTION,
    MAX_EVENT_BODY,
    dayInTokyo,
    isBotUserAgent,
    isCatalogKey,
    isSameOriginRequest,
    parseEvent,
} from "@/lib/analytics/events";
import { getKnownTargets } from "@/lib/analytics/known";
import { tagKey } from "@/lib/content/tags";
import { getAdminDb } from "@/lib/firebase/admin";
import { clientIp, createRateLimiter } from "@/lib/rateLimit";
import { site } from "@/lib/site";

/**
 * 操作の回数の受け口（src/lib/analytics/events.ts）。
 * サイトのページから navigator.sendBeacon で送られてきたものを、日付・種類・対象ごとに 1 足す。
 *
 * 誰でも送れるので、次のものは数えない。数えなかったことは送り手に知らせなくてよいので、どれも 204 を返す
 *  - ほかのサイトのページから送られたもの（isSameOriginRequest）
 *  - ボット・自動で動かしているブラウザ
 *  - 同じところから続けて送られたもの（1 分に 30 回まで）
 *  - インスタンス全体で 1 分に 300 回を超えた分（IP は偽れるので、書き込みの回数と費用に上限を付ける）
 *  - サイトに出ていないリンク・タグ、ないカタログの見本・パーツ
 * 本文が大きすぎるものと、形の違うものは 400 を返す
 */

const isRateLimited = createRateLimiter(60_000, 30);
const isOverall = createRateLimiter(60_000, 300);

const siteOrigin = new URL(site.url).origin;

const accepted = () => new NextResponse(null, { status: 204 });
const rejected = () => NextResponse.json({ ok: false }, { status: 400 });

/**
 * 本文を max バイトまで読む。超えたらその時点で読むのをやめて null。
 * Content-Length は送り手が申告する値で、省略もできる（chunked）ので、実際に読んだバイト数で数える
 */
const readLimited = async (req: NextRequest, max: number): Promise<string | null> => {
    const reader = req.body?.getReader();
    if (!reader) return "";
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > max) {
            await reader.cancel();
            return null;
        }
        chunks.push(value);
    }
    return Buffer.concat(chunks).toString("utf8");
};

const isKnown = async (type: string, key: string) => {
    if (type === "catalog") return isCatalogKey(key);
    const known = await getKnownTargets();
    return type === "external" ? known.external.has(key) : known.tags.has(tagKey(key));
};

export async function POST(req: NextRequest) {
    const headers = req.headers;
    const sameOrigin = isSameOriginRequest(
        { secFetchSite: headers.get("sec-fetch-site"), origin: headers.get("origin"), referer: headers.get("referer") },
        // 手元で動かしたとき（localhost）は、そのサーバーのページから送られたものも同じところとみなす
        [siteOrigin, req.nextUrl.origin]
    );
    if (!sameOrigin || isBotUserAgent(headers.get("user-agent") ?? "")) return accepted();

    // 大きな本文を読み込んで解析しないよう、長さを確かめてから読む
    if (Number(headers.get("content-length") ?? 0) > MAX_EVENT_BODY) return rejected();
    const text = await readLimited(req, MAX_EVENT_BODY);
    if (text === null) return rejected();
    let body: unknown;
    try {
        body = JSON.parse(text);
    } catch {
        return rejected();
    }
    const event = parseEvent(body);
    if (!event) return rejected();

    const now = Date.now();
    if (isRateLimited(clientIp(req), now)) return accepted();

    const db = getAdminDb();
    if (!db) return accepted();

    try {
        if (!(await isKnown(event.type, event.key)) || isOverall("all", now)) return accepted();
        const key = event.type === "tag" ? tagKey(event.key) : event.key;
        // 対象（URL など）には . や / が入るので、update のフィールドパスにせず、入れ子のオブジェクトで書く
        await db
            .collection(ANALYTICS_COLLECTION)
            .doc(dayInTokyo(new Date(now)))
            .set({ [event.type]: { [key]: FieldValue.increment(1) } }, { merge: true });
    } catch (err) {
        console.warn("[events] 回数を記録できませんでした:", err);
    }
    return accepted();
}
