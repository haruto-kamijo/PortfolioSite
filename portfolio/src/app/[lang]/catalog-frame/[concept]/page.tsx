// src/app/[lang]/catalog-frame/[concept]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CONCEPT_VIEWS } from "@/components/catalog/concepts";
import { CATALOG_CONCEPTS, CATALOG_CONCEPT_IDS, isCatalogConceptId } from "@/lib/catalog/concepts";
import { DEFAULT_LOCALE, isLocale, pick } from "@/lib/i18n";

type Props = { params: { lang: string; concept: string } };

const langOf = (params: Props["params"]) => (isLocale(params.lang) ? params.lang : DEFAULT_LOCALE);

/**
 * 見本のページだけを描くページ。/catalog/<見本> で幅（PC・タブレット・スマホ）を選んだとき、
 * CatalogViewer がこれをその幅の iframe に入れる（src/lib/catalog/widths.ts）。
 *
 * ヘッダー・フッター・星空の背景は出さない（(site) の外に置き、SpaceBackground はこのパスでは描かない）。
 * 単体で開かれても意味の無いページなので、検索には載せない（sitemap にも入れていない）。
 * パーツの名前を見るモードでは、親のページが iframe の中を直接読んで、パーツの位置を調べる（同じサイトなので読める）
 */
export const dynamicParams = false;

export const generateStaticParams = () => CATALOG_CONCEPT_IDS.map((concept) => ({ concept }));

export const generateMetadata = ({ params }: Props): Metadata => {
    if (!isCatalogConceptId(params.concept)) return {};
    return {
        title: pick(CATALOG_CONCEPTS[params.concept].name, langOf(params)),
        robots: { index: false, follow: false },
    };
};

export default function CatalogFramePage({ params }: Props) {
    if (!isCatalogConceptId(params.concept)) notFound();
    const { Page } = CONCEPT_VIEWS[params.concept];
    // data-catalog-page は、見本の中のナビや CTA ボタンが、動かす先のパーツを探す範囲の目印（Interactive.tsx）
    return (
        <div data-catalog-page="" data-catalog-frame="">
            <Page lang={langOf(params)} />
        </div>
    );
}
