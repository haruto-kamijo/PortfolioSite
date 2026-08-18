// src/lib/firebase/client.ts
"use client";

import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import { Auth, connectAuthEmulator, getAuth } from "firebase/auth";
import { Firestore, connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { FirebaseStorage, connectStorageEmulator, getStorage } from "firebase/storage";
import { firebaseConfig, isFirebaseConfigured, useEmulator } from "./config";

/**
 * ブラウザ側の Firebase。管理画面（ログイン・編集・画像アップロード）で使う。
 * 公開ページの表示はサーバー側の Admin SDK 経由なので、ここは管理画面専用。
 *
 * 環境変数が未設定なら null を返し、呼び出し側で「未設定」を扱えるようにしている。
 * 初期化を遅延させているのは、設定がないときに import だけで例外を出さないため。
 */

let app: FirebaseApp | null = null;
let emulatorsConnected = false;

export const getFirebaseApp = (): FirebaseApp | null => {
    if (!isFirebaseConfigured) return null;
    if (app) return app;

    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    return app;
};

export const getFirebaseAuth = (): Auth | null => {
    const a = getFirebaseApp();
    if (!a) return null;

    const auth = getAuth(a);
    connectEmulatorsOnce(auth, getFirestore(a), getStorage(a));
    return auth;
};

export const getDb = (): Firestore | null => {
    const a = getFirebaseApp();
    if (!a) return null;

    const db = getFirestore(a);
    connectEmulatorsOnce(getAuth(a), db, getStorage(a));
    return db;
};

export const getFirebaseStorage = (): FirebaseStorage | null => {
    const a = getFirebaseApp();
    if (!a) return null;

    const storage = getStorage(a);
    connectEmulatorsOnce(getAuth(a), getFirestore(a), storage);
    return storage;
};

/** エミュレータ接続は各サービス1回だけ。2回呼ぶと実行時エラーになる */
const connectEmulatorsOnce = (auth: Auth, db: Firestore, storage: FirebaseStorage) => {
    if (!useEmulator || emulatorsConnected) return;
    emulatorsConnected = true;

    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectStorageEmulator(storage, "127.0.0.1", 9199);
};
