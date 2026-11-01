// src/lib/dictionary.ts
// 画面の固定文言（ボタン・見出し・案内文）の日英。
// 管理画面(CMS)で編集する文章は site.ts / Firestore 側にあり、ここには置かない。

import type { Locale } from "@/lib/i18n";

/** 見出し。title が大きく、sub が横に小さく出る */
type Heading = { title: string; sub: string };

export type Dictionary = {
    meta: { siteTitle: string; home: string; about: string; aboutDescription: string; portfolio: string; portfolioDescription: string; contact: string; contactDescription: string };
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
    about: { heading: Heading; school: string; hobby: string; language: string };
    academic: { graduated: string };
    portfolio: { heading: Heading; tabsLabel: string; tagsLabel: string; empty: string; noImage: string };
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
    },
    academic: { graduated: "修了" },
    portfolio: {
        heading: { title: "制作物", sub: "PORTFOLIO" },
        tabsLabel: "カテゴリ",
        tagsLabel: "使った技術",
        empty: "準備中です",
        noImage: "画像なし",
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
    },
    academic: { graduated: "Alumni" },
    portfolio: {
        heading: { title: "PORTFOLIO", sub: "Selected works" },
        tabsLabel: "Categories",
        tagsLabel: "Built with",
        empty: "Coming soon...",
        noImage: "No image",
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
