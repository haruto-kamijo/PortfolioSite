// src/lib/catalog/parts.ts

import type { Localized, LocalizedList } from "@/lib/i18n";

/**
 * デザインカタログのパーツ図鑑に載せる UI パーツ。
 * 見本のページ（components/catalog/concepts）では、<Part id="..."> でこの id を付けて紐づける。
 * 並び順はパーツ図鑑の表示順（ページの上から下へ出てくる順に近づけている）
 */
export const CATALOG_PART_IDS = [
    "global-nav",
    "hero",
    "cta-button",
    "badge",
    "ticker",
    "breadcrumb",
    "tabs",
    "tag",
    "card",
    "feature-grid",
    "stats",
    "menu-list",
    "pricing-table",
    "gallery",
    "testimonial",
    "accordion",
    "pagination",
    "form",
    "newsletter",
    "footer",
] as const;

export type CatalogPartId = (typeof CATALOG_PART_IDS)[number];

export type CatalogPart = {
    name: Localized;
    /** 同じものを指す別の呼び方 */
    aliases: LocalizedList;
    description: Localized;
};

export const CATALOG_PARTS: Record<CatalogPartId, CatalogPart> = {
    "global-nav": {
        name: { ja: "グローバルナビゲーション", en: "Global navigation" },
        aliases: { ja: ["グロナビ", "ヘッダーメニュー"], en: ["Navbar", "Header"] },
        description: {
            ja: "全ページの上部に共通で置く、サイトの主要なページへのリンク。ロゴと並べ、今いるページを強調して現在地を示す。",
            en: "Links to the main sections, shared at the top of every page. Sits next to the logo and highlights the current page.",
        },
    },
    hero: {
        name: { ja: "ヒーローセクション", en: "Hero section" },
        aliases: { ja: ["ファーストビュー", "メインビジュアル"], en: ["Hero", "Above the fold"] },
        description: {
            ja: "ページを開いて最初に目に入る大きな領域。何のサイトかを見出しと画像で一瞬で伝え、次の行動（CTA）へ誘導する。",
            en: "The large area seen first when the page opens. Tells visitors what the site is about at a glance and leads to the next action.",
        },
    },
    "cta-button": {
        name: { ja: "CTA ボタン", en: "Call-to-action button" },
        aliases: { ja: ["行動喚起ボタン", "コンバージョンボタン"], en: ["CTA", "Primary button"] },
        description: {
            ja: "予約・購読・申し込みなど、サイトが一番してほしい行動へのボタン。周りより目立つ色と、動詞で始まる短い文言にする。",
            en: "The button for the action the site wants most, such as booking or signing up. Uses a standout color and a short verb-first label.",
        },
    },
    badge: {
        name: { ja: "バッジ", en: "Badge" },
        aliases: { ja: ["ラベル"], en: ["Label", "Pill"] },
        description: {
            ja: "「新着」「限定」などの状態を、要素の横に小さく添える目印。押せる要素ではないので、タグと見た目を分ける。",
            en: "A small marker such as \"New\" or \"Limited\" placed next to an item. It is not clickable, so it should look different from tags.",
        },
    },
    ticker: {
        name: { ja: "ティッカー", en: "Ticker" },
        aliases: { ja: ["マーキー", "流れるテキスト"], en: ["Marquee", "News ticker"] },
        description: {
            ja: "速報や告知を横に流し続ける帯。動きで目を引くが、動きを減らす設定の人には止めて表示する。",
            en: "A strip that keeps scrolling headlines or notices sideways. Eye-catching, but it should stop for people who prefer reduced motion.",
        },
    },
    breadcrumb: {
        name: { ja: "パンくずリスト", en: "Breadcrumb" },
        aliases: { ja: ["パンくず"], en: ["Breadcrumbs"] },
        description: {
            ja: "トップから今のページまでの階層を「ホーム > 記事 > …」と並べたリンク。深い階層のページで現在地と戻り道を示す。",
            en: "The trail of links from the top page to the current one, like \"Home > Articles > ...\". Shows where you are on deep pages.",
        },
    },
    tabs: {
        name: { ja: "タブ", en: "Tabs" },
        aliases: { ja: ["タブメニュー", "セグメント"], en: ["Tab bar", "Segmented control"] },
        description: {
            ja: "同じ場所の中身を、カテゴリごとに切り替える見出しの列。選んでいるタブを色や下線ではっきり示す。",
            en: "A row of headings that switches the content in one place by category. The selected tab is marked clearly with color or an underline.",
        },
    },
    tag: {
        name: { ja: "タグ", en: "Tag" },
        aliases: { ja: ["チップ"], en: ["Chip"] },
        description: {
            ja: "記事や作品に付けた分類のラベル。押すと同じ分類の一覧に移れることが多い。",
            en: "A category label attached to an article or work. Often clickable to list other items with the same label.",
        },
    },
    card: {
        name: { ja: "カード", en: "Card" },
        aliases: { ja: ["カード型レイアウト"], en: ["Tile"] },
        description: {
            ja: "画像・見出し・短い説明を1つの枠にまとめた単位。同じ形を並べて、記事やお知らせの一覧を作る。",
            en: "A unit that bundles an image, a title and a short description in one box. Repeated in a grid to list articles or news.",
        },
    },
    "feature-grid": {
        name: { ja: "特徴グリッド", en: "Feature grid" },
        aliases: { ja: ["こだわり", "選ばれる理由"], en: ["Features", "Benefits"] },
        description: {
            ja: "サービスの特徴を、アイコンと短い見出し・説明の組で横に並べたもの。3つ前後にまとめると読みやすい。",
            en: "Key features laid out side by side as icon, short title and text. Around three items keeps it easy to scan.",
        },
    },
    stats: {
        name: { ja: "実績の数値", en: "Stats" },
        aliases: { ja: ["数字で見る"], en: ["Key figures", "Metrics"] },
        description: {
            ja: "利用者数や年数などの数字を大きく見せて、信頼感を伝える帯。数字と単位・説明を組にする。",
            en: "A band of large numbers such as users or years in business, used to build trust. Each number is paired with a short label.",
        },
    },
    "menu-list": {
        name: { ja: "価格リスト", en: "Price list" },
        aliases: { ja: ["メニュー表", "お品書き"], en: ["Menu"] },
        description: {
            ja: "品名と価格を左右に振り分け、間を点線などでつないだ一覧。飲食店のメニューやサービスの料金に使う。",
            en: "A list with item names and prices on either side, often joined by a dotted leader. Used for restaurant menus and service fees.",
        },
    },
    "pricing-table": {
        name: { ja: "料金表", en: "Pricing table" },
        aliases: { ja: ["プラン比較", "料金プラン"], en: ["Pricing plans", "Plan comparison"] },
        description: {
            ja: "複数のプランを列に並べ、価格と含まれる機能を比べられるようにした表。おすすめのプランを1つ目立たせる。",
            en: "Plans side by side in columns so price and features can be compared. One recommended plan is usually highlighted.",
        },
    },
    gallery: {
        name: { ja: "ギャラリーグリッド", en: "Gallery grid" },
        aliases: { ja: ["フォトギャラリー", "サムネイル一覧"], en: ["Image grid", "Masonry"] },
        description: {
            ja: "写真や作品の画像を格子状に並べた一覧。大きさに差を付けると、単調にならずリズムが出る。",
            en: "Photos or works arranged in a grid. Mixing sizes adds rhythm and keeps it from looking monotonous.",
        },
    },
    testimonial: {
        name: { ja: "お客様の声", en: "Testimonial" },
        aliases: { ja: ["レビュー", "推薦文"], en: ["Review", "Quote"] },
        description: {
            ja: "利用者の感想を、名前や肩書きと一緒に引用として見せる部分。第三者の言葉で信頼感を補う。",
            en: "Feedback from customers shown as a quote with their name or role. A third party's words add credibility.",
        },
    },
    accordion: {
        name: { ja: "アコーディオン", en: "Accordion" },
        aliases: { ja: ["開閉パネル", "よくある質問"], en: ["Disclosure", "FAQ"] },
        description: {
            ja: "見出しを押すと中身が開いたり閉じたりする一覧。よくある質問のように、量の多い情報を畳んでおくのに使う。",
            en: "A list whose headings open and close their content. Used to fold away long information, like an FAQ.",
        },
    },
    pagination: {
        name: { ja: "ページネーション", en: "Pagination" },
        aliases: { ja: ["ページ送り"], en: ["Pager"] },
        description: {
            ja: "長い一覧を複数のページに分け、番号や「次へ」で移動できるようにしたもの。今のページ番号を目立たせる。",
            en: "Splits a long list into pages you can move through by number or \"Next\". The current page number stands out.",
        },
    },
    form: {
        name: { ja: "入力フォーム", en: "Form" },
        aliases: { ja: ["お問い合わせフォーム", "予約フォーム"], en: ["Contact form", "Input fields"] },
        description: {
            ja: "名前や日時などを入力して送る欄の組み合わせ。項目ごとにラベルを付け、送信ボタンで締める。",
            en: "A set of fields for entering details such as a name or date. Every field has a label, and a submit button ends the form.",
        },
    },
    newsletter: {
        name: { ja: "ニュースレター登録", en: "Newsletter signup" },
        aliases: { ja: ["メルマガ登録"], en: ["Email capture", "Subscribe box"] },
        description: {
            ja: "メールアドレス1つだけを入れて購読できる、横長の小さなフォーム。入力欄とボタンを1行に並べる。",
            en: "A compact form that subscribes with just an email address. The field and button sit on a single line.",
        },
    },
    footer: {
        name: { ja: "フッター", en: "Footer" },
        aliases: { ja: ["ページ下部"], en: ["Site footer"] },
        description: {
            ja: "全ページの最下部に共通で置く領域。サイトマップ的なリンク、連絡先、著作権表記などをまとめる。",
            en: "The area shared at the bottom of every page. Gathers sitemap-style links, contact details and the copyright notice.",
        },
    },
};
