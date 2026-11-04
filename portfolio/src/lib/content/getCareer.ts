// src/lib/content/getCareer.ts

import { readFileSync } from "node:fs";
import { getAdminDb } from "@/lib/firebase/admin";
import { CAREER_COLLECTION, CAREER_DOC_ID, CareerItem, parseCareerFile, readCareerDoc, sortCareer } from "./career";

/**
 * Firestore に繋がっていないときに、代わりに読む登録ファイル（E2E テスト用）。
 * テストでは scripts/career.example.json を指定して、年表の表示を確かめる（e2e.yml・playwright.config.ts）。
 * 本番は Firestore に繋がっているので、指定されていても使わない
 */
const readExampleFile = (): CareerItem[] => {
    const path = process.env.CAREER_EXAMPLE_FILE;
    if (!path) return [];
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
 * Firestore に繋がらない・まだ登録していないときは空にし、ページは「準備中」を出す
 */
export const getCareer = async (): Promise<CareerItem[]> => {
    const db = getAdminDb();
    if (!db) return readExampleFile();

    try {
        const snap = await db.collection(CAREER_COLLECTION).doc(CAREER_DOC_ID).get();
        return snap.exists ? sortCareer(readCareerDoc(snap.data())) : [];
    } catch (err) {
        console.warn("[content] 経歴を読めませんでした:", err);
        return [];
    }
};
