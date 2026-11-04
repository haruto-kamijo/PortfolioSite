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

/** 種類。education：学歴、research：研究・発表、work：職歴・資格、achievement：制作・受賞 */
export const CAREER_KINDS = ["education", "research", "work", "achievement"] as const;
export type CareerKind = (typeof CAREER_KINDS)[number];

export const CAREER_LIMITS = { items: 200, title: 120, org: 120, description: 400, links: 5, linkLabel: 40, href: 500 } as const;

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

export const isCareerKind = (value: unknown): value is CareerKind =>
    typeof value === "string" && (CAREER_KINDS as readonly string[]).includes(value);

const isDate = (value: unknown): value is CareerDate =>
    typeof value === "string" && /^\d{4}(-(0[1-9]|1[0-2]))?$/.test(value);

/** リンク先。サイトの中のパス（/portfolio?tag=Python など）か、http(s) の URL */
const isHref = (value: string) => /^https?:\/\//.test(value) || /^\/(?![/\\])/.test(value);

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** { ja, en } を読む。英語は省略してよい（公開ページでは日本語を代わりに出す） */
const readText = (value: unknown, path: string, max: number, required: boolean, errors: string[]): Localized => {
    if (value === undefined && !required) return { ja: "", en: "" };
    if (!isObject(value)) {
        errors.push(`${path} は { "ja": "...", "en": "..." } の形で書いてください`);
        return { ja: "", en: "" };
    }
    const ja = typeof value.ja === "string" ? value.ja.trim() : "";
    const en = typeof value.en === "string" ? value.en.trim() : "";
    if (value.en !== undefined && typeof value.en !== "string") errors.push(`${path}.en は文字列で書いてください`);
    if (required && !ja) errors.push(`${path}.ja を書いてください`);
    if (ja.length > max || en.length > max) errors.push(`${path} は ${max} 文字までです`);
    return { ja, en };
};

/** 年月を比べられる形にする（"2024" は "2024-00" とみなし、同じ年の中では月のあるものより前にする） */
const dateKey = (date: CareerDate) => (date.length === 4 ? `${date}-00` : date);

/**
 * 登録ファイルの中身を確かめて、経歴の項目にする。errors が空でなければ登録しない。
 * 書き方の誤りは、どの項目のどこかが分かるように、まとめて返す
 */
export const parseCareerFile = (data: unknown): { items: CareerItem[]; errors: string[] } => {
    const errors: string[] = [];
    if (!isObject(data) || !Array.isArray(data.items)) return { items: [], errors: ['{ "items": [ ... ] } の形で書いてください'] };
    if (data.items.length > CAREER_LIMITS.items) errors.push(`項目は ${CAREER_LIMITS.items} 個までです`);

    const seen = new Set<string>();
    const items = data.items.map((raw, i): CareerItem => {
        const at = `items[${i}]`;
        const item = isObject(raw) ? raw : {};
        if (!isObject(raw)) errors.push(`${at} は { ... } の形で書いてください`);

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
        if (isDate(item.start) && isDate(end) && dateKey(end) < dateKey(item.start)) errors.push(`${at}.end が start より前です`);

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
                const href = typeof link.href === "string" ? link.href.trim() : "";
                if (!isHref(href) || href.length > CAREER_LIMITS.href) {
                    errors.push(`${lat}.href は https:// で始まる URL か、/ で始まるサイトの中のパスにしてください`);
                }
                return { label: readText(link.label, `${lat}.label`, CAREER_LIMITS.linkLabel, true, errors), href };
            }),
        };
    });

    return { items: errors.length > 0 ? [] : items, errors };
};

/**
 * Firestore から読んだ値を経歴の項目にする（公開ページ用）。
 * 登録するときに確かめているが、形が崩れていたら、崩れた項目だけを飛ばして出す
 */
export const readCareerDoc = (data: unknown): CareerItem[] => {
    if (!isObject(data) || !Array.isArray(data.items)) return [];
    return data.items.flatMap((raw) => {
        const { items, errors } = parseCareerFile({ items: [raw] });
        return errors.length === 0 ? items : [];
    });
};

/**
 * 新しい順に並べる。始まりが新しいものほど先、同じなら続いているもの・終わりが新しいものを先にする。
 * それも同じなら id の順にして、毎回同じ並びにする
 */
export const sortCareer = (items: CareerItem[]): CareerItem[] => {
    const endKey = (item: CareerItem) => (item.end === "present" ? "9999-99" : item.end ? dateKey(item.end) : dateKey(item.start));
    return [...items].sort(
        (a, b) =>
            dateKey(b.start).localeCompare(dateKey(a.start)) ||
            endKey(b).localeCompare(endKey(a)) ||
            a.id.localeCompare(b.id)
    );
};

/** 項目が始まった年。年表の見出しに使う */
export const yearOf = (item: CareerItem) => item.start.slice(0, 4);
