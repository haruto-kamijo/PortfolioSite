// src/lib/admin/works.ts

import { getAdminDb } from "@/lib/firebase/admin";
import { WorkContent, collections } from "@/lib/content/types";

/**
 * 作品の読み出し（管理画面・サーバー専用）。
 *
 * getSiteContent() と違い、既定値へのフォールバックはしない。
 * 空なら空のまま返し、「まだ作品がありません」と管理画面に表示させるため。
 */
export const listWorksAdmin = async (): Promise<WorkContent[]> => {
    const db = getAdminDb();
    if (!db) return [];

    try {
        const snap = await db.collection(collections.works).orderBy("order").get();

        return snap.docs.map((doc, index) => {
            const d = doc.data();
            return {
                id: doc.id,
                title: typeof d.title === "string" ? d.title : "",
                caption: typeof d.caption === "string" ? d.caption : "",
                href: typeof d.href === "string" ? d.href : "",
                external: d.external === true,
                ready: d.ready === true,
                order: typeof d.order === "number" ? d.order : index,
                coverUrl: typeof d.coverUrl === "string" && d.coverUrl ? d.coverUrl : null,
            };
        });
    } catch (err) {
        console.error("[admin] 作品の読み出しに失敗しました:", err);
        return [];
    }
};
