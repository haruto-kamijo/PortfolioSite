// src/lib/admin/analytics.ts

import { FieldPath, Timestamp } from "firebase-admin/firestore";
import { ANALYTICS_COLLECTION, EVENT_TYPES, EventType, dayInTokyo } from "@/lib/analytics/events";
import { collections } from "@/lib/content/types";
import { getAdminDb } from "@/lib/firebase/admin";

/**
 * 管理画面のアクセス解析に出す、操作の回数の集計（サーバー専用）。
 * analytics の日ごとのドキュメントを、選んだ期間の分だけ足し合わせる。
 * 問い合わせの数は、保存した問い合わせ（contacts）をその期間で数える
 */

export const ANALYTICS_PERIODS = [7, 30, 90] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export const isAnalyticsPeriod = (value: unknown): value is AnalyticsPeriod =>
    (ANALYTICS_PERIODS as readonly unknown[]).includes(value);

export type AnalyticsRow = { key: string; count: number };

export type AnalyticsSummary = {
    /** 期間の最初と最後の日（日本時間、両端を含む） */
    from: string;
    to: string;
    counts: Record<EventType, AnalyticsRow[]>;
    contacts: number;
    /** Firestore に繋がらず、読めなかった */
    unavailable: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** 日本時間のその日の 0 時 */
const startOfDayInTokyo = (day: string) => new Date(`${day}T00:00:00+09:00`);

/** 日ごとの回数を足し合わせ、多い順（同じなら名前順）に並べる */
export const sumCounts = (docs: Record<string, unknown>[]): Record<EventType, AnalyticsRow[]> => {
    const totals = Object.fromEntries(EVENT_TYPES.map((t) => [t, new Map<string, number>()])) as Record<EventType, Map<string, number>>;
    for (const doc of docs) {
        for (const type of EVENT_TYPES) {
            const counts = doc[type];
            if (typeof counts !== "object" || counts === null) continue;
            for (const [key, value] of Object.entries(counts)) {
                if (typeof value === "number" && value > 0) totals[type].set(key, (totals[type].get(key) ?? 0) + value);
            }
        }
    }
    const sorted = (m: Map<string, number>) =>
        Array.from(m, ([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
    return Object.fromEntries(EVENT_TYPES.map((t) => [t, sorted(totals[t])])) as Record<EventType, AnalyticsRow[]>;
};

export const getAnalyticsSummary = async (days: AnalyticsPeriod, now = new Date()): Promise<AnalyticsSummary> => {
    const to = dayInTokyo(now);
    const from = dayInTokyo(new Date(startOfDayInTokyo(to).getTime() - (days - 1) * DAY_MS));
    const empty = { from, to, counts: sumCounts([]), contacts: 0 };

    const db = getAdminDb();
    if (!db) return { ...empty, unavailable: true };

    try {
        const [snap, contacts] = await Promise.all([
            db.collection(ANALYTICS_COLLECTION).where(FieldPath.documentId(), ">=", from).get(),
            db
                .collection(collections.contacts)
                .where("createdAt", ">=", Timestamp.fromDate(startOfDayInTokyo(from)))
                .count()
                .get(),
        ]);
        return {
            from,
            to,
            counts: sumCounts(snap.docs.map((d) => d.data())),
            contacts: contacts.data().count,
            unavailable: false,
        };
    } catch (err) {
        console.error("[admin] アクセス解析の集計を読めませんでした:", err);
        return { ...empty, unavailable: true };
    }
};
