// src/lib/content/career.ts

import type { Localized } from "@/lib/i18n";

/**
 * 経歴（/career）の項目の型・入力チェック・並べ方。
 * 登録スクリプト（scripts/career.ts）と公開ページ（getCareer.ts）の両方から使い、
 * 登録するときと読むときで同じ決まりになるようにする。
 *
 * 経歴は登録ファイル（career.json）1つにまとめて書き、スクリプトで Firestore の career/timeline に丸ごと書き込む。
 * 読むのも書くのもサーバー（Admin SDK）だけなので、クライアントからは触れない（firestore.rules）
 */

export const CAREER_COLLECTION = "career";
export const CAREER_DOC_ID = "timeline";

/** 種類。education：学歴、research：研究・発表、work：職歴・資格、achievement：制作・受賞。この順で絞り込みのボタンを並べる */
export const CAREER_KINDS = ["education", "research", "work", "achievement"] as const;
export type CareerKind = (typeof CAREER_KINDS)[number];

export const CAREER_LIMITS = { items: 200, title: 120, org: 120, description: 400, links: 5, linkLabel: 40, href: 500 } as const;

/** Firestore の1つのドキュメントの上限（1 MiB）より少し小さくした、書き込める大きさ */
export const CAREER_MAX_BYTES = 900_000;

/** 年月。"2024"（年だけ）か "2024-04"（年と月） */
export type CareerDate = string;

export type CareerLink = { label: Localized; href: string };

export type CareerItem = {
    /** 登録ファイルの中で重ならない名前。並べ替えのときの最後の決め手にも使う */
    id: string;
    kind: CareerKind;
    start: CareerDate;
    /** 期間のあるもの（在学・在籍など）の終わり。"present" は今も続いているもの。null は一時点のもの（受賞・発表など） */
    end: CareerDate | "present" | null;
    title: Localized;
    /** 学校・研究室・会社・学会・大会の名前など。無ければ空 */
    org: Localized;
    description: Localized;
    links: CareerLink[];
};

/** 登録ファイルの項目・リンク・文章に書ける名前。綴りを誤った名前を黙って無視しないよう、ほかの名前は誤りにする */
const ITEM_KEYS = ["id", "kind", "start", "end", "title", "org", "description", "links"];
const LINK_KEYS = ["label", "href"];
const TEXT_KEYS = ["ja", "en"];

/** サイトの URL。サイトの中のパスが、このサイトの中を指しているかを確かめるのに使う */
const SITE_ORIGIN = "https://kamijoharuto.com";

export const isCareerKind = (value: unknown): value is CareerKind =>
    typeof value === "string" && (CAREER_KINDS as readonly string[]).includes(value);

const isDate = (value: unknown): value is CareerDate =>
    typeof value === "string" && /^\d{4}(-(0[1-9]|1[0-2]))?$/.test(value);

/**
 * リンク先の種類。サイトの中のパス（/portfolio?tag=Python など）は "internal"、https の URL は "external"、それ以外は null。
 * ブラウザは URL の途中のタブや改行を取り除くので、"/\t/evil.example" が "//evil.example"（別のサイト）になる。
 * 空白・制御文字・バックスラッシュを含むものは、どちらにもしない。
 * サイトの中のパスに言語の接頭辞（/en/…）を書くと、英語のページで /en/en/… になるので、それも弾く（接頭辞は表示するときに付ける）
 */
export const careerHrefKind = (href: string): "internal" | "external" | null => {
    if (!href || /[\s\u0000-\u001f\u007f\\]/.test(href)) return null;
    try {
        if (href.startsWith("/")) {
            if (href.startsWith("//") || /^\/(ja|en)(?=[/?#]|$)/.test(href)) return null;
            return new URL(href, SITE_ORIGIN).origin === SITE_ORIGIN ? "internal" : null;
        }
        return new URL(href).protocol === "https:" ? "external" : null;
    } catch {
        return null;
    }
};

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** 知らない名前があれば誤りに足す */
const checkKeys = (value: Record<string, unknown>, allowed: string[], path: string, errors: string[]) => {
    const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
    if (unknown.length > 0) errors.push(`${path} に知らない名前があります：${unknown.join(", ")}（書けるのは ${allowed.join(", ")}）`);
};

/** { ja, en } を読む。英語は省略してよい（公開ページでは日本語を代わりに出す） */
const readText = (value: unknown, path: string, max: number, required: boolean, errors: string[]): Localized => {
    if (value === undefined && !required) return { ja: "", en: "" };
    if (!isObject(value)) {
        errors.push(`${path} は { "ja": "...", "en": "..." } の形で書いてください`);
        return { ja: "", en: "" };
    }
    checkKeys(value, TEXT_KEYS, path, errors);
    for (const lang of TEXT_KEYS) {
        if (value[lang] !== undefined && typeof value[lang] !== "string") errors.push(`${path}.${lang} は文字列で書いてください`);
    }
    const ja = typeof value.ja === "string" ? value.ja.trim() : "";
    const en = typeof value.en === "string" ? value.en.trim() : "";
    if (required && !ja) errors.push(`${path}.ja を書いてください`);
    if (ja.length > max || en.length > max) errors.push(`${path} は ${max} 文字までです`);
    return { ja, en };
};

/** 始まりを比べられる形にする。年だけ（"2024"）は、その年の初め（"2024-00"）とみなす */
const startKey = (date: CareerDate) => (date.length === 4 ? `${date}-00` : date);

/** 終わりを比べられる形にする。年だけ（"2024"）は、その年の終わり（"2024-13"）とみなす */
const endKey = (date: CareerDate) => (date.length === 4 ? `${date}-13` : date);

/**
 * 登録ファイルの中身を確かめて、経歴の項目にする。errors が空でなければ登録しない。
 * 書き方の誤りは、どの項目のどこかが分かるように、まとめて返す
 */
export const parseCareerFile = (data: unknown): { items: CareerItem[]; errors: string[] } => {
    const errors: string[] = [];
    if (!isObject(data) || !Array.isArray(data.items)) return { items: [], errors: ['{ "items": [ ... ] } の形で書いてください'] };
    checkKeys(data, ["items"], "ファイル", errors);
    if (data.items.length > CAREER_LIMITS.items) errors.push(`項目は ${CAREER_LIMITS.items} 個までです`);

    const seen = new Set<string>();
    const items = data.items.map((raw, i): CareerItem => {
        const at = `items[${i}]`;
        const item = isObject(raw) ? raw : {};
        if (!isObject(raw)) errors.push(`${at} は { ... } の形で書いてください`);
        checkKeys(item, ITEM_KEYS, at, errors);

        const id = typeof item.id === "string" ? item.id : "";
        if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id)) errors.push(`${at}.id は英小文字・数字・ハイフンで書いてください（64 文字まで）`);
        else if (seen.has(id)) errors.push(`${at}.id「${id}」が重なっています`);
        seen.add(id);

        if (!isCareerKind(item.kind)) errors.push(`${at}.kind は ${CAREER_KINDS.join(" / ")} のどれかにしてください`);
        if (!isDate(item.start)) errors.push(`${at}.start は "2024" か "2024-04" の形で書いてください`);
        const end = item.end === undefined ? null : item.end;
        if (end !== null && end !== "present" && !isDate(end)) {
            errors.push(`${at}.end は "2024" か "2024-04"、続いているものは "present"、一時点のものは書かないでください`);
        }
        if (isDate(item.start) && isDate(end) && endKey(end) < startKey(item.start)) errors.push(`${at}.end が start より前です`);

        const links = item.links === undefined ? [] : item.links;
        if (!Array.isArray(links)) errors.push(`${at}.links は [ ... ] の形で書いてください`);
        const linkList = Array.isArray(links) ? links : [];
        if (linkList.length > CAREER_LIMITS.links) errors.push(`${at}.links は ${CAREER_LIMITS.links} 個までです`);

        return {
            id,
            kind: isCareerKind(item.kind) ? item.kind : "education",
            start: isDate(item.start) ? item.start : "",
            end: end === "present" || isDate(end) ? end : null,
            title: readText(item.title, `${at}.title`, CAREER_LIMITS.title, true, errors),
            org: readText(item.org, `${at}.org`, CAREER_LIMITS.org, false, errors),
            description: readText(item.description, `${at}.description`, CAREER_LIMITS.description, false, errors),
            links: linkList.map((l, j) => {
                const lat = `${at}.links[${j}]`;
                const link = isObject(l) ? l : {};
                if (!isObject(l)) errors.push(`${lat} は { "label": ..., "href": ... } の形で書いてください`);
                checkKeys(link, LINK_KEYS, lat, errors);
                const href = typeof link.href === "string" ? link.href.trim() : "";
                if (href.length > CAREER_LIMITS.href || !careerHrefKind(href)) {
                    errors.push(`${lat}.href は https:// で始まる URL か、/ で始まるサイトの中のパス（/en は付けない）にしてください`);
                }
                return { label: readText(link.label, `${lat}.label`, CAREER_LIMITS.linkLabel, true, errors), href };
            }),
        };
    });

    return { items: errors.length > 0 ? [] : items, errors };
};

/**
 * Firestore から読んだ値を経歴の項目にする。形の崩れた項目は飛ばし、その数（と読めれば id）も返す。
 * 公開ページは読めた項目だけを出し、登録スクリプトは読めなかった項目を「消える」として表示する
 */
export const readCareerDoc = (data: unknown): { items: CareerItem[]; unreadable: string[] } => {
    if (data === undefined) return { items: [], unreadable: [] };
    if (!isObject(data) || !Array.isArray(data.items)) return { items: [], unreadable: ["（ドキュメント全体の形が違います）"] };
    const items: CareerItem[] = [];
    const unreadable: string[] = [];
    data.items.forEach((raw, i) => {
        const parsed = parseCareerFile({ items: [raw] });
        if (parsed.errors.length === 0) items.push(parsed.items[0]);
        else unreadable.push(isObject(raw) && typeof raw.id === "string" ? raw.id : `items[${i}]`);
    });
    return { items, unreadable };
};

/** 登録済みの項目と、これから書き込む項目を比べる。登録スクリプトの dry-run の表示に使う */
export const diffCareer = (current: CareerItem[], next: CareerItem[]) => {
    const before = new Map(current.map((item) => [item.id, JSON.stringify(item)]));
    const ids = new Set(next.map((item) => item.id));
    return {
        added: next.filter((item) => !before.has(item.id)).map((item) => item.id),
        changed: next.filter((item) => before.has(item.id) && before.get(item.id) !== JSON.stringify(item)).map((item) => item.id),
        removed: current.filter((item) => !ids.has(item.id)).map((item) => item.id),
    };
};

/**
 * 新しい順に並べる。始まりが新しいものほど先、同じなら続いているもの・終わりが新しいものを先にする。
 * それも同じなら id の順にして、毎回同じ並びにする。年だけの始まりは、その年の中で一番古い側に置く
 */
export const sortCareer = (items: CareerItem[]): CareerItem[] => {
    const finish = (item: CareerItem) => (item.end === "present" ? "9999-99" : item.end ? endKey(item.end) : startKey(item.start));
    return [...items].sort(
        (a, b) => startKey(b.start).localeCompare(startKey(a.start)) || finish(b).localeCompare(finish(a)) || a.id.localeCompare(b.id)
    );
};

/** 項目が始まった年。年表の見出しに使う */
export const yearOf = (item: CareerItem) => item.start.slice(0, 4);

/**
 * まだ始まっていない項目（入学予定・発表予定など）か。today は日本時間の "2026-11" の形。
 * 年だけの項目は、その年になるまでを予定とする
 */
export const isPlanned = (item: CareerItem, today: string) =>
    item.start.length === 4 ? item.start > today.slice(0, 4) : item.start > today.slice(0, 7);

/** 日本時間の今日の年月（"2026-11"） */
export const monthInTokyo = (now: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit" }).format(now).slice(0, 7);
