// scripts/content.ts
//
// /portfolio の作品を、登録ファイル（portfolio.json）から本番の Firestore に登録する。
// 管理画面を開かずに、PoC や Kaggle の成果をまとめて載せるための道具。
// 使い方は README の「登録スクリプトで作品を追加する」を参照。
//
//   npm run content -- pending                 GitHub 上の登録ファイルのうち、未登録・変更ありのものを一覧
//   npm run content -- add <登録ファイルの場所>     1件を確認する（既定は dry-run で、何も書き込まない）
//   npm run content -- add <登録ファイルの場所> --run  1件を本番に書き込む
//
// 登録ファイルの場所は、ローカルのフォルダか portfolio.json、または GitHub 上のフォルダ
// （gh:<リポジトリ名>/<パス>。例：gh:playground/pocs/2026-10-melody-next-note）。
// GitHub からは gh コマンドで読むので、非公開リポジトリでも gh にログインしていれば読める。

import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, extname, join, posix, resolve } from "node:path";
import {
    MAX_COVER_BYTES,
    PortfolioItemFields,
    isDocId,
    isPortfolioCategory,
    toPortfolioDoc,
    toPortfolioLinksDoc,
    trimPortfolioFields,
    validatePortfolioFields,
    validatePortfolioLinks,
} from "../src/lib/content/portfolioItem";
import { PORTFOLIO_CATEGORIES, PortfolioCategory, PortfolioLink, collections } from "../src/lib/content/types";
import type { Localized } from "../src/lib/i18n";

const GITHUB_OWNER = "haruto-kamijo";
const ENTRY_FILE = "portfolio.json";
const SITE_URL = "https://kamijoharuto.com";

/** pending で探すリポジトリ。PoC は playground、Kaggle は kaggle に登録ファイルを置く */
const ENTRY_REPOS = ["playground", "kaggle"];

const COVER_TYPES: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
};

// ---------------------------------------------------------------- 登録ファイルの読み込み

type Entry = {
    id: string;
    category: PortfolioCategory;
    fields: PortfolioItemFields;
    links: PortfolioLink[];
    /** 登録ファイルと同じフォルダからの相対パス */
    cover: string | null;
};

/** 登録ファイルの置き場所。ローカルでも GitHub でも同じように読めるようにする */
type Source = {
    label: string;
    read: (relativePath: string) => Buffer;
};

const encodePath = (path: string) => path.split("/").map(encodeURIComponent).join("/");

// gh のエラー表示（Not Found など）はこちらで日本語のメッセージにするので、そのままは出さない
const gh = (args: string[]) =>
    execFileSync("gh", args, { maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });

const githubSource = (repo: string, dir: string): Source => ({
    label: `gh:${repo}/${dir}`,
    read: (relativePath) =>
        gh([
            "api",
            "-H",
            "Accept: application/vnd.github.raw",
            `repos/${GITHUB_OWNER}/${repo}/contents/${encodePath(posix.join(dir, relativePath))}`,
        ]),
});

const localSource = (dir: string): Source => ({
    label: dir,
    read: (relativePath) => readFileSync(join(dir, relativePath)),
});

const parseSource = (arg: string): Source => {
    const github = arg.match(/^gh:([^/]+)\/(.+?)\/?$/);
    if (github) {
        const [, repo, path] = github;
        return githubSource(repo, path.endsWith(ENTRY_FILE) ? posix.dirname(path) : path);
    }
    const path = resolve(arg);
    return localSource(existsSync(path) && statSync(path).isDirectory() ? path : dirname(path));
};

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

const toLocalized = (v: unknown, name: string): Localized => {
    if (typeof v === "string") return { ja: v, en: "" };
    if (!isRecord(v) || typeof v.ja !== "string") throw new Error(`${name} は { "ja": "...", "en": "..." } の形で書いてください`);
    return { ja: v.ja, en: typeof v.en === "string" ? v.en : "" };
};

const parseEntry = (raw: unknown): Entry => {
    if (!isRecord(raw)) throw new Error(`${ENTRY_FILE} の中身がオブジェクトではありません`);

    const id = typeof raw.id === "string" ? raw.id : "";
    if (!isDocId(id)) throw new Error("id は英数字・ハイフン・アンダースコアで書いてください（例：melody-next-note）");
    if (!isPortfolioCategory(raw.category)) {
        throw new Error(`category は ${PORTFOLIO_CATEGORIES.join(" / ")} のどれかにしてください`);
    }

    const fields = trimPortfolioFields({
        title: toLocalized(raw.title, "title"),
        caption: raw.caption === undefined ? { ja: "", en: "" } : toLocalized(raw.caption, "caption"),
        href: typeof raw.href === "string" ? raw.href : "",
        ready: raw.ready !== false,
    });
    const fieldError = validatePortfolioFields(fields);
    if (fieldError) throw new Error(fieldError);

    if (raw.links !== undefined && !Array.isArray(raw.links)) throw new Error("links は配列で書いてください");
    const links = ((raw.links as unknown[]) ?? []).map((l, i) => {
        if (!isRecord(l)) throw new Error(`links[${i}] は { "label": ..., "href": ... } の形で書いてください`);
        const label = toLocalized(l.label, `links[${i}].label`);
        return { label: { ja: label.ja.trim(), en: label.en.trim() }, href: String(l.href ?? "").trim() };
    });
    const linkError = validatePortfolioLinks(links);
    if (linkError) throw new Error(linkError);

    const cover = typeof raw.cover === "string" && raw.cover ? raw.cover : null;
    if (cover && !COVER_TYPES[extname(cover).toLowerCase()]) {
        throw new Error(`cover は ${Object.keys(COVER_TYPES).join(" / ")} の画像にしてください`);
    }

    return { id, category: raw.category, fields, links, cover };
};

const loadEntry = (source: Source): Entry => {
    let text: string;
    try {
        text = source.read(ENTRY_FILE).toString("utf8");
    } catch {
        throw new Error(`${source.label} に ${ENTRY_FILE} が見つかりません`);
    }
    try {
        return parseEntry(JSON.parse(text));
    } catch (err) {
        throw new Error(`${source.label}/${ENTRY_FILE}: ${(err as Error).message}`);
    }
};

// ---------------------------------------------------------------- 公開前のチェック

/**
 * 載せるリンクが外から開けるか調べる。
 * playground や kaggle は非公開リポジトリなので、うっかりそこへのリンクを載せないよう
 * GitHub のリポジトリは公開設定を gh で確かめる。
 */
type LinkProblem = { href: string; message: string; blocking: boolean };

const checkLink = async (href: string): Promise<LinkProblem | null> => {
    const repo = href.match(/^https:\/\/github\.com\/([^/]+)\/([^/#?]+)/);
    if (repo) {
        try {
            const isPrivate = gh(["api", `repos/${repo[1]}/${repo[2]}`, "--jq", ".private"]).toString().trim();
            return isPrivate === "false" ? null : { href, message: "非公開リポジトリです", blocking: true };
        } catch {
            return { href, message: "リポジトリが見つかりません", blocking: true };
        }
    }
    try {
        const res = await fetch(href, { redirect: "follow", signal: AbortSignal.timeout(10_000) });
        return res.ok ? null : { href, message: `開けません（HTTP ${res.status}）`, blocking: true };
    } catch {
        // 接続できないのはネットワーク側の都合（社内・学内の通信の検査など）のこともあるので、止めずに知らせる
        return { href, message: "接続できず確認できませんでした。ブラウザで開けるか確かめてください", blocking: false };
    }
};

const checkLinks = async (entry: Entry) => {
    const hrefs = [entry.fields.href, ...entry.links.map((l) => l.href)].filter(Boolean);
    const results = await Promise.all(hrefs.map(checkLink));
    return results.filter((r): r is LinkProblem => r !== null);
};

// ---------------------------------------------------------------- Firebase

/**
 * 本番の Firestore / Storage に繋ぐ。
 * 鍵ファイルは置かず、gcloud auth application-default login で作られる認証情報を使う。
 */
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
    const { getAdminBucket, getAdminDb } = await import("../src/lib/firebase/admin");
    const db = getAdminDb();
    const bucket = getAdminBucket();
    if (!db || !bucket) throw new Error("Firebase に接続できません。.env.local の FIREBASE_PROJECT_ID などを確認してください");
    return { db, bucket, target: useEmulator ? "エミュレータ" : `本番（${process.env.FIREBASE_PROJECT_ID}）` };
};

type Firebase = Awaited<ReturnType<typeof connect>>;

const coverPath = (id: string) => `portfolioItems/${id}/cover`;
const md5 = (data: Buffer) => createHash("md5").update(data).digest("base64");

/** Storage 上のカバー画像と同じ中身か。管理画面から差し替えた画像とも比べられるよう、Storage の md5 を見る */
const isSameCover = async ({ bucket }: Firebase, id: string, data: Buffer) => {
    const [exists] = await bucket.file(coverPath(id)).exists();
    if (!exists) return false;
    const [meta] = await bucket.file(coverPath(id)).getMetadata();
    return meta.md5Hash === md5(data);
};

/** 管理画面（firebase/storage の getDownloadURL）と同じ形の URL にする */
const uploadCover = async ({ bucket }: Firebase, id: string, data: Buffer, fileName: string) => {
    const token = randomUUID();
    await bucket.file(coverPath(id)).save(data, {
        contentType: COVER_TYPES[extname(fileName).toLowerCase()],
        metadata: { metadata: { firebaseStorageDownloadTokens: token } },
    });
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(coverPath(id))}?alt=media&token=${token}`;
};

/** 登録ファイルの内容のうち、Firestore に保存する項目 */
const toDoc = (entry: Entry) => ({
    ...toPortfolioDoc(entry.fields),
    links: toPortfolioLinksDoc(entry.links),
    category: entry.category,
});

/** いま保存されている値と比べて、変わる項目の名前を返す */
const changedKeys = (current: Record<string, unknown>, next: Record<string, unknown>) =>
    Object.keys(next).filter((k) => JSON.stringify(current[k] ?? null) !== JSON.stringify(next[k] ?? null));

type Plan = {
    entry: Entry;
    exists: boolean;
    changes: string[];
    coverData: Buffer | null;
    coverChanged: boolean;
};

const planEntry = async (fb: Firebase, source: Source, entry = loadEntry(source)): Promise<Plan> => {
    const snap = await fb.db.collection(collections.portfolioItems).doc(entry.id).get();
    const current = snap.data() ?? {};

    let coverData: Buffer | null = null;
    if (entry.cover) {
        try {
            coverData = source.read(entry.cover);
        } catch {
            throw new Error(`${source.label}/${entry.cover} が見つかりません`);
        }
        if (coverData.length > MAX_COVER_BYTES) throw new Error(`カバー画像は ${MAX_COVER_BYTES / 1024 / 1024}MB 以下にしてください`);
    }
    const coverChanged = coverData !== null && !(snap.exists && (await isSameCover(fb, entry.id, coverData)));

    return { entry, exists: snap.exists, changes: changedKeys(current, toDoc(entry)), coverData, coverChanged };
};

// ---------------------------------------------------------------- コマンド

const show = (label: string, value: Localized) =>
    console.log(`  ${label.padEnd(8)} ${value.ja}${value.en ? ` / ${value.en}` : "（英語は日本語で表示）"}`);

const add = async (arg: string, run: boolean, useEmulator: boolean) => {
    // 登録ファイルとリンクの確認は Firebase に繋ぐ前に済ませる（認証なしでも書き方の誤りが分かる）
    const source = parseSource(arg);
    const entry = loadEntry(source);
    const problems = await checkLinks(entry);
    for (const p of problems.filter((p) => !p.blocking)) console.log(`注意：${p.href} … ${p.message}`);
    const blocking = problems.filter((p) => p.blocking);
    if (blocking.length > 0) {
        console.log(`\n${source.label}\nリンクに問題があります。公開してあるものだけを載せてください：`);
        for (const p of blocking) console.log(`  ${p.href} … ${p.message}`);
        process.exitCode = 1;
        return;
    }

    const fb = await connect(useEmulator);
    const plan = await planEntry(fb, source, entry);

    console.log(`\n${source.label}`);
    console.log(`  id       ${entry.id}（${plan.exists ? "登録済み → 更新" : "新規"}）`);
    console.log(`  カテゴリ   ${entry.category}`);
    show("タイトル", entry.fields.title);
    if (entry.fields.caption.ja) show("説明文", entry.fields.caption);
    console.log(`  リンク     ${entry.fields.href || "なし"}`);
    for (const l of entry.links) console.log(`             ${l.label.ja}: ${l.href}`);
    console.log(`  カバー画像  ${entry.cover ? `${entry.cover}（${Math.round(plan.coverData!.length / 1024)}KB${plan.coverChanged ? "" : "・変更なし"}）` : "なし"}`);
    console.log(`  公開      ${entry.fields.ready ? "する" : "しない（管理画面で確認してから公開）"}`);
    console.log(`  公開URL   ${SITE_URL}/portfolio?tab=${entry.category}`);

    if (plan.exists && plan.changes.length === 0 && !plan.coverChanged) {
        console.log("\n登録済みの内容と同じなので、書き込むものはありません。");
        return;
    }
    if (plan.exists) {
        console.log(`\n変わる項目：${[...plan.changes, ...(plan.coverChanged ? ["カバー画像"] : [])].join(", ")}`);
    }

    if (!run) {
        console.log(`\ndry-run です。${fb.target}に書き込むには --run を付けて実行してください。`);
        return;
    }

    const ref = fb.db.collection(collections.portfolioItems).doc(entry.id);
    const current = (await ref.get()).data();
    const doc: Record<string, unknown> = { ...toDoc(entry), source: source.label };

    // 並び順は管理画面と同じく、カテゴリの末尾に足す。登録済みで同じカテゴリなら今の位置を保つ
    if (!current || current.category !== entry.category) {
        const snap = await fb.db.collection(collections.portfolioItems).orderBy("order").get();
        const orders = snap.docs.filter((d) => d.data().category === entry.category).map((d) => d.data().order ?? 0);
        doc.order = orders.length === 0 ? 0 : Math.max(...orders) + 1;
    }
    if (!current) doc.coverUrl = null;
    if (plan.coverData && plan.coverChanged) doc.coverUrl = await uploadCover(fb, entry.id, plan.coverData, entry.cover!);

    await ref.set(doc, { merge: true });
    console.log(`\n${fb.target}に書き込みました。${SITE_URL}/portfolio?tab=${entry.category} で確認できます。`);
};

/** GitHub 上の登録ファイルを探し、未登録・変更ありのものを一覧にする */
const pending = async (useEmulator: boolean) => {
    const fb = await connect(useEmulator);
    let found = 0;

    for (const repo of ENTRY_REPOS) {
        let paths: string[];
        try {
            const tree = JSON.parse(gh(["api", `repos/${GITHUB_OWNER}/${repo}/git/trees/HEAD?recursive=1`]).toString());
            paths = (tree.tree as { path: string; type: string }[])
                .filter((t) => t.type === "blob" && t.path.split("/").pop() === ENTRY_FILE)
                .map((t) => posix.dirname(t.path));
        } catch {
            console.log(`${repo}: 読めませんでした（gh にログインしているか確認してください）`);
            continue;
        }

        for (const dir of paths) {
            found += 1;
            const source = githubSource(repo, dir);
            try {
                const plan = await planEntry(fb, source);
                const status = !plan.exists
                    ? "新規"
                    : plan.changes.length > 0 || plan.coverChanged
                      ? "変更あり"
                      : "登録済み";
                console.log(`${status.padEnd(5)} ${source.label}  ${plan.entry.fields.title.ja}`);
            } catch (err) {
                console.log(`エラー  ${source.label}  ${(err as Error).message}`);
            }
        }
    }

    if (found === 0) console.log(`${ENTRY_REPOS.join(" / ")} に ${ENTRY_FILE} はまだありません。`);
    else console.log("\n登録するときは npm run content -- add <上の gh:...> で中身を確認し、--run で書き込みます。");
};

const main = async () => {
    const args = process.argv.slice(2);
    const flags = new Set(args.filter((a) => a.startsWith("--")));
    const [command, target] = args.filter((a) => !a.startsWith("--"));
    const useEmulator = flags.has("--emulator");

    if (command === "pending") return pending(useEmulator);
    if (command === "add" && target) return add(target, flags.has("--run"), useEmulator);

    console.log(
        [
            "使い方：",
            "  npm run content -- pending",
            "  npm run content -- add <フォルダ | portfolio.json | gh:<リポジトリ>/<パス>> [--run]",
            "  （--emulator を付けると、本番ではなくローカルのエミュレータに繋ぐ）",
        ].join("\n")
    );
    process.exitCode = 1;
};

main().catch((err) => {
    console.error(`\nエラー：${(err as Error).message}`);
    process.exitCode = 1;
});
