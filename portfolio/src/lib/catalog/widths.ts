// src/lib/catalog/widths.ts

/**
 * デザインカタログの見本を表示する幅。
 * fit は今までどおり見本をページの中にそのまま描く（枠の幅に合わせる）。
 * それ以外は、見本だけのページ（/catalog-frame/<見本>）をその幅の iframe に入れて描く。
 * 見本の中は画面の幅（sm: など）で並びが変わる書き方なので、iframe にすると本物の画面と同じように並び替わる
 */
export const CATALOG_WIDTHS = ["fit", "pc", "tablet", "phone"] as const;
export type CatalogWidth = (typeof CATALOG_WIDTHS)[number];

/** iframe の幅（px）。fit は iframe を使わない */
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
