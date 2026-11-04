// src/lib/catalog/widths.ts

/**
 * デザインカタログの見本を表示する幅。
 * 見本はいつも、見本だけのページ（/catalog-frame/<見本>）を iframe に入れて描く。
 * fit は枠の幅の iframe、それ以外はその幅の iframe にする（どの幅でも同じ iframe なので、見本の中の状態は残る）。
 * 見本の中は画面の幅（sm: など）で並びが変わる書き方なので、iframe にすると本物の画面と同じように並び替わる
 */
export const CATALOG_WIDTHS = ["fit", "pc", "tablet", "phone"] as const;
export type CatalogWidth = (typeof CATALOG_WIDTHS)[number];

/** iframe の幅（px）。fit は決まった幅を持たず、枠の幅にする */
export const CATALOG_WIDTH_PX: Record<CatalogWidth, number | null> = {
    fit: null,
    pc: 1280,
    tablet: 768,
    phone: 390,
};

export const isCatalogWidth = (value: unknown): value is CatalogWidth =>
    typeof value === "string" && (CATALOG_WIDTHS as readonly string[]).includes(value);

/** 見本だけのページのパス（言語の接頭辞は付けない） */
export const catalogFramePath = (concept: string) => `/catalog-frame/${concept}`;

/**
 * パスがこの見本だけのページか（星空の背景を出さないために使う）。/en の付いたものも含む。
 * ビルドのときに作るページのパスは /ja/catalog-frame/… なので、/ja の付いたものも含める（サーバーとブラウザで描くものをそろえる）
 */
export const isCatalogFramePath = (pathname: string) => /^(?:\/(?:ja|en))?\/catalog-frame(?:\/|$)/.test(pathname);
