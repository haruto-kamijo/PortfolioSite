// src/lib/dictionary.ts
// 画面の固定文言（ボタン・見出し・案内文）の日英。
// 管理画面(CMS)で編集する文章は site.ts / Firestore 側にあり、ここには置かない。

import type { Locale } from "@/lib/i18n";

/** 見出し。title が大きく、sub が横に小さく出る */
type Heading = { title: string; sub: string };

export type Dictionary = {
    meta: { siteTitle: string; home: string; about: string; aboutDescription: string; portfolio: string; portfolioDescription: string; contact: string; contactDescription: string; catalog: string; catalogDescription: string; catalogParts: string; catalogPartsDescription: string };
    start: { kicker: string; cta: string; hintPointer: string; hintTouch: string };
    header: { openMenu: string; soon: string; switchTo: string; switchLabel: string };
    home: {
        kicker: string;
        github: string;
        blog: string;
        skills: Heading;
        latest: Heading;
        works: Heading;
        view: string;
        comingSoon: string;
        contact: Heading;
        contactLead: string;
        contactButton: string;
    };
    about: {
        heading: Heading;
        school: string;
        hobby: string;
        language: string;
        /** Claude Code の利用状況タイル。{date} などの差し込み先は ClaudeUsagePanel を参照 */
        usage: {
            title: string;
            since: string;
            heatmapLabel: string;
            tokensUnit: string;
            noActivity: string;
            less: string;
            more: string;
            activeDays: string;
            sessions: string;
            outputTokens: string;
            thisMonth: string;
            last7Days: string;
            note: string;
        };
    };
    academic: { graduated: string };
    portfolio: { heading: Heading; tabsLabel: string; tagsLabel: string; empty: string; noImage: string };
    /** デザインカタログ（/catalog）。{n} などの差し込み先は各ページを参照 */
    catalog: {
        heading: Heading;
        lead: string;
        viewsLabel: string;
        pages: string;
        parts: string;
        partsHeading: Heading;
        partsLead: string;
        partsIndexLabel: string;
        purpose: string;
        style: string;
        font: string;
        palette: string;
        fictional: string;
        open: string;
        partsCount: string;
        previewLabel: string;
        modeLabel: string;
        modePage: string;
        modeParts: string;
        hintPage: string;
        hintPointer: string;
        hintTouch: string;
        partsOnPage: string;
        openInParts: string;
        aliases: string;
        usedIn: string;
        viewOnPage: string;
        back: string;
        prev: string;
        next: string;
    };
    contact: {
        heading: Heading;
        lead: string;
        fallbackBefore: string;
        fallbackAfter: string;
        form: {
            name: string;
            namePlaceholder: string;
            email: string;
            message: string;
            messagePlaceholder: string;
            honeypot: string;
            send: string;
            sending: string;
            sentTitle: string;
            sentBody: string;
            sendAgain: string;
            failed: string;
            networkError: string;
        };
    };
};

const ja: Dictionary = {
    meta: {
        siteTitle: "ポートフォリオ",
        home: "ホーム",
        about: "プロフィール",
        aboutDescription: "上條遥都のプロフィール。所属・スキル・趣味など。",
        portfolio: "制作物",
        portfolioDescription: "上條遥都の制作物一覧。Webサイト・ゲーム・3Dモデル・写真。",
        contact: "お問い合わせ",
        contactDescription: "上條遥都へのお問い合わせフォーム。制作のご相談はこちらから。",
        catalog: "デザインカタログ",
        catalogDescription: "目的の違う架空のサイトを、見た目の流派ごとにデザインした見本集。UI パーツの名前と見本を紐づけて見られる。",
        catalogParts: "パーツ図鑑",
        catalogPartsDescription: "Web ページの UI パーツの名前と役割を、デザインカタログの4つの見本と一緒に引ける図鑑。",
    },
    start: {
        kicker: "ポートフォリオサイト",
        cta: "宇宙へ出発",
        hintPointer: "クリック / スペースキー",
        hintTouch: "タップで出発",
    },
    header: { openMenu: "メニューを開閉する", soon: "準備中", switchTo: "EN", switchLabel: "English に切り替える" },
    home: {
        kicker: "ポートフォリオサイト",
        github: "GitHub",
        blog: "ブログ",
        skills: { title: "使える技術", sub: "SKILLS" },
        latest: { title: "最近の更新", sub: "LATEST" },
        works: { title: "制作物", sub: "WORKS" },
        view: "見る",
        comingSoon: "準備中",
        contact: { title: "お問い合わせ", sub: "CONTACT" },
        contactLead: "制作のご相談・ご依頼はお問い合わせフォームからお願いします。",
        contactButton: "お問い合わせへ",
    },
    about: {
        heading: { title: "プロフィール", sub: "ABOUT" },
        school: "所属",
        hobby: "趣味",
        language: "使用言語",
        usage: {
            title: "Claude Code の利用状況",
            since: "{date} から記録・{updated} 時点",
            heatmapLabel: "Claude Code を使った日のヒートマップ（{from}〜{to}）。{days} 日使用、最も多かったのは {busiest}",
            tokensUnit: "トークン",
            noActivity: "使っていない日",
            less: "少",
            more: "多",
            activeDays: "使った日数",
            sessions: "セッション",
            outputTokens: "出力トークン",
            thisMonth: "今月のトークン",
            last7Days: "直近 7 日のトークン",
            note: "私の PC（Windows・Mac）の Claude Code のログを毎日集計しています。トークン数はキャッシュの読み書きを含みます。",
        },
    },
    academic: { graduated: "修了" },
    portfolio: {
        heading: { title: "制作物", sub: "PORTFOLIO" },
        tabsLabel: "カテゴリ",
        tagsLabel: "使った技術",
        empty: "準備中です",
        noImage: "画像なし",
    },
    catalog: {
        heading: { title: "デザインカタログ", sub: "DESIGN CATALOG" },
        lead: "目的の違う架空のサイトを、見た目の流派ごとにデザインしました。見本のページは、そのままボタンやタブを押して操作できます。「パーツの名前を見る」に切り替えると、パーツを指して名前を確かめ、押してパーツ図鑑でその役割と、ほかのページでの見え方を比べられます。",
        viewsLabel: "表示の切り替え",
        pages: "ページ",
        parts: "パーツ図鑑",
        partsHeading: { title: "パーツ図鑑", sub: "UI PARTS" },
        partsLead: "Web ページでよく使う UI パーツの名前と役割です。同じパーツでも、流派によって見た目が大きく変わります。",
        partsIndexLabel: "パーツの一覧",
        purpose: "目的",
        style: "流派",
        font: "書体",
        palette: "配色",
        fictional: "実在しない架空のサイトです",
        open: "ページを見る",
        partsCount: "{n} 個のパーツ",
        previewLabel: "{name} のデザイン見本",
        modeLabel: "見本の見方",
        modePage: "ページを操作する",
        modeParts: "パーツの名前を見る",
        hintPage: "ボタンやタブを押すと、ページの中で動きます。パーツの名前は「パーツの名前を見る」に切り替えると出ます。",
        hintPointer: "パーツにカーソルを合わせると名前が出ます。クリックするとパーツ図鑑に移ります。",
        hintTouch: "パーツをタップすると名前が出ます。もう一度タップするとパーツ図鑑に移ります。",
        partsOnPage: "このページのパーツ",
        openInParts: "図鑑で見る",
        aliases: "別名：",
        usedIn: "使っているページ",
        viewOnPage: "ページで見る",
        back: "カタログの一覧へ",
        prev: "前のページ：",
        next: "次のページ：",
    },
    contact: {
        heading: { title: "お問い合わせ", sub: "CONTACT" },
        lead: "制作のご相談・ご依頼、その他のご連絡はこちらからお願いします。内容を確認のうえ、ご記入いただいたメールアドレスに返信します。",
        fallbackBefore: "フォームがうまく動かない場合は",
        fallbackAfter: "まで直接ご連絡ください。",
        form: {
            name: "お名前",
            namePlaceholder: "山田 太郎",
            email: "メールアドレス",
            message: "お問い合わせ内容",
            messagePlaceholder: "ご相談の内容をご記入ください",
            honeypot: "この項目は入力しないでください",
            send: "送信する",
            sending: "送信中...",
            sentTitle: "送信しました",
            sentBody: "お問い合わせありがとうございます。内容を確認のうえ返信します。",
            sendAgain: "続けて送信する",
            failed: "送信に失敗しました。時間をおいてお試しください",
            networkError: "通信に失敗しました。接続を確認してお試しください",
        },
    },
};

const en: Dictionary = {
    meta: {
        siteTitle: "Portfolio",
        home: "Home",
        about: "About",
        aboutDescription: "About Kamijo Haruto: school, skills, and hobbies.",
        portfolio: "Portfolio",
        portfolioDescription: "Works by Kamijo Haruto: websites, games, 3D models, and photos.",
        contact: "Contact",
        contactDescription: "Contact form for Kamijo Haruto. Feel free to reach out about projects.",
        catalog: "Design Catalog",
        catalogDescription: "Fictional websites for different purposes, each designed in a different visual style, with every UI part named and linked.",
        catalogParts: "Parts Guide",
        catalogPartsDescription: "A field guide to web UI parts: names, roles and samples from the four sites in the design catalog.",
    },
    start: {
        kicker: "PORTFOLIO SITE",
        cta: "GO TO SPACE",
        hintPointer: "Click / Space",
        hintTouch: "Tap to start",
    },
    header: { openMenu: "Toggle menu", soon: "Soon", switchTo: "JA", switchLabel: "日本語に切り替える" },
    home: {
        kicker: "PORTFOLIO SITE",
        github: "GITHUB",
        blog: "BLOG",
        skills: { title: "SKILLS", sub: "What I work with" },
        latest: { title: "LATEST", sub: "Recent updates" },
        works: { title: "WORKS", sub: "Things I've made" },
        view: "VIEW",
        comingSoon: "COMING SOON",
        contact: { title: "CONTACT", sub: "Get in touch" },
        contactLead: "For project inquiries or requests, please use the contact form.",
        contactButton: "CONTACT",
    },
    about: {
        heading: { title: "ABOUT", sub: "Profile" },
        school: "SCHOOL",
        hobby: "HOBBY",
        language: "LANGUAGE",
        usage: {
            title: "CLAUDE CODE ACTIVITY",
            since: "Tracked since {date} · as of {updated}",
            heatmapLabel: "Heatmap of Claude Code usage from {from} to {to}: active on {days} days, busiest on {busiest}",
            tokensUnit: "tokens",
            noActivity: "No activity",
            less: "Less",
            more: "More",
            activeDays: "Active days",
            sessions: "Sessions",
            outputTokens: "Output tokens",
            thisMonth: "Tokens this month",
            last7Days: "Tokens, last 7 days",
            note: "Aggregated daily from my Claude Code logs across my machines (Windows and Mac). Token counts include cache reads and writes.",
        },
    },
    academic: { graduated: "Alumni" },
    portfolio: {
        heading: { title: "PORTFOLIO", sub: "Selected works" },
        tabsLabel: "Categories",
        tagsLabel: "Built with",
        empty: "Coming soon...",
        noImage: "No image",
    },
    catalog: {
        heading: { title: "DESIGN CATALOG", sub: "Pages & UI parts" },
        lead: "Fictional websites for different purposes, each designed in its own visual style. You can use each sample page as it is, pressing its buttons and tabs. Switch to “Show part names” to point at a part and see its name, and click it to open the parts guide, where you can compare how it looks on the other pages.",
        viewsLabel: "Switch view",
        pages: "Pages",
        parts: "Parts Guide",
        partsHeading: { title: "PARTS GUIDE", sub: "UI parts" },
        partsLead: "Names and roles of common web UI parts. The same part can look very different depending on the style.",
        partsIndexLabel: "All parts",
        purpose: "Purpose",
        style: "Style",
        font: "Type",
        palette: "Colors",
        fictional: "This is a fictional website",
        open: "View page",
        partsCount: "{n} parts",
        previewLabel: "Design sample of {name}",
        modeLabel: "How to view the sample",
        modePage: "Use the page",
        modeParts: "Show part names",
        hintPage: "Buttons and tabs work inside the page. Switch to “Show part names” to see what each part is called.",
        hintPointer: "Hover over a part to see its name. Click it to open the parts guide.",
        hintTouch: "Tap a part to see its name. Tap it again to open the parts guide.",
        partsOnPage: "Parts on this page",
        openInParts: "Open in guide",
        aliases: "Also called: ",
        usedIn: "Used on",
        viewOnPage: "View on page",
        back: "Back to catalog",
        prev: "Previous: ",
        next: "Next: ",
    },
    contact: {
        heading: { title: "CONTACT", sub: "Get in touch" },
        lead: "For project inquiries, requests, or anything else, please reach out here. I'll reply to the email address you provide.",
        fallbackBefore: "If the form doesn't work, please email me directly at",
        fallbackAfter: ".",
        form: {
            name: "Name",
            namePlaceholder: "Jane Doe",
            email: "Email",
            message: "Message",
            messagePlaceholder: "Tell me about your project",
            honeypot: "Leave this field empty",
            send: "SEND",
            sending: "Sending...",
            sentTitle: "Message sent",
            sentBody: "Thank you for reaching out. I'll get back to you soon.",
            sendAgain: "Send another message",
            failed: "Failed to send. Please try again later.",
            networkError: "Network error. Please check your connection and try again.",
        },
    },
};

const dictionaries: Record<Locale, Dictionary> = { ja, en };

export const getDictionary = (lang: Locale): Dictionary => dictionaries[lang];
