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
 */
export const createRateLimiter = (windowMs: number, max: number) => {
    const recentHits = new Map<string, number[]>();
    let lastSweep = 0;

    return (key: string, now: number) => {
        const hits = (recentHits.get(key) ?? []).filter((t) => now - t < windowMs);
        hits.push(now);
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
