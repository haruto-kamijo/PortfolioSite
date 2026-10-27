// src/components/i18n/HtmlLang.tsx
"use client";

import { useEffect } from "react";
import type { Locale } from "@/lib/i18n";

/**
 * <html lang> を表示中の言語に合わせる。
 *
 * ルートレイアウトは管理画面・404 と共有しているため、<html lang="ja"> を静的に出している。
 * 英語ページでは本文側にも lang="en" を付けているが、読み上げソフトやブラウザ翻訳が
 * <html> の lang を見ることもあるため、表示後にこちらも書き換える。
 */
export const HtmlLang = ({ lang }: { lang: Locale }) => {
    useEffect(() => {
        document.documentElement.lang = lang;
    }, [lang]);

    return null;
};
