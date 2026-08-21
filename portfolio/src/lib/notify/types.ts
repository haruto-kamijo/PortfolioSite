// src/lib/notify/types.ts

/** 問い合わせ通知に渡す内容 */
export type ContactNotification = {
    id: string;
    name: string;
    email: string;
    message: string;
};

/**
 * 通知の結果。
 * 通知はベストエフォート（失敗しても問い合わせ自体は Firestore に残る）なので、
 * 例外を投げずに結果を返してログに残す。
 */
export type NotifyResult = {
    channel: "email" | "chat";
    status: "sent" | "skipped" | "failed";
    detail?: string;
};
