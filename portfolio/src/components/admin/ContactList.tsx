// src/components/admin/ContactList.tsx
"use client";

import { useState, useTransition } from "react";
import { Panel } from "@/components/ui/Panel";
import { ContactMessage } from "@/lib/content/types";
import { deleteContact, setContactRead } from "@/app/admin/contacts/actions";

const formatDate = (iso: string) => {
    if (!iso) return "日時不明";
    const d = new Date(iso);
    return new Intl.DateTimeFormat("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(d);
};

const ContactRow = ({ contact }: { contact: ContactMessage }) => {
    const [pending, startTransition] = useTransition();
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const run = (fn: () => Promise<void>) => {
        setError(null);
        startTransition(async () => {
            try {
                await fn();
            } catch {
                setError("処理に失敗しました");
            }
        });
    };

    return (
        <Panel as="li" className={`p-6 ${pending ? "opacity-50" : ""}`}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {!contact.read && (
                    <span className="rounded-full bg-cyan-300/15 px-2 py-0.5 text-[10px] tracking-widest text-cyan-200">
                        NEW
                    </span>
                )}
                <p className="text-base text-white">{contact.name}</p>
                <a
                    href={`mailto:${contact.email}`}
                    className="text-xs text-cyan-200/70 underline decoration-cyan-200/30 underline-offset-4 transition-colors hover:text-cyan-200"
                >
                    {contact.email}
                </a>
                <span className="ml-auto text-[11px] text-white/35">
                    {formatDate(contact.createdAt)}
                </span>
            </div>

            {/* 改行を保つ。本文は利用者が入力した文字列なのでそのまま表示する */}
            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-200">
                {contact.message}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => setContactRead(contact.id, !contact.read))}
                    className="rounded-full border border-white/20 px-4 py-1.5 text-[11px] text-white/70 transition-colors hover:border-white/40 hover:text-white disabled:opacity-40"
                >
                    {contact.read ? "未読に戻す" : "既読にする"}
                </button>

                <a
                    href={`mailto:${contact.email}?subject=${encodeURIComponent("お問い合わせありがとうございます")}`}
                    className="rounded-full border border-cyan-200/30 px-4 py-1.5 text-[11px] text-white/80 transition-colors hover:border-cyan-200/60 hover:text-white"
                >
                    返信する
                </a>

                {confirming ? (
                    <span className="ml-auto flex items-center gap-2">
                        <span className="text-[11px] text-rose-300">削除しますか？</span>
                        <button
                            type="button"
                            disabled={pending}
                            onClick={() => run(() => deleteContact(contact.id))}
                            className="rounded-full border border-rose-400/50 px-4 py-1.5 text-[11px] text-rose-200 transition-colors hover:bg-rose-400/10 disabled:opacity-40"
                        >
                            削除する
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirming(false)}
                            className="text-[11px] text-white/50 hover:text-white"
                        >
                            やめる
                        </button>
                    </span>
                ) : (
                    <button
                        type="button"
                        onClick={() => setConfirming(true)}
                        className="ml-auto text-[11px] text-white/35 transition-colors hover:text-rose-300"
                    >
                        削除
                    </button>
                )}
            </div>

            {error && (
                <p className="mt-3 text-xs text-rose-300" role="alert">
                    {error}
                </p>
            )}
        </Panel>
    );
};

export const ContactList = ({ contacts }: { contacts: ContactMessage[] }) => {
    if (contacts.length === 0) {
        return (
            <Panel className="p-10 text-center">
                <p className="text-sm text-white/50">まだ問い合わせはありません</p>
            </Panel>
        );
    }

    return (
        <ul className="space-y-4">
            {contacts.map((c) => (
                <ContactRow key={c.id} contact={c} />
            ))}
        </ul>
    );
};
