// src/lib/firebase/config.ts

/**
 * Firebase クライアント設定。
 * NEXT_PUBLIC_ 付きの値はブラウザに露出するが、これは公開前提の識別子であり
 * 実際のアクセス制御は firestore.rules / storage.rules が担う。
 */
export const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
} as const;

/**
 * 環境変数が未設定でもサイトが壊れないようにするためのフラグ。
 * 未設定のときは静的な既定値（src/lib/site.ts）で表示を続ける。
 */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";
