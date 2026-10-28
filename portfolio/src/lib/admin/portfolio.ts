// src/lib/admin/portfolio.ts

import { getAdminDb } from "@/lib/firebase/admin";
import { readPortfolioItem } from "@/lib/content/portfolioItem";
import { PORTFOLIO_CATEGORIES, PortfolioCategory, PortfolioItem, collections } from "@/lib/content/types";

/**
 * 作品(portfolioItems)の読み出し（管理画面・サーバー専用）。
 * 非公開(ready:false)のものも含めて全件返す。カテゴリごとの配列にまとめて返す。
 */
export const listPortfolioItemsAdmin = async (): Promise<
    Record<PortfolioCategory, PortfolioItem[]>
> => {
    const grouped = Object.fromEntries(
        PORTFOLIO_CATEGORIES.map((c) => [c, [] as PortfolioItem[]])
    ) as Record<PortfolioCategory, PortfolioItem[]>;

    const db = getAdminDb();
    if (!db) return grouped;

    try {
        const snap = await db.collection(collections.portfolioItems).orderBy("order").get();

        for (const doc of snap.docs) {
            const item = readPortfolioItem(doc.id, doc.data());
            if (item) grouped[item.category].push(item);
        }

        return grouped;
    } catch (err) {
        console.error("[admin] 作品一覧の読み出しに失敗しました:", err);
        return grouped;
    }
};
