// src/components/catalog/Part.tsx
import React from "react";
import type { CatalogPartId } from "@/lib/catalog/parts";
import type { Locale } from "@/lib/i18n";

type Tag = "div" | "section" | "header" | "footer" | "nav" | "span" | "ul" | "li" | "article" | "aside" | "p";

/**
 * 見本のページの中で、パーツ図鑑の1項目に当たる要素。data-part を付けておき、
 * CatalogViewer がこれを目印に枠と名前を出し、クリックで図鑑へ移る
 */
export const Part = ({
    id,
    as: Tag = "div",
    className,
    style,
    children,
}: {
    id: CatalogPartId;
    as?: Tag;
    className?: string;
    style?: React.CSSProperties;
    children: React.ReactNode;
}) => (
    <Tag data-part={id} className={className} style={style}>
        {children}
    </Tag>
);

/** 見本の中の文言を言語で選ぶ */
export const textFor = (lang: Locale) => (ja: string, en: string) => (lang === "ja" ? ja : en);
