// src/lib/rateLimit.ts

import type { NextRequest } from "next/server";

/**
 * 簡易レート制限。
 * Cloud Run のインスタンスごとのメモリなので厳密ではないが、
 * 素朴な連投を止める速度制限としては十分。厳密な制御が必要になったら Firestore に移す。
 * windowMs のあいだに max 回を超えたら true を返す
 */
export const createRateLimiter = (windowMs: number, max: number) => {
    const recentHits = new Map<string, number[]>();

    return (key: string, now: number) => {
        const hits = (recentHits.get(key) ?? []).filter((t) => now - t < windowMs);
        hits.push(now);
        recentHits.set(key, hits);

        // 際限なく増えないように、古いキーを掃除する
        if (recentHits.size > 500) {
            recentHits.forEach((times, k) => {
                if (times.every((t) => now - t >= windowMs)) recentHits.delete(k);
            });
        }

        return hits.length > max;
    };
};

export const clientIp = (req: NextRequest) =>
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
