// src/components/contact/ContactForm.tsx
"use client";

import { useState } from "react";
import { getDictionary } from "@/lib/dictionary";
import type { Locale } from "@/lib/i18n";

type Status = { kind: "idle" | "sending" | "sent" } | { kind: "error"; message: string };

// スマホで入力欄を選んだときにブラウザが勝手に拡大しないよう、文字は 16px(text-base) 以上にする
const fieldClass = [
    "mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-4 py-3",
    "text-base text-white placeholder:text-white/25 sm:text-sm",
    "outline-none transition-colors",
    "focus:border-cyan-200/60 focus:ring-1 focus:ring-cyan-200/30",
].join(" ");

/**
 * 問い合わせフォーム。
 * 送信は /api/contact に POST する（クライアントから Firestore へは直接書かない）。
 * 画面遷移を伴わないので、送信後もサイト内に留まる。
 * エラー文を表示中の言語で返してもらうため、lang も一緒に送る。
 */
export const ContactForm = ({ lang }: { lang: Locale }) => {
    const t = getDictionary(lang).contact.form;
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [gotcha, setGotcha] = useState(""); // ハニーポット（人間は触らない）
    const [status, setStatus] = useState<Status>({ kind: "idle" });

    const sending = status.kind === "sending";

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (sending) return;

        setStatus({ kind: "sending" });

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, message, lang, _gotcha: gotcha }),
            });

            const data = (await res.json().catch(() => null)) as { error?: string } | null;

            if (!res.ok) {
                setStatus({ kind: "error", message: data?.error ?? t.failed });
                return;
            }

            setStatus({ kind: "sent" });
            setName("");
            setEmail("");
            setMessage("");
        } catch {
            setStatus({ kind: "error", message: t.networkError });
        }
    };

    if (status.kind === "sent") {
        return (
            <div className="text-center" role="status">
                <p className="text-lg text-white">{t.sentTitle}</p>
                <p className="mt-4 text-sm text-slate-300">{t.sentBody}</p>
                <button
                    type="button"
                    onClick={() => setStatus({ kind: "idle" })}
                    className="mt-8 rounded-full border border-white/20 px-6 py-2.5 text-xs tracking-widest text-white/80 transition-colors hover:border-white/40 hover:text-white"
                >
                    {t.sendAgain}
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} noValidate={false}>
            <div className="space-y-6">
                <div>
                    <label htmlFor="contact-name" className="text-xs tracking-[0.2em] text-cyan-100/70">
                        {t.name}
                    </label>
                    <input
                        id="contact-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t.namePlaceholder}
                        maxLength={100}
                        required
                        autoComplete="name"
                        disabled={sending}
                        className={fieldClass}
                    />
                </div>

                <div>
                    <label htmlFor="contact-email" className="text-xs tracking-[0.2em] text-cyan-100/70">
                        {t.email}
                    </label>
                    <input
                        id="contact-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@gmail.com"
                        maxLength={200}
                        required
                        autoComplete="email"
                        inputMode="email"
                        disabled={sending}
                        className={fieldClass}
                    />
                </div>

                <div>
                    <label htmlFor="contact-message" className="text-xs tracking-[0.2em] text-cyan-100/70">
                        {t.message}
                    </label>
                    <textarea
                        id="contact-message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={t.messagePlaceholder}
                        rows={8}
                        maxLength={4000}
                        required
                        disabled={sending}
                        className={`${fieldClass} resize-y`}
                    />
                    <p className="mt-2 text-right text-[10px] text-white/30">
                        {message.length} / 4000
                    </p>
                </div>

                {/* ハニーポット: 自動入力するボットを弾く。人間には見えない */}
                <div className="absolute -left-[9999px]" aria-hidden>
                    <label htmlFor="contact-gotcha">{t.honeypot}</label>
                    <input
                        id="contact-gotcha"
                        type="text"
                        value={gotcha}
                        onChange={(e) => setGotcha(e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                    />
                </div>

                {/* エラーは読み上げにも伝わるようにする */}
                <p className="min-h-5 text-sm text-rose-300" role="alert" aria-live="polite">
                    {status.kind === "error" ? status.message : ""}
                </p>

                <button
                    type="submit"
                    disabled={sending}
                    className={[
                        "w-full rounded-full border border-cyan-200/30 px-8 py-3 sm:w-auto",
                        "text-xs tracking-widest text-white",
                        "shadow-[0_0_20px_rgba(120,255,255,0.2)] transition-all",
                        "hover:shadow-[0_0_30px_rgba(120,255,255,0.4)]",
                        "disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none",
                    ].join(" ")}
                >
                    {sending ? t.sending : t.send}
                </button>
            </div>
        </form>
    );
};
