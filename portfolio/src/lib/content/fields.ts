// src/lib/content/fields.ts

import type { Localized, LocalizedList } from "@/lib/i18n";

/**
 * Firestore のドキュメントを読み書きするときの小さな変換。
 *
 * 日英の文章は、日本語を元のフィールド名（title）、英語を En 付きのフィールド名（titleEn）に
 * 平らに保存している（types.ts 参照）。ここでその変換を一か所にまとめる。
 */

type Data = Record<string, unknown>;

export const str = (value: unknown, fallback = "") =>
    typeof value === "string" && value.length > 0 ? value : fallback;

export const strList = (value: unknown, fallback: string[] = []) =>
    Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : fallback;

/** title / titleEn を { ja, en } にまとめる。無い言語は fallback で埋める */
export const readLocalized = (data: Data, key: string, fallback?: Localized): Localized => ({
    ja: str(data[key], fallback?.ja ?? ""),
    en: str(data[`${key}En`], fallback?.en ?? ""),
});

export const readLocalizedList = (data: Data, key: string, fallback?: LocalizedList): LocalizedList => ({
    ja: strList(data[key], fallback?.ja ?? []),
    en: strList(data[`${key}En`], fallback?.en ?? []),
});

/** 保存用に { ja, en } を title / titleEn に戻す */
export const writeLocalized = <K extends string>(key: K, value: Localized | LocalizedList) =>
    ({ [key]: value.ja, [`${key}En`]: value.en }) as Record<K | `${K}En`, string | string[]>;
