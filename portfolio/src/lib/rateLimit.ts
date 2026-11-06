// src/lib/rateLimit.ts

import type { NextRequest } from "next/server";

/** 覚えておくキーの数の上限 */
const MAX_KEYS = 5000;

/**
 * 簡易レート制限。
 * Cloud Run のインスタンスごとのメモリなので厳密ではないが、
 * 素朴な連投を止める速度制限としては十分。厳密な制御が必要になったら Firestore に移す。
 * windowMs のあいだに max 回を超えたら true を返す。
 *
 * 偽った IP を大量に送られても、メモリと掃除の手間が増え続けないようにしている。
 * 掃除は 1 秒に 1 回までにし、掃除しても MAX_KEYS を超えていたら全部忘れる（そのあいだ制限が緩むだけで済む）
 *
 * countRejected: 断った分も数えるか。送り手ごとの制限では数え（送り続けるあいだ断り続ける）、
 * 全員で分け合う全体の上限では数えない（断った分で枠が埋まり、普通の人まで長く断らないように）
 */
export const createRateLimiter = (windowMs: number, max: number, { countRejected = true } = {}) => {
    const recentHits = new Map<string, number[]>();
    let lastSweep = 0;

    return (key: string, now: number) => {
        const hits = (recentHits.get(key) ?? []).filter((t) => now - t < windowMs);
        if (!countRejected && hits.length >= max) {
            recentHits.set(key, hits);
            return true;
        }
        hits.push(now);
        // 判定には直近の max + 1 回があれば足りる。断った分も数え続けるので、それより古いものは捨てる
        if (hits.length > max + 1) hits.shift();
        recentHits.set(key, hits);

        // 際限なく増えないように、古いキーを掃除する
        if (recentHits.size > 500 && now - lastSweep >= 1000) {
            lastSweep = now;
            recentHits.forEach((times, k) => {
                if (times.every((t) => now - t >= windowMs)) recentHits.delete(k);
            });
            if (recentHits.size > MAX_KEYS) recentHits.clear();
        }

        return hits.length > max;
    };
};

export const clientIp = (req: NextRequest) =>
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
