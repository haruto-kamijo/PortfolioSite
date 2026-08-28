// src/lib/admin/session.ts

import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase/admin";
import { ADMIN_SESSION_COOKIE } from "./cookieName";

/**
 * 管理画面のサーバー側セッション。
 *
 * Firebase Auth の ID トークンを Admin SDK でセッションCookieに変換して保持する。
 * ID トークンをそのまま Cookie に入れないのは、有効期限が1時間で短く、
 * かつ失効（revoke）を検知できないため。セッションCookieなら verifySessionCookie で
 * 失効チェックまで行える。
 *
 * Cookie は HttpOnly なので JavaScript からは読めない。
 */

// Cookie名は middleware とも共有するため別モジュールに置いている
export { ADMIN_SESSION_COOKIE } from "./cookieName";

/** Firebase のセッションCookieの上限は14日。ここでは5日にしている */
const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

/**
 * 管理者として許可するメールアドレス。
 * firestore.rules / storage.rules 側のリストと必ず揃えること。
 * 未設定なら誰も入れない（安全側に倒す）。
 */
const adminEmails = (): string[] =>
    (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

export const isAdminEmail = (email: string | undefined): boolean => {
    if (!email) return false;
    const list = adminEmails();
    if (list.length === 0) {
        console.warn("[admin] ADMIN_EMAILS が未設定のため、全てのログインを拒否します");
        return false;
    }
    return list.includes(email.toLowerCase());
};

export type AdminUser = { uid: string; email: string };

/**
 * ID トークンを検証してセッションCookieを作る。
 * 管理者以外、または検証に失敗した場合は null を返す（理由は呼び出し側に伝えない）。
 */
export const createAdminSession = async (
    idToken: string
): Promise<{ cookie: string; maxAgeSec: number; user: AdminUser } | null> => {
    const auth = getAdminAuth();
    if (!auth) return null;

    try {
        const decoded = await auth.verifyIdToken(idToken, true);

        // メール確認済みかつ許可リストに載っている場合のみ通す。
        // ブラウザ側には理由を返さず「ログインできませんでした」で統一するが、
        // ローカルでの動作確認がしやすいようサーバーのログにだけ理由を残す。
        if (!decoded.email_verified) {
            console.warn(`[admin] ログイン拒否: ${decoded.email ?? "(不明)"} は email_verified が false です`);
            return null;
        }
        if (!isAdminEmail(decoded.email)) {
            console.warn(`[admin] ログイン拒否: ${decoded.email ?? "(不明)"} は ADMIN_EMAILS に含まれていません`);
            return null;
        }

        const cookie = await auth.createSessionCookie(idToken, {
            expiresIn: SESSION_DURATION_MS,
        });

        return {
            cookie,
            maxAgeSec: Math.floor(SESSION_DURATION_MS / 1000),
            user: { uid: decoded.uid, email: decoded.email! },
        };
    } catch (err) {
        console.warn("[admin] セッション作成に失敗しました:", err);
        return null;
    }
};

/**
 * リクエストのCookieから管理者を取得する。未認証なら null。
 *
 * checkRevoked を有効にしているので、Firebase コンソールでセッションを失効させれば
 * すぐに弾ける（毎回1回のネットワーク往復が増えるが、管理画面なので許容する）。
 */
export const getAdminUser = async (): Promise<AdminUser | null> => {
    const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) {
        // middleware は Cookie の有無しか見ないため、ここに来た時点でCookie無しなら
        // middleware をすり抜けた別経路（Server Action の直接呼び出し等）ということになる
        console.warn("[admin] getAdminUser: セッションCookieがありません");
        return null;
    }

    const auth = getAdminAuth();
    if (!auth) {
        console.warn("[admin] getAdminUser: Admin SDK を初期化できませんでした");
        return null;
    }

    try {
        const decoded = await auth.verifySessionCookie(token, true);
        if (!isAdminEmail(decoded.email)) {
            console.warn(`[admin] getAdminUser: ${decoded.email ?? "(不明)"} は ADMIN_EMAILS に含まれていません`);
            return null;
        }

        return { uid: decoded.uid, email: decoded.email! };
    } catch (err) {
        // 期限切れ・改ざん・失効。いずれも「未認証」として扱うが、
        // 原因究明のためログにだけ理由を残す（ブラウザには何も返らない）
        console.warn("[admin] getAdminUser: セッションCookieの検証に失敗しました:", err);
        return null;
    }
};
