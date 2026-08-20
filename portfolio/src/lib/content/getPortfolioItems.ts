// src/lib/content/getPortfolioItems.ts

import { getAdminDb } from "@/lib/firebase/admin";
import { PORTFOLIO_CATEGORIES, PortfolioCategory, PortfolioItem, collections } from "./types";

/**
 * /portfolio ページに出す作品を取得する（サーバー専用・公開向け）。
 *
 * Firestore が未設定・接続不可・空のときは空配列を返す。
 * home の WORKS カードと違い「既定の作品」という概念は無い
 * （旧サイトの実データはユーザー自身に管理画面から登録してもらう方針のため）。
 *
 * カテゴリ内の並び順だけを見ればよいので、単一フィールドの orderBy にとどめ、
 * カテゴリへの振り分けは取得後にコード側で行う（複合インデックスの追加デプロイを避けるため）。
 */
export const getPortfolioItems = async (): Promise<Record<PortfolioCategory, PortfolioItem[]>> => {
    const empty = Object.fromEntries(
        PORTFOLIO_CATEGORIES.map((c) => [c, [] as PortfolioItem[]])
    ) as Record<PortfolioCategory, PortfolioItem[]>;

    const db = getAdminDb();
    if (!db) return empty;

    try {
        const snap = await db.collection(collections.portfolioItems).orderBy("order").get();

        const grouped = empty;
        for (const doc of snap.docs) {
            const d = doc.data();
            const category = d.category as PortfolioCategory;
            if (!PORTFOLIO_CATEGORIES.includes(category)) continue;
            if (d.ready !== true) continue; // 公開ページでは非公開の作品を出さない

            grouped[category].push({
                id: doc.id,
                category,
                title: typeof d.title === "string" ? d.title : "",
                caption: typeof d.caption === "string" ? d.caption : "",
                href: typeof d.href === "string" && d.href ? d.href : null,
                order: typeof d.order === "number" ? d.order : 0,
                coverUrl: typeof d.coverUrl === "string" && d.coverUrl ? d.coverUrl : null,
                ready: true,
            });
        }

        return grouped;
    } catch (err) {
        console.warn("[content] 作品一覧を読めなかったため空で表示します:", err);
        return empty;
    }
};
