// scripts/usage.ts
//
// About ページの「Claude Code の利用状況」を更新する。
// この PC の Claude Code のログを集計スクリプト（~/.claude/skills/claude-usage/usage.py）で集計し、
// 公開用の数（日ごとのトークン数・応答数・セッション数）だけを Firestore の stats/claudeUsage に書く。
// プロジェクト名や会話の内容は書かない。
//
//   npm run usage                  集計して、書き込む内容を表示する（dry-run。何も書き込まない）
//   npm run usage -- --run         本番に書き込む
//   npm run usage -- --emulator    エミュレータに書き込む
//   npm run usage -- --from <file> 集計スクリプトを動かさず、書き出し済みの JSON（--public-json の出力）を使う
//
// 毎日の自動更新は Windows のタスクスケジューラから `npm run usage -- --run` を実行する（README 参照）。

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import {
    CLAUDE_USAGE_COLLECTION,
    CLAUDE_USAGE_DOC_ID,
    CLAUDE_USAGE_KEEP_DAYS,
    ClaudeUsage,
    addDays,
    parseClaudeUsage,
    todayInTokyo,
} from "../src/lib/content/claudeUsage";

const DEFAULT_SCRIPT = join(homedir(), ".claude", "skills", "claude-usage", "usage.py");

type Exported = {
    generated_at: string;
    totals: {
        active_days: number;
        sessions: number;
        messages: number;
        total_tokens: number;
        output_tokens: number;
        first_day: string | null;
    };
    daily: { date: string; messages: number; total_tokens: number; output_tokens: number; sessions: number }[];
};

/** 集計スクリプトを動かし、公開用の JSON を読む */
const runAggregator = (): Exported => {
    const script = process.env.CLAUDE_USAGE_SCRIPT ?? DEFAULT_SCRIPT;
    if (!existsSync(script)) throw new Error(`集計スクリプトがありません: ${script}`);
    const dir = mkdtempSync(join(tmpdir(), "claude-usage-"));
    const out = join(dir, "usage.json");
    try {
        // -I：ログのあるフォルダなどからモジュールを読み込まないようにする
        execFileSync(process.env.PYTHON ?? "python", ["-I", script, "--public-json", out, "--quiet"], {
            stdio: ["ignore", "ignore", "inherit"],
        });
        // ログが 1 件も無いと usage.py は何も書き出さずに終わる
        if (!existsSync(out)) throw new Error("集計結果がありません（Claude Code のログが見つかりませんでした）");
        return JSON.parse(readFileSync(out, "utf-8")) as Exported;
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
};

const ISO_DATETIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

/**
 * usage.py の generated_at（例：2026-11-02T00:12:00+09:00）を読む。
 * new Date() は 2026-02-30 のような実在しない日を 3 月 2 日に読み替えてしまうので、
 * 形式と実在する暦日・時刻かを先に確かめる。だめなら null
 */
const parseGeneratedAt = (value: unknown): Date | null => {
    if (typeof value !== "string") return null;
    const m = ISO_DATETIME.exec(value);
    if (!m) return null;
    const [y, mo, d, h, mi, s] = m.slice(1, 7).map(Number);
    const day = new Date(Date.UTC(y, mo - 1, d));
    const realDay = day.getUTCFullYear() === y && day.getUTCMonth() === mo - 1 && day.getUTCDate() === d;
    if (!realDay || h > 23 || mi > 59 || s > 59) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

/** 書き込む形にする。直近 CLAUDE_USAGE_KEEP_DAYS 日のうち、使った日だけを残す */
const toDoc = (ex: Exported): ClaudeUsage => {
    if (!ex.totals.first_day) throw new Error("集計結果が空です");
    // 集計した日時を基準にする（--from で前に書き出した JSON を使ったとき、実行日を集計日として扱わないため）
    const generatedAt = parseGeneratedAt(ex.generated_at);
    if (!generatedAt) {
        throw new Error("集計結果の generated_at（集計した日時）が無いか、正しい日時ではありません。usage.py --public-json の出力を使ってください");
    }
    const to = todayInTokyo(generatedAt);
    const from = addDays(to, -(CLAUDE_USAGE_KEEP_DAYS - 1));
    const doc: ClaudeUsage = {
        days: ex.daily
            // 集計日より後の日付は（PC の時計がずれていた場合など）保存しない
            .filter((d) => d.date >= from && d.date <= to && d.messages > 0)
            .map((d) => ({ d: d.date, t: d.total_tokens, o: d.output_tokens, m: d.messages, s: d.sessions })),
        totals: {
            activeDays: ex.totals.active_days,
            sessions: ex.totals.sessions,
            messages: ex.totals.messages,
            totalTokens: ex.totals.total_tokens,
            outputTokens: ex.totals.output_tokens,
            firstDay: ex.totals.first_day,
        },
        updatedAt: generatedAt.toISOString(),
    };
    // 画面側と同じ検査に通らないものは書かない（書いても表示されないため）
    if (!parseClaudeUsage(doc)) throw new Error("集計結果の形が想定と違います。usage.py の出力を確認してください");
    return doc;
};

/** 本番かエミュレータの Firestore に繋ぐ。認証は scripts/content.ts と同じく gcloud の認証情報を使う */
const connect = async (useEmulator: boolean) => {
    if (existsSync(".env.local")) process.loadEnvFile(".env.local");
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = useEmulator ? "true" : "false";

    if (!useEmulator && !process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        const adc = process.env.APPDATA
            ? join(process.env.APPDATA, "gcloud", "application_default_credentials.json")
            : join(homedir(), ".config", "gcloud", "application_default_credentials.json");
        if (!existsSync(adc)) {
            throw new Error("本番に繋ぐ認証情報がありません。先に `gcloud auth application-default login` を実行してください");
        }
        process.env.GOOGLE_APPLICATION_CREDENTIALS = adc;
    }

    // 環境変数を決めてから読み込む（admin.ts は読み込んだ時点の環境変数で接続先を決めるため）
    const { getAdminDb } = await import("../src/lib/firebase/admin");
    const db = getAdminDb();
    if (!db) throw new Error("Firebase に接続できません。.env.local の FIREBASE_PROJECT_ID などを確認してください");
    return { db, target: useEmulator ? "エミュレータ" : `本番（${process.env.FIREBASE_PROJECT_ID}）` };
};

const fmt = (n: number) => new Intl.NumberFormat("ja-JP", { notation: "compact", maximumFractionDigits: 1 }).format(n);

const main = async () => {
    const args = process.argv.slice(2);
    const run = args.includes("--run");
    const useEmulator = args.includes("--emulator");
    const fromIndex = args.indexOf("--from");
    const fromValueIndex = fromIndex >= 0 ? fromIndex + 1 : -1;
    const fromValue = fromIndex >= 0 ? args[fromValueIndex] : undefined;
    const known = new Set(["--run", "--emulator", "--from"]);
    const unknown = args.filter((a, i) => !known.has(a) && i !== fromValueIndex);
    if (unknown.length > 0 || (fromIndex >= 0 && (!fromValue || fromValue.startsWith("--")))) {
        throw new Error(`使い方: npm run usage -- [--run] [--emulator] [--from <file>]（不明な引数: ${unknown.join(" ")}）`);
    }

    const exported = fromValue
        ? (JSON.parse(readFileSync(fromValue, "utf-8")) as Exported)
        : runAggregator();
    const doc = toDoc(exported);

    console.log(`集計日時 ${doc.updatedAt}`);
    console.log(`記録開始 ${doc.totals.firstDay} / 使った日 ${doc.totals.activeDays} 日 / セッション ${doc.totals.sessions}`);
    console.log(`トークン合計 ${fmt(doc.totals.totalTokens)}（出力 ${fmt(doc.totals.outputTokens)}）`);
    console.log(`書き込む日数 ${doc.days.length} 日（${doc.days[0]?.d ?? "-"} 〜 ${doc.days.at(-1)?.d ?? "-"}）`);

    if (!run && !useEmulator) {
        console.log("\ndry-run のため書き込んでいません。本番に書くには --run を付けてください");
        return;
    }
    const { db, target } = await connect(useEmulator);
    await db.collection(CLAUDE_USAGE_COLLECTION).doc(CLAUDE_USAGE_DOC_ID).set(doc);
    console.log(`\n${target} の ${CLAUDE_USAGE_COLLECTION}/${CLAUDE_USAGE_DOC_ID} に書き込みました（About ページには 5 分以内に反映）`);
};

main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
});
