// src/app/api/contact/route.ts

import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { collections } from "@/lib/content/types";
import { DEFAULT_LOCALE, Locale, Localized, isLocale } from "@/lib/i18n";
import { sendContactEmail } from "@/lib/notify/email";
import { sendContactChat } from "@/lib/notify/chat";

/**
 * 問い合わせの受け口。
 *
 * クライアントから Firestore へ直接書かせず、ここを通す理由:
 *  - サーバー側で検証とレート制限ができる
 *  - contacts コレクションをルールで完全に閉じられる（クライアントからは読めない）
 *
 * 保存は必須、通知はベストエフォート。
 * 通知が失敗しても内容は Firestore に残るので、200 を返して管理画面で確認できる状態にする。
 */

const LIMITS = {
    name: 100,
    email: 200,
    message: 4000,
} as const;

/**
 * 簡易レート制限。
 * Cloud Run のインスタンスごとのメモリなので厳密ではないが、
 * 素朴な連投を止める速度制限としては十分。厳密な制御が必要になったら Firestore に移す。
 */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 3;
const recentHits = new Map<string, number[]>();

const isRateLimited = (key: string, now: number) => {
    const hits = (recentHits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
    hits.push(now);
    recentHits.set(key, hits);

    // 際限なく増えないように、古いキーを掃除する
    if (recentHits.size > 500) {
        recentHits.forEach((times, k) => {
            if (times.every((t) => now - t >= RATE_WINDOW_MS)) recentHits.delete(k);
        });
    }

    return hits.length > RATE_MAX;
};

const clientIp = (req: NextRequest) =>
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

/** 生のIPは残さず、連投判定に使えるハッシュだけを保存する */
const hashIp = (ip: string) =>
    createHash("sha256").update(`${ip}:${process.env.FIREBASE_PROJECT_ID ?? ""}`).digest("hex").slice(0, 32);

/** 利用者に返すエラー文。フォームから送られた lang（無ければ日本語）で返す */
const MESSAGES = {
    badRequest: { ja: "リクエストの形式が不正です", en: "Invalid request." },
    missing: { ja: "未入力の項目があります", en: "Please fill in all fields." },
    nameTooLong: { ja: "お名前が長すぎます", en: "Your name is too long." },
    emailTooLong: { ja: "メールアドレスが長すぎます", en: "Your email address is too long." },
    messageTooLong: { ja: "本文が長すぎます", en: "Your message is too long." },
    emailInvalid: { ja: "メールアドレスの形式が正しくありません", en: "Please enter a valid email address." },
    rateLimited: {
        ja: "送信が続いています。しばらく待ってからお試しください",
        en: "Too many messages. Please wait a moment and try again.",
    },
    unavailable: {
        ja: "現在お問い合わせを受け付けられません。時間をおいてお試しください",
        en: "The contact form is currently unavailable. Please try again later.",
    },
    failed: {
        ja: "送信に失敗しました。時間をおいてお試しください",
        en: "Failed to send. Please try again later.",
    },
} satisfies Record<string, Localized>;

type MessageKey = keyof typeof MESSAGES;

type Parsed = { name: string; email: string; message: string };

const parseBody = (body: unknown): { data: Parsed } | { error: MessageKey } => {
    if (typeof body !== "object" || body === null) return { error: "badRequest" };

    const raw = body as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

    const name = str(raw.name);
    const email = str(raw.email);
    const message = str(raw.message);

    if (!name || !email || !message) return { error: "missing" };
    if (name.length > LIMITS.name) return { error: "nameTooLong" };
    if (email.length > LIMITS.email) return { error: "emailTooLong" };
    if (message.length > LIMITS.message) return { error: "messageTooLong" };

    // 厳密な検証はメールを送ってみるまでできないので、明らかな誤りだけ弾く
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { error: "emailInvalid" };
    }

    return { data: { name, email, message } };
};

export async function POST(req: NextRequest) {
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ ok: false, error: MESSAGES.badRequest[DEFAULT_LOCALE] }, { status: 400 });
    }

    const lang: Locale = isLocale((body as Record<string, unknown>)?.lang)
        ? ((body as Record<string, unknown>).lang as Locale)
        : DEFAULT_LOCALE;
    const fail = (key: MessageKey, status: number) =>
        NextResponse.json({ ok: false, error: MESSAGES[key][lang] }, { status });

    // ハニーポット: 人間には見えない項目が埋まっていたらボットなので、
    // 攻撃者に気づかせないよう成功を装って捨てる
    if (typeof (body as Record<string, unknown>)?._gotcha === "string" && (body as Record<string, unknown>)._gotcha) {
        return NextResponse.json({ ok: true });
    }

    const parsed = parseBody(body);
    if ("error" in parsed) return fail(parsed.error, 400);

    const ip = clientIp(req);
    if (isRateLimited(ip, Date.now())) return fail("rateLimited", 429);

    const db = getAdminDb();
    if (!db) {
        // 保存できないなら受け付けたふりをしてはいけない
        console.error("[contact] Firestore に接続できないため受け付けを中止しました");
        return fail("unavailable", 503);
    }

    let id: string;
    try {
        const doc = await db.collection(collections.contacts).add({
            ...parsed.data,
            read: false,
            createdAt: FieldValue.serverTimestamp(),
            userAgent: req.headers.get("user-agent") ?? "",
            ipHash: hashIp(ip),
        });
        id = doc.id;
    } catch (err) {
        console.error("[contact] 保存に失敗しました:", err);
        return fail("failed", 500);
    }

    // 通知はベストエフォート。失敗しても内容は保存済みなので成功として返す。
    const notification = { id, ...parsed.data };
    const results = await Promise.all([
        sendContactEmail(notification),
        sendContactChat(notification),
    ]);

    // 通知が出たかどうかは運用時に確認したいので、成功・スキップも含めて必ず記録する
    console.info(
        `[contact] ${id} を保存 / 通知: ` +
        results.map((r) => `${r.channel}=${r.status}`).join(" ")
    );

    for (const r of results) {
        if (r.status === "failed") {
            console.error(`[contact] ${r.channel} の通知に失敗:`, r.detail);
        }
    }

    return NextResponse.json({ ok: true });
}
