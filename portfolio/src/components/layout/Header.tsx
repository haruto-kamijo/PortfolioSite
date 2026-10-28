// src/components/layout/Header.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { LanguageSwitch, LanguageSwitchFallback } from "@/components/layout/LanguageSwitch";
import { getDictionary } from "@/lib/dictionary";
import { Locale, localizePath, stripLocale } from "@/lib/i18n";
import { nav, site } from "@/lib/site";

export const Header = ({ lang }: { lang: Locale }) => {
    const [open, setOpen] = useState(false);
    // 言語の接頭辞を外して比べる（/en/about でも /about の項目を現在地として扱う）
    const pathname = stripLocale(usePathname());
    const t = getDictionary(lang).header;
    const close = () => setOpen(false);

    // スマホでは指で押しやすいよう上下の余白を広めにとる
    const linkBase =
        "block px-3 py-3 text-sm tracking-[0.14em] transition-colors lg:inline-block lg:py-2";

    return (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-md">
            <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-1 px-5 py-3">
                <Link href={localizePath("/home", lang)} className="flex shrink-0 items-center gap-3" onClick={close}>
                    <Image src="/logo.png" width={32} height={32} alt="" priority />
                    <span className="text-sm tracking-[0.22em] text-white/90">{site.name}</span>
                </Link>

                {/* 言語の切り替えはスマホでもメニューを開かずに押せるよう、常に表示する */}
                <div className="flex items-center gap-2 lg:order-last lg:ml-4">
                    <Suspense fallback={<LanguageSwitchFallback lang={lang} />}>
                        <LanguageSwitch lang={lang} onNavigate={close} />
                    </Suspense>

                    <button
                        type="button"
                        onClick={() => setOpen((v) => !v)}
                        aria-expanded={open}
                        aria-controls="site-nav"
                        className="rounded border border-cyan-200/40 px-3 py-2 text-cyan-100/80 transition-colors hover:border-cyan-200 hover:text-white lg:hidden"
                    >
                        <span className="sr-only">{t.openMenu}</span>
                        <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20" aria-hidden>
                            <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
                        </svg>
                    </button>
                </div>

                <div
                    id="site-nav"
                    className={`${open ? "block" : "hidden"} w-full lg:ml-auto lg:block lg:w-auto`}
                >
                    <ul className="flex flex-col items-stretch py-2 text-right lg:flex-row lg:items-center lg:py-0">
                        {nav.map((item) => {
                            const label = item.label[lang];
                            const isCurrent = !item.external && pathname === item.href;

                            // 未実装のページはリンクを張らず、実装待ちであることを明示する
                            if (!item.ready) {
                                return (
                                    <li key={item.href}>
                                        <span
                                            className={`${linkBase} cursor-not-allowed text-white/30`}
                                            title={t.soon}
                                        >
                                            {label}
                                            <span className="ml-2 align-middle text-[10px] tracking-normal text-cyan-100/40">
                                                {t.soon}
                                            </span>
                                        </span>
                                    </li>
                                );
                            }

                            return (
                                <li key={item.href}>
                                    {item.external ? (
                                        <a
                                            href={item.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`${linkBase} text-white/80 hover:text-cyan-200`}
                                        >
                                            {label}
                                            {/* 外部リンクの矢印。文字の「↗」はフォントによって
                                                スラッシュのように見えるため SVG で描く */}
                                            <svg
                                                className="ml-1.5 inline-block h-2 w-2 -translate-y-1"
                                                viewBox="0 0 8 8"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.2"
                                                strokeLinecap="round"
                                                aria-hidden
                                            >
                                                <path d="M1 7L7 1" />
                                                <path d="M2.5 1H7v4.5" />
                                            </svg>
                                        </a>
                                    ) : (
                                        <Link
                                            href={localizePath(item.href, lang)}
                                            onClick={close}
                                            aria-current={isCurrent ? "page" : undefined}
                                            className={`${linkBase} ${
                                                isCurrent
                                                    ? "text-cyan-200"
                                                    : "text-white/80 hover:text-cyan-200"
                                            }`}
                                        >
                                            {label}
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
