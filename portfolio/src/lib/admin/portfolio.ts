// src/lib/admin/portfolio.ts

import { getAdminDb } from "@/lib/firebase/admin";
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
            const d = doc.data();
            const category = d.category as PortfolioCategory;
            if (!PORTFOLIO_CATEGORIES.includes(category)) continue;

            grouped[category].push({
                id: doc.id,
                category,
                title: typeof d.title === "string" ? d.title : "",
                caption: typeof d.caption === "string" ? d.caption : "",
                href: typeof d.href === "string" && d.href ? d.href : null,
                order: typeof d.order === "number" ? d.order : 0,
                coverUrl: typeof d.coverUrl === "string" && d.coverUrl ? d.coverUrl : null,
                ready: d.ready === true,
            });
        }

        return grouped;
    } catch (err) {
        console.error("[admin] 作品一覧の読み出しに失敗しました:", err);
        return grouped;
    }
};
