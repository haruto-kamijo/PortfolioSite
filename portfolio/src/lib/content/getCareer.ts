// src/lib/content/getCareer.ts

import { readFileSync } from "node:fs";
import { getAdminDb } from "@/lib/firebase/admin";
import { CAREER_COLLECTION, CAREER_DOC_ID, CareerItem, parseCareerFile, readCareerDoc, sortCareer } from "./career";
import { isBuildPhase } from "./isBuildPhase";

/**
 * Firestore に繋がっていないときに、代わりに読む登録ファイル（E2E テスト用）。
 * テストでは scripts/career.example.json を指定して、年表の表示を確かめる（e2e.yml・playwright.config.ts）。
 * Firebase のプロジェクトが設定されている環境（本番や、.env.local のある手元）では、指定されていても読まない
 * （残っていた環境変数で、例の経歴が公開ページに出ないように）
 */
const readExampleFile = (): CareerItem[] => {
    const path = process.env.CAREER_EXAMPLE_FILE;
    const hasProject = !!(process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
    if (!path || hasProject) return [];
    try {
        const { items, errors } = parseCareerFile(JSON.parse(readFileSync(path, "utf-8")));
        if (errors.length > 0) console.warn("[content] CAREER_EXAMPLE_FILE の形が違います:", errors);
        return sortCareer(items);
    } catch (err) {
        console.warn("[content] CAREER_EXAMPLE_FILE を読めませんでした:", err);
        return [];
    }
};

/**
 * 経歴のページ（/career）に出す項目を読む（サーバー専用）。新しい順に並べて返す。
 * Firestore に繋がらない・まだ登録していないときは空にし、ページは「準備中」を出す。
 *
 * 読み込みに失敗したときは、ビルドのときだけ空にし、それ以外は例外を投げる。
 * ページは ISR なので、作り直しに失敗すると Next.js が直前に作れたページを出し続ける
 * （一時的に読めなかっただけで、5 分間「準備中」にならないように）
 */
export const getCareer = async (): Promise<CareerItem[]> => {
    const db = getAdminDb();
    if (!db) return readExampleFile();

    try {
        const snap = await db.collection(CAREER_COLLECTION).doc(CAREER_DOC_ID).get();
        if (!snap.exists) return [];
        const { items, unreadable } = readCareerDoc(snap.data());
        if (unreadable.length > 0) console.warn("[content] 経歴に形の崩れた項目があるため飛ばします:", unreadable);
        return sortCareer(items);
    } catch (err) {
        if (isBuildPhase()) {
            console.warn("[content] 経歴を読めなかったため、空でビルドします:", err);
            return [];
        }
        throw err;
    }
};
