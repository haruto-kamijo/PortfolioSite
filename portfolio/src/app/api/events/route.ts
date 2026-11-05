// src/app/api/events/route.ts

import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { ANALYTICS_COLLECTION, dayInTokyo, isBotUserAgent, isCatalogKey, parseEvent } from "@/lib/analytics/events";
import { getKnownTargets } from "@/lib/analytics/known";
import { tagKey } from "@/lib/content/tags";
import { getAdminDb } from "@/lib/firebase/admin";
import { clientIp, createRateLimiter } from "@/lib/rateLimit";

/**
 * 操作の回数の受け口（src/lib/analytics/events.ts）。
 * サイトのページから navigator.sendBeacon で送られてきたものを、日付・種類・対象ごとに 1 足す。
 *
 * 誰でも送れるので、次のものは数えない。数えなかったことは送り手に知らせなくてよいので、どれも 204 を返す
 *  - ほかのサイトのページから送られたもの（Sec-Fetch-Site が same-origin でない）
 *  - ボット・自動で動かしているブラウザ
 *  - 同じところから続けて送られたもの（1 分に 30 回まで）
 *  - サイトに出ていないリンク・タグ、ないカタログの見本・パーツ
 */

const isRateLimited = createRateLimiter(60_000, 30);

const accepted = () => new NextResponse(null, { status: 204 });

const isKnown = async (type: string, key: string) => {
    if (type === "catalog") return isCatalogKey(key);
    const known = await getKnownTargets();
    return type === "external" ? known.external.has(key) : known.tags.has(tagKey(key));
};

export async function POST(req: NextRequest) {
    if (req.headers.get("sec-fetch-site") !== "same-origin") return accepted();
    if (isBotUserAgent(req.headers.get("user-agent") ?? "")) return accepted();

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ ok: false }, { status: 400 });
    }
    const event = parseEvent(body);
    if (!event) return NextResponse.json({ ok: false }, { status: 400 });

    if (isRateLimited(clientIp(req), Date.now())) return accepted();

    const db = getAdminDb();
    if (!db) return accepted();

    try {
        if (!(await isKnown(event.type, event.key))) return accepted();
        const key = event.type === "tag" ? tagKey(event.key) : event.key;
        // 対象（URL など）には . や / が入るので、update のフィールドパスにせず、入れ子のオブジェクトで書く
        await db
            .collection(ANALYTICS_COLLECTION)
            .doc(dayInTokyo(new Date()))
            .set({ [event.type]: { [key]: FieldValue.increment(1) } }, { merge: true });
    } catch (err) {
        console.warn("[events] 回数を記録できませんでした:", err);
    }
    return accepted();
}
