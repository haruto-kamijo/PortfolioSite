// src/lib/notify/email.ts

import { ContactNotification, NotifyResult } from "./types";

/**
 * Resend でメール通知を送る。
 *
 * SDK を足さず REST を直接叩いているのは依存を増やさないため。
 * Reply-To に訪問者のアドレスを入れているので、受信したメールで「返信」を押すだけで
 * そのまま相手とやり取りを始められる。
 */
export const sendContactEmail = async (
    contact: ContactNotification
): Promise<NotifyResult> => {
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.CONTACT_NOTIFY_TO;
    const from = process.env.CONTACT_NOTIFY_FROM;

    if (!apiKey || !to || !from) {
        return { channel: "email", status: "skipped", detail: "環境変数が未設定" };
    }

    try {
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from,
                to: [to],
                reply_to: contact.email,
                subject: `【ポートフォリオ】${contact.name} さんからお問い合わせ`,
                text: [
                    `名前: ${contact.name}`,
                    `メール: ${contact.email}`,
                    "",
                    contact.message,
                    "",
                    "---",
                    `このメールに返信すると ${contact.email} 宛に届きます。`,
                    `管理画面: /admin/contacts (ID: ${contact.id})`,
                ].join("\n"),
            }),
        });

        if (!res.ok) {
            return {
                channel: "email",
                status: "failed",
                detail: `Resend ${res.status}: ${await res.text()}`,
            };
        }

        return { channel: "email", status: "sent" };
    } catch (err) {
        return { channel: "email", status: "failed", detail: String(err) };
    }
};
