// src/lib/notify/chat.ts

import { ContactNotification, NotifyResult } from "./types";

/**
 * Discord / Slack の Incoming Webhook に通知を送る。
 *
 * CONTACT_CHAT_WEBHOOK_KIND で送信先を切り替える。違いは2点:
 *  - 本文のキー: Slack は text、Discord は content
 *  - 太字の記法: Slack は *bold*、Discord は **bold**
 *    （取り違えると記号がそのまま表示されるので、ここで吸収する）
 */
export const sendContactChat = async (
    contact: ContactNotification
): Promise<NotifyResult> => {
    const url = process.env.CONTACT_CHAT_WEBHOOK_URL;
    const kind = process.env.CONTACT_CHAT_WEBHOOK_KIND === "slack" ? "slack" : "discord";

    if (!url) {
        return { channel: "chat", status: "skipped", detail: "Webhook URL が未設定" };
    }

    // 長い本文はチャットでは読みにくいので抜粋にする（全文はメールと管理画面で見る）
    const excerpt =
        contact.message.length > 300 ? `${contact.message.slice(0, 300)}…` : contact.message;

    const bold = (s: string) => (kind === "slack" ? `*${s}*` : `**${s}**`);

    const text = [
        bold("ポートフォリオに問い合わせが届きました"),
        `名前: ${contact.name}`,
        `メール: ${contact.email}`,
        "",
        excerpt,
    ].join("\n");

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(kind === "slack" ? { text } : { content: text }),
        });

        if (!res.ok) {
            return {
                channel: "chat",
                status: "failed",
                detail: `Webhook ${res.status}: ${await res.text()}`,
            };
        }

        return { channel: "chat", status: "sent" };
    } catch (err) {
        return { channel: "chat", status: "failed", detail: String(err) };
    }
};
