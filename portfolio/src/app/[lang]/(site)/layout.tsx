// src/app/[lang]/(site)/layout.tsx
"use client";

import React, { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useSpaceScene } from "@/components/space/SpaceSceneProvider";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n";

/**
 * 本編ページ共通のレイアウト。
 * スタート画面 (/) はこのグループの外にあるため Header / Footer は付かず、
 * 背景の星空だけをルートレイアウトから共有する。
 */
export default function SiteLayout({
                                       children,
                                       params,
                                   }: {
    children: React.ReactNode;
    params: { lang: string };
}) {
    const lang = isLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
    const { setPhase } = useSpaceScene();

    // ワープ直後は背景が拡大・暗転したままなので、通常表示に戻す
    useEffect(() => {
        setPhase("cruise");
    }, [setPhase]);

    return (
        <div className="flex min-h-svh flex-col">
            <Header lang={lang} />
            <main className="flex-1">{children}</main>
            <Footer />

            {/* ワープの暗転から明けるベール。CSSアニメーションなのでJSなしでも消える */}
            <div aria-hidden className="page-enter-veil" />
        </div>
    );
}
