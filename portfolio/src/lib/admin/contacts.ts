// src/lib/admin/contacts.ts

import { getAdminDb } from "@/lib/firebase/admin";
import { ContactMessage, collections } from "@/lib/content/types";

/**
 * 問い合わせの読み出し（サーバー専用）。
 *
 * contacts はセキュリティルールでクライアントから完全に閉じているため、
 * 必ず Admin SDK 経由でここから読む。
 */

/** Firestore の Timestamp を ISO 文字列にする。クライアントに渡すため直列化が必要 */
const toIso = (value: unknown): string => {
    if (value && typeof value === "object" && "toDate" in value) {
        try {
            return (value as { toDate: () => Date }).toDate().toISOString();
        } catch {
            return "";
        }
    }
    return "";
};

export const listContacts = async (max = 100): Promise<ContactMessage[]> => {
    const db = getAdminDb();
    if (!db) return [];

    try {
        const snap = await db
            .collection(collections.contacts)
            .orderBy("createdAt", "desc")
            .limit(max)
            .get();

        return snap.docs.map((doc) => {
            const d = doc.data();
            return {
                id: doc.id,
                name: typeof d.name === "string" ? d.name : "",
                email: typeof d.email === "string" ? d.email : "",
                message: typeof d.message === "string" ? d.message : "",
                createdAt: toIso(d.createdAt),
                read: d.read === true,
            };
        });
    } catch (err) {
        console.error("[admin] 問い合わせの読み出しに失敗しました:", err);
        return [];
    }
};

export const countUnreadContacts = async (): Promise<number> => {
    const db = getAdminDb();
    if (!db) return 0;

    try {
        const snap = await db
            .collection(collections.contacts)
            .where("read", "==", false)
            .count()
            .get();
        return snap.data().count;
    } catch (err) {
        console.error("[admin] 未読件数の取得に失敗しました:", err);
        return 0;
    }
};
