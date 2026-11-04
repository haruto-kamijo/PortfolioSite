// src/lib/content/getClaudeUsage.ts

import { getAdminDb } from "@/lib/firebase/admin";
import { CLAUDE_USAGE_COLLECTION, CLAUDE_USAGE_DOC_ID, ClaudeUsage, parseClaudeUsage } from "./claudeUsage";
import { isBuildPhase } from "./isBuildPhase";

/**
 * About ページの利用状況タイルのデータを読む（サーバー専用）。
 * Firestore に繋がらない・まだ登録していない・形が崩れているときは null を返し、タイルを出さない。
 *
 * 読み込みに失敗したときは、ビルドのときだけ null にし、それ以外は例外を投げる。
 * /about は ISR なので、作り直しに失敗すると Next.js が直前に作れたページを出し続ける
 * （一時的に読めなかっただけで、5 分間タイルが消えないように）
 */
export const getClaudeUsage = async (): Promise<ClaudeUsage | null> => {
    const db = getAdminDb();
    if (!db) return null;

    try {
        const snap = await db.collection(CLAUDE_USAGE_COLLECTION).doc(CLAUDE_USAGE_DOC_ID).get();
        if (!snap.exists) return null;
        const usage = parseClaudeUsage(snap.data());
        if (!usage) console.warn("[content] stats/claudeUsage の形が想定と違うため表示しません");
        return usage;
    } catch (err) {
        if (isBuildPhase()) {
            console.warn("[content] Claude の利用状況を読めなかったため、タイルを出さずにビルドします:", err);
            return null;
        }
        throw err;
    }
};
