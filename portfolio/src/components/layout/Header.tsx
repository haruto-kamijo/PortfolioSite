// src/components/layout/Header.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { nav, site } from "@/lib/site";

export const Header = () => {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    const linkBase =
        "block px-3 py-2 text-sm tracking-[0.14em] transition-colors lg:inline-block";

    return (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-md">
            <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between px-5 py-3">
                <Link href="/home" className="flex shrink-0 items-center gap-3" onClick={() => setOpen(false)}>
                    <Image src="/logo.png" width={32} height={32} alt="" priority />
                    <span className="text-sm tracking-[0.22em] text-white/90">{site.name}</span>
                </Link>

                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    aria-controls="site-nav"
                    className="rounded border border-cyan-200/40 px-3 py-2 text-cyan-100/80 transition-colors hover:border-cyan-200 hover:text-white lg:hidden"
                >
                    <span className="sr-only">メニューを開閉する</span>
                    <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20" aria-hidden>
                        <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
                    </svg>
                </button>

                <div
                    id="site-nav"
                    className={`${open ? "block" : "hidden"} w-full lg:block lg:w-auto`}
                >
                    <ul className="flex flex-col items-stretch py-2 text-right lg:flex-row lg:items-center lg:py-0">
                        {nav.map((item) => {
                            const isCurrent = !item.external && pathname === item.href;

                            // 未実装のページはリンクを張らず、実装待ちであることを明示する
                            if (!item.ready) {
                                return (
                                    <li key={item.label}>
                                        <span
                                            className={`${linkBase} cursor-not-allowed text-white/30`}
                                            title="準備中"
                                        >
                                            {item.label}
                                            <span className="ml-2 align-middle text-[10px] tracking-normal text-cyan-100/40">
                                                Soon
                                            </span>
                                        </span>
                                    </li>
                                );
                            }

                            return (
                                <li key={item.label}>
                                    {item.external ? (
                                        <a
                                            href={item.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`${linkBase} text-white/80 hover:text-cyan-200`}
                                        >
                                            {item.label}
                                            <span className="ml-1 align-super text-[9px]" aria-hidden>
                                                ↗
                                            </span>
                                        </a>
                                    ) : (
                                        <Link
                                            href={item.href}
                                            onClick={() => setOpen(false)}
                                            aria-current={isCurrent ? "page" : undefined}
                                            className={`${linkBase} ${
                                                isCurrent
                                                    ? "text-cyan-200"
                                                    : "text-white/80 hover:text-cyan-200"
                                            }`}
                                        >
                                            {item.label}
                                        </Link>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </nav>
        </header>
    );
};
