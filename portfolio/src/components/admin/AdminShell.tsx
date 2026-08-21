// src/components/admin/AdminShell.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { useSpaceScene } from "@/components/space/SpaceSceneProvider";

const NAV = [
    { label: "受信箱", href: "/admin/contacts" },
    { label: "プロフィール", href: "/admin/profile" },
    { label: "TOPカード", href: "/admin/works" },
    { label: "ポートフォリオ", href: "/admin/portfolio" },
] as const;

/**
 * 管理画面の外枠。
 * 認証はサーバー側（app/admin/layout.tsx）で済んでいるので、ここは見た目とログアウトだけを担う。
 */
export const AdminShell = ({
                               email,
                               children,
                           }: {
    email: string;
    children: React.ReactNode;
}) => {
    const { setPhase } = useSpaceScene();
    const pathname = usePathname();
    const router = useRouter();
    const [signingOut, setSigningOut] = useState(false);

    // 背景は公開ページと同じ落ち着いた状態にする
    useEffect(() => {
        setPhase("cruise");
    }, [setPhase]);

    const signOut = async () => {
        setSigningOut(true);

        // サーバーのセッションCookieとクライアントのFirebaseセッションの両方を落とす。
        // 片方だけ残すと「画面には入れないがFirestoreには書ける」等のズレが生じる。
        await fetch("/api/admin/session", { method: "DELETE" }).catch(() => undefined);
        const auth = getFirebaseAuth();
        if (auth) await auth.signOut().catch(() => undefined);

        router.replace("/login");
    };

    return (
        <div className="flex min-h-svh flex-col">
            <header className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur-md">
                <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
                    <Link href="/admin" className="text-sm tracking-[0.28em] text-cyan-200/90">
                        ADMIN
                    </Link>

                    <nav className="flex flex-1 flex-wrap gap-x-1">
                        {NAV.map((item) => {
                            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`rounded px-3 py-1.5 text-xs transition-colors ${
                                        active
                                            ? "bg-white/10 text-white"
                                            : "text-white/60 hover:text-cyan-200"
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-3">
                        <span className="hidden text-[11px] text-white/40 sm:inline">{email}</span>
                        <button
                            type="button"
                            onClick={signOut}
                            disabled={signingOut}
                            className="rounded-full border border-white/20 px-4 py-1.5 text-[11px] text-white/70 transition-colors hover:border-white/40 hover:text-white disabled:opacity-40"
                        >
                            {signingOut ? "..." : "ログアウト"}
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1">{children}</main>

            <footer className="border-t border-white/10 px-5 py-4 text-center text-[11px] text-white/30">
                <Link href="/home" className="transition-colors hover:text-cyan-200">
                    サイトを表示
                </Link>
            </footer>
        </div>
    );
};
