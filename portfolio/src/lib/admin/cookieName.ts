// src/lib/admin/cookieName.ts

/**
 * 管理画面のセッションCookie名。
 *
 * 名前は必ず "__session" にする。Firebase Hosting は CDN 層で、
 * "__session" という名前以外の Cookie をオリジン（Cloud Run）へ転送する前に
 * 全て削除してしまう（キャッシュ効率化のための既知の仕様）。
 * これに気づかず "__admin_session" にしていたところ、ブラウザは正しく
 * Cookie を送っているのに、サーバー側には常に「Cookie無し」として届き、
 * ログイン直後の /admin アクセスが必ず404になる不具合を起こした。
 * 参考: https://firebase.google.com/docs/hosting/manage-cache#using_cookies
 *
 * middleware は Edge ランタイムで動くため firebase-admin を読み込めない。
 * session.ts（firebase-admin に依存）とは別に、依存を持たないこのファイルから
 * Cookie 名だけを共有する。
 */
export const ADMIN_SESSION_COOKIE = "__session";
