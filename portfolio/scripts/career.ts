// scripts/career.ts
//
// 経歴のページ（/career）の項目を、登録ファイル（career.json）から本番の Firestore に書き込む。
// 登録ファイルには経歴を全部まとめて書き、Firestore の career/timeline を丸ごと置き換える
// （ファイルから消した項目は、ページからも消える）。書き方は README の「経歴を登録する」を参照。
//
//   npm run career -- <career.json の場所>              確かめて、変わるところを表示する（dry-run。何も書き込まない）
//   npm run career -- <career.json の場所> --run        本番に書き込む
//   npm run career -- <career.json の場所> --emulator   エミュレータに書き込む（--run と一緒に使う）
//
// 登録ファイルは個人の経歴なので、このリポジトリには置かない（置き場所は自分で決める）。

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { CAREER_COLLECTION, CAREER_DOC_ID, CareerItem, parseCareerFile, readCareerDoc, sortCareer } from "../src/lib/content/career";

const SITE_URL = "https://kamijoharuto.com";
const KNOWN_FLAGS = ["--run", "--emulator"];

/** 本番（またはエミュレータ）の Firestore に繋ぐ。鍵ファイルは置かず、gcloud の認証情報を使う（content.ts と同じ） */
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

const dateRange = (item: CareerItem) =>
    item.end === null ? item.start : `${item.start} 〜 ${item.end === "present" ? "現在" : item.end}`;

const line = (item: CareerItem) => `${dateRange(item).padEnd(19)} [${item.kind}] ${item.title.ja}${item.org.ja ? `（${item.org.ja}）` : ""}`;

const same = (a: CareerItem, b: CareerItem) => JSON.stringify(a) === JSON.stringify(b);

const main = async () => {
    const args = process.argv.slice(2);
    const flags = new Set(args.filter((a) => a.startsWith("--")));
    const unknown = Array.from(flags).filter((f) => !KNOWN_FLAGS.includes(f));
    const files = args.filter((a) => !a.startsWith("--"));
    if (unknown.length > 0 || files.length !== 1) {
        console.error("使い方：npm run career -- <career.json の場所> [--run] [--emulator]");
        if (unknown.length > 0) console.error(`知らないオプションです：${unknown.join(" ")}`);
        process.exit(1);
    }

    const path = resolve(files[0]);
    if (!existsSync(path)) throw new Error(`登録ファイルがありません：${path}`);
    let data: unknown;
    try {
        data = JSON.parse(readFileSync(path, "utf-8"));
    } catch (err) {
        throw new Error(`登録ファイルを JSON として読めません：${(err as Error).message}`);
    }

    const { items, errors } = parseCareerFile(data);
    if (errors.length > 0) {
        console.error(`登録ファイルに直すところがあります（${errors.length} 件）。何も書き込んでいません。`);
        for (const e of errors) console.error(`  - ${e}`);
        process.exit(1);
    }
    const sorted = sortCareer(items);

    const fb = await connect(flags.has("--emulator"));
    const ref = fb.db.collection(CAREER_COLLECTION).doc(CAREER_DOC_ID);
    const current = readCareerDoc((await ref.get()).data());
    const byId = new Map(current.map((item) => [item.id, item]));
    const next = new Set(sorted.map((item) => item.id));

    console.log(`登録ファイル：${path}`);
    console.log(`書き込み先：${fb.target} の ${CAREER_COLLECTION}/${CAREER_DOC_ID}`);
    console.log(`\n項目（${sorted.length} 件・新しい順）`);
    for (const item of sorted) {
        const before = byId.get(item.id);
        const mark = !before ? "＋" : same(before, item) ? "　" : "～";
        console.log(`  ${mark} ${line(item)}`);
    }
    const removed = current.filter((item) => !next.has(item.id));
    for (const item of removed) console.log(`  － ${line(item)}`);
    console.log("\n（＋ 足す　～ 変わる　－ 消す）");

    const changed = sorted.some((item) => !byId.has(item.id) || !same(byId.get(item.id)!, item)) || removed.length > 0;
    if (!changed) {
        console.log("\n登録済みの内容と同じなので、書き込むものはありません。");
        return;
    }
    if (!flags.has("--run")) {
        console.log(`\ndry-run です。${fb.target}に書き込むには --run を付けて実行してください。`);
        return;
    }

    await ref.set({ items: sorted, updatedAt: new Date().toISOString() });
    console.log(`\n${fb.target}に書き込みました。ページには 5 分ほどで出ます：${SITE_URL}/career`);
};

main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
});
