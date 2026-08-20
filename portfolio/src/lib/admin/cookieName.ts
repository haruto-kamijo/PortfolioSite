// src/lib/admin/cookieName.ts

/**
 * 管理画面のセッションCookie名。
 *
 * middleware は Edge ランタイムで動くため firebase-admin を読み込めない。
 * session.ts（firebase-admin に依存）とは別に、依存を持たないこのファイルから
 * Cookie 名だけを共有する。
 */
export const ADMIN_SESSION_COOKIE = "__admin_session";
