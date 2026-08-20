// src/lib/firebase/admin.ts

import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import { Firestore, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

/**
 * サーバー専用の Firebase Admin。
 *
 * 公開ページのコンテンツ取得、問い合わせの保存、管理画面のセッション検証に使う。
 * Admin SDK はセキュリティルールを迂回するため、必ずサーバー側だけで使う。
 *
 * 認証情報の解決:
 *  - Cloud Run（Firebase Hosting の frameworksBackend）上では既定のサービスアカウントが自動で使われる
 *  - ローカルでエミュレータを使う場合は認証情報が不要
 *  - ローカルから本番に繋ぐ場合のみ GOOGLE_APPLICATION_CREDENTIALS を指定する
 *
 * 認証情報が無い環境（開発マシンでの静的ビルドなど）では null を返し、
 * 呼び出し側が静的な既定値にフォールバックできるようにしている。
 */

const projectId =
    process.env.FIREBASE_PROJECT_ID ??
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";

const assertServer = () => {
    if (typeof window !== "undefined") {
        throw new Error("firebase/admin はサーバー側でのみ使用できます");
    }
};

let cachedApp: App | null | undefined;

const getAdminApp = (): App | null => {
    assertServer();
    if (cachedApp !== undefined) return cachedApp;

    try {
        if (getApps().length > 0) {
            cachedApp = getApps()[0];
            return cachedApp;
        }
        if (!projectId) {
            cachedApp = null;
            return cachedApp;
        }

        if (useEmulator) {
            // Admin SDK はこれらの環境変数を見てエミュレータに繋ぐ
            process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
            process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
            process.env.FIREBASE_STORAGE_EMULATOR_HOST ??= "127.0.0.1:9199";
            cachedApp = initializeApp({ projectId });
            return cachedApp;
        }

        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        cachedApp = serviceAccountJson
            ? initializeApp({ credential: cert(JSON.parse(serviceAccountJson)), projectId })
            : initializeApp({ projectId }); // 既定の認証情報（Cloud Run など）

        return cachedApp;
    } catch (err) {
        console.warn("[firebase/admin] 初期化に失敗しました:", err);
        cachedApp = null;
        return cachedApp;
    }
};

/** 使えないときは null。呼び出し側で必ず null チェックする */
export const getAdminDb = (): Firestore | null => {
    const app = getAdminApp();
    if (!app) return null;

    try {
        return getFirestore(app);
    } catch (err) {
        console.warn("[firebase/admin] Firestore を取得できませんでした:", err);
        return null;
    }
};

/** 管理画面のセッション検証に使う。使えないときは null */
export const getAdminAuth = (): Auth | null => {
    const app = getAdminApp();
    if (!app) return null;

    try {
        return getAuth(app);
    } catch (err) {
        console.warn("[firebase/admin] Auth を取得できませんでした:", err);
        return null;
    }
};

/**
 * 作品のカバー画像を置く Storage バケット。
 *
 * initializeApp({ projectId }) だけでは既定バケット名が古い命名規則
 * (`${projectId}.appspot.com`) になり、実際のバケット
 * (`${projectId}.firebasestorage.app`) と一致しないため、明示的に名前を渡す。
 */
export const getAdminBucket = (): ReturnType<ReturnType<typeof getStorage>["bucket"]> | null => {
    const app = getAdminApp();
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!app || !bucketName) return null;

    try {
        return getStorage(app).bucket(bucketName);
    } catch (err) {
        console.warn("[firebase/admin] Storage を取得できませんでした:", err);
        return null;
    }
};
