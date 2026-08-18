// src/lib/firebase/admin.ts

import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { Firestore, getFirestore } from "firebase-admin/firestore";

/**
 * サーバー専用の Firebase Admin。
 *
 * 公開ページのコンテンツ取得と問い合わせの保存に使う。
 * Admin SDK はセキュリティルールを迂回するため、必ずサーバー側だけで使う。
 *
 * 認証情報の解決:
 *  - Cloud Run（Firebase Hosting の frameworksBackend）上では既定のサービスアカウントが自動で使われる
 *  - ローカルでエミュレータを使う場合は認証情報が不要
 *  - ローカルから本番Firestoreに繋ぐ場合のみ GOOGLE_APPLICATION_CREDENTIALS を指定する
 *
 * 認証情報が無い環境（開発マシンでの静的ビルドなど）では null を返し、
 * 呼び出し側が静的な既定値にフォールバックできるようにしている。
 */

const projectId =
    process.env.FIREBASE_PROJECT_ID ??
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";

let cached: Firestore | null | undefined;

const initAdminApp = (): App | null => {
    if (getApps().length > 0) return getApps()[0];
    if (!projectId) return null;

    if (useEmulator) {
        // Admin SDK はこの環境変数を見てエミュレータに繋ぐ
        process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
        return initializeApp({ projectId });
    }

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccountJson) {
        return initializeApp({ credential: cert(JSON.parse(serviceAccountJson)), projectId });
    }

    // 既定の認証情報（Cloud Run / GOOGLE_APPLICATION_CREDENTIALS）
    return initializeApp({ projectId });
};

/** 使えないときは null。呼び出し側で必ず null チェックする */
export const getAdminDb = (): Firestore | null => {
    if (typeof window !== "undefined") {
        throw new Error("firebase/admin はサーバー側でのみ使用できます");
    }
    if (cached !== undefined) return cached;

    try {
        const app = initAdminApp();
        cached = app ? getFirestore(app) : null;
    } catch (err) {
        console.warn("[firebase/admin] 初期化に失敗したため既定値で表示します:", err);
        cached = null;
    }

    return cached;
};
