// src/components/catalog/concepts/types.ts
import type React from "react";
import type { CatalogPartId } from "@/lib/catalog/parts";
import type { Locale } from "@/lib/i18n";

/**
 * 見本のページ1つ分。
 * - Frame：そのページの背景・文字色・フォント。パーツ図鑑で単体の見本を出すときも、これで包む
 * - Page：ページ全体
 * - samples：パーツ図鑑に出す単体の見本。キーの並びが、ページの横に出すパーツの一覧の順になる。
 *   Page の中で <Part id> を付けたパーツは、ここにも必ず入れる（図鑑から戻れるようにするため）
 */
export type ConceptView = {
    Frame: (props: { children: React.ReactNode; className?: string }) => React.ReactElement;
    Page: (props: { lang: Locale }) => React.ReactElement;
    samples: Partial<Record<CatalogPartId, (props: { lang: Locale }) => React.ReactElement>>;
};
