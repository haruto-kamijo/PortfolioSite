// src/lib/content/claudeUsage.ts
//
// About ページの「Claude Code の利用状況」タイルのデータ。
// この PC のローカルログを集計し（~/.claude/skills/claude-usage/usage.py）、
// 登録スクリプト（scripts/usage.ts）が Firestore の stats/claudeUsage に 1 件のドキュメントとして保存する。
// 公開ページに出すので、プロジェクト名や会話の内容は持たない。日ごとの数だけを持つ。

/** 1 日分。キーを短くしているのは 1 年分を 1 ドキュメントに収めるため */
export type ClaudeUsageDay = {
    /** 日付（日本時間、YYYY-MM-DD） */
    d: string;
    /** トークン数の合計（キャッシュの読み書きを含む） */
    t: number;
    /** 出力トークン数 */
    o: number;
    /** 応答数 */
    m: number;
    /** セッション数 */
    s: number;
};

export type ClaudeUsage = {
    /** 直近 1 年ほどの、使った日だけ。日付順 */
    days: ClaudeUsageDay[];
    /** 記録を始めてからの合計（1 年より前の分も含む） */
    totals: {
        activeDays: number;
        sessions: number;
        messages: number;
        totalTokens: number;
        outputTokens: number;
        firstDay: string;
    };
    updatedAt: string;
};

export const CLAUDE_USAGE_COLLECTION = "stats";
export const CLAUDE_USAGE_DOC_ID = "claudeUsage";

/** ヒートマップに出す日数より少し多めに持つ（53 週 = 371 日） */
export const CLAUDE_USAGE_KEEP_DAYS = 371;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** 形だけでなく、実在する日付か（2026-13-01 などは表示の Intl で例外になるため弾く） */
const isDate = (v: unknown): v is string =>
    typeof v === "string" && DATE_RE.test(v) && !Number.isNaN(dateOf(v).getTime()) && ymdOf(dateOf(v)) === v;
const isCount = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;

const parseDay = (v: unknown): ClaudeUsageDay | null => {
    if (typeof v !== "object" || v === null) return null;
    const { d, t, o, m, s } = v as Record<string, unknown>;
    if (!isDate(d)) return null;
    if (!isCount(t) || !isCount(o) || !isCount(m) || !isCount(s)) return null;
    return { d, t, o, m, s };
};

/** Firestore から読んだ値を確かめる。形が崩れていれば null（タイルを出さない） */
export const parseClaudeUsage = (data: unknown): ClaudeUsage | null => {
    if (typeof data !== "object" || data === null) return null;
    const { days, totals, updatedAt } = data as Record<string, unknown>;
    if (!Array.isArray(days) || typeof totals !== "object" || totals === null) return null;
    if (typeof updatedAt !== "string" || Number.isNaN(new Date(updatedAt).getTime())) return null;

    const parsedDays = days.map(parseDay);
    if (parsedDays.some((d) => d === null)) return null;

    const tt = totals as Record<string, unknown>;
    const counts = ["activeDays", "sessions", "messages", "totalTokens", "outputTokens"] as const;
    if (!counts.every((k) => isCount(tt[k]))) return null;
    if (!isDate(tt.firstDay)) return null;

    return {
        days: (parsedDays as ClaudeUsageDay[]).sort((a, b) => a.d.localeCompare(b.d)),
        totals: {
            activeDays: tt.activeDays as number,
            sessions: tt.sessions as number,
            messages: tt.messages as number,
            totalTokens: tt.totalTokens as number,
            outputTokens: tt.outputTokens as number,
            firstDay: tt.firstDay as string,
        },
        updatedAt,
    };
};

// ---------------------------------------------------------------- 日付（日本時間の暦日で数える）

const DAY_MS = 86_400_000;

/** 日本時間での今日（YYYY-MM-DD） */
export const todayInTokyo = (now = new Date()): string =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(now);

/** YYYY-MM-DD を暦日として扱うため、UTC の 0 時の Date にする */
export const dateOf = (ymd: string): Date => new Date(`${ymd}T00:00:00Z`);
export const ymdOf = (date: Date): string => date.toISOString().slice(0, 10);
export const addDays = (ymd: string, n: number): string => ymdOf(new Date(dateOf(ymd).getTime() + n * DAY_MS));
