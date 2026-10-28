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

const KNOWN_FLAGS = ["--run", "--emulator"];

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

/**
 * URL を正規化する（/../ や %2e%2e の解決、ホスト名の小文字化）。
 * 確かめる URL と保存する URL を同じにして、確かめたのと違う場所へのリンクが載らないようにする。
 */
const normalizeUrl = (href: string) => {
    if (!href) return href;
    try {
        return new URL(href).href;
    } catch {
        throw new Error(`URL として読めません：${href}`);
    }
};

const parseEntry = (raw: unknown): Entry => {
    if (!isRecord(raw)) throw new Error(`${ENTRY_FILE} の中身がオブジェクトではありません`);

    const id = typeof raw.id === "string" ? raw.id : "";
    if (!isDocId(id)) throw new Error("id は英数字・ハイフン・アンダースコアで書いてください（例：melody-next-note）");
    if (!isPortfolioCategory(raw.category)) {
        throw new Error(`category は ${PORTFOLIO_CATEGORIES.join(" / ")} のどれかにしてください`);
    }
    // 公開するかどうかは書き忘れると困るので、省略を許さない
    if (typeof raw.ready !== "boolean") throw new Error("ready は true（公開）か false（非公開）で書いてください");

    const fields = trimPortfolioFields({
        title: toLocalized(raw.title, "title"),
        caption: raw.caption === undefined ? { ja: "", en: "" } : toLocalized(raw.caption, "caption"),
        href: typeof raw.href === "string" ? raw.href : "",
        ready: raw.ready,
    });
    const fieldError = validatePortfolioFields(fields);
    if (fieldError) throw new Error(fieldError);
    fields.href = normalizeUrl(fields.href);

    if (raw.links !== undefined && !Array.isArray(raw.links)) throw new Error("links は配列で書いてください");
    const links = ((raw.links as unknown[]) ?? []).map((l, i) => {
        if (!isRecord(l)) throw new Error(`links[${i}] は { "label": ..., "href": ... } の形で書いてください`);
        const label = toLocalized(l.label, `links[${i}].label`);
        return { label: { ja: label.ja.trim(), en: label.en.trim() }, href: String(l.href ?? "").trim() };
    });
    const linkError = validatePortfolioLinks(links);
    if (linkError) throw new Error(linkError);
    for (const link of links) link.href = normalizeUrl(link.href);

    // 登録ファイルと同じフォルダの画像だけを許す（../ で別の場所のファイルを公開バケットに上げないため）
    const cover = typeof raw.cover === "string" && raw.cover ? raw.cover : null;
    if (cover && (/[/\\]/.test(cover) || cover.startsWith("."))) {
        throw new Error("cover は登録ファイルと同じフォルダにある画像のファイル名だけを書いてください");
    }
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

const isGitHubHost = (host: string) =>
    host === "github.com" || host.endsWith(".github.com") || host.endsWith("githubusercontent.com");

/** GitHub 上のリポジトリを指す URL なら、その owner/repo を返す（href は normalizeUrl 済みのもの） */
const githubRepoOf = (url: URL): string | null => {
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "github.com" && host !== "raw.githubusercontent.com") return null;
    const [owner, repo] = url.pathname.split("/").filter(Boolean);
    if (!owner || !repo) return null;
    return `${owner}/${repo.replace(/\.git$/, "")}`;
};

const checkLink = async (href: string): Promise<LinkProblem | null> => {
    const url = new URL(href);
    const repo = githubRepoOf(url);
    if (repo) {
        try {
            const isPrivate = gh(["api", `repos/${repo}`, "--jq", ".private"]).toString().trim();
            return isPrivate === "false" ? null : { href, message: "非公開リポジトリです", blocking: true };
        } catch {
            return { href, message: "リポジトリが見つかりません", blocking: true };
        }
    }
    try {
        const res = await fetch(href, { redirect: "follow", signal: AbortSignal.timeout(10_000) });
        return res.ok ? null : { href, message: `開けません（HTTP ${res.status}）`, blocking: true };
    } catch {
        // 接続できないのはネットワーク側の都合（社内・学内の通信の検査など）のこともあるので、止めずに知らせる。
        // ただし GitHub のページは非公開リポジトリの中身の場合があるので、確かめられなければ止める
        return {
            href,
            message: isGitHubHost(url.hostname)
                ? "GitHub のページを確かめられませんでした"
                : "接続できず確認できませんでした。ブラウザで開けるか確かめてください",
            blocking: isGitHubHost(url.hostname),
        };
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

const TOKENS_KEY = "firebaseStorageDownloadTokens";

/**
 * カバー画像を上げ、管理画面（firebase/storage の getDownloadURL）と同じ形の URL を返す。
 * 古いトークンも残しておき、Firestore の保存まで済んだら dropOldTokens で消す
 * （保存に失敗しても、今の coverUrl が切れないようにするため）。
 */
const uploadCover = async ({ bucket }: Firebase, id: string, data: Buffer, fileName: string) => {
    const file = bucket.file(coverPath(id));
    const [exists] = await file.exists();
    const oldTokens = exists ? String((await file.getMetadata())[0].metadata?.[TOKENS_KEY] ?? "") : "";
    const token = randomUUID();

    await file.save(data, {
        contentType: COVER_TYPES[extname(fileName).toLowerCase()],
        metadata: { metadata: { [TOKENS_KEY]: [oldTokens, token].filter(Boolean).join(",") } },
    });
    return {
        url: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(coverPath(id))}?alt=media&token=${token}`,
        dropOldTokens: () => file.setMetadata({ metadata: { [TOKENS_KEY]: token } }),
    };
};

/** 登録ファイルの内容のうち、Firestore に保存する項目 */
const toDoc = (entry: Entry) => ({
    ...toPortfolioDoc(entry.fields),
    links: toPortfolioLinksDoc(entry.links),
    category: entry.category,
});

/** オブジェクトのキーを並べ替えた JSON。Firestore から読んだ map はキーの順番が書いたときと違うことがある */
const stableJson = (value: unknown): string => {
    if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
    if (isRecord(value)) {
        return `{${Object.keys(value)
            .sort()
            .map((k) => `${JSON.stringify(k)}:${stableJson(value[k])}`)
            .join(",")}}`;
    }
    return JSON.stringify(value);
};

/** 比べるときは、未保存・null・空の配列を同じものとみなす（管理画面で作った作品には links が無い） */
const comparable = (value: unknown) =>
    stableJson(value === undefined || (Array.isArray(value) && value.length === 0) ? null : value);

/**
 * いま保存されている値と比べて、変わる項目の名前を返す。
 * 登録済みの作品の公開・非公開（ready）は管理画面で切り替えるので、比べない（書き込みもしない）。
 */
const changedKeys = (current: Record<string, unknown>, next: Record<string, unknown>, exists: boolean) =>
    Object.keys(next)
        .filter((k) => !(exists && k === "ready"))
        .filter((k) => comparable(current[k]) !== comparable(next[k]));

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
    // Storage に同じ画像があっても、coverUrl が空なら付け直す
    const coverChanged =
        coverData !== null && !(snap.exists && current.coverUrl && (await isSameCover(fb, entry.id, coverData)));

    return { entry, exists: snap.exists, changes: changedKeys(current, toDoc(entry), snap.exists), coverData, coverChanged };
};

// ---------------------------------------------------------------- コマンド

const show = (label: string, value: Localized) =>
    console.log(`  ${label}：${value.ja}${value.en ? ` / ${value.en}` : "（英語は日本語で表示）"}`);

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
    console.log(`  id：${entry.id}（${plan.exists ? "登録済み → 更新" : "新規"}）`);
    console.log(`  カテゴリ：${entry.category}`);
    show("タイトル", entry.fields.title);
    if (entry.fields.caption.ja) show("説明文", entry.fields.caption);
    console.log(`  リンク：${entry.fields.href || "なし"}`);
    for (const l of entry.links) console.log(`    ${l.label.ja}：${l.href}`);
    console.log(`  カバー画像：${entry.cover ? `${entry.cover}（${Math.round(plan.coverData!.length / 1024)}KB${plan.coverChanged ? "" : "・変更なし"}）` : "なし"}`);
    console.log(
        plan.exists
            ? "  公開：登録済みなので変えません（公開・非公開は管理画面で切り替えます）"
            : `  公開：${entry.fields.ready ? "する" : "しない（管理画面で確認してから公開）"}`
    );
    console.log(`  公開URL：${SITE_URL}/portfolio?tab=${entry.category}`);

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
    // 登録ファイルの場所（非公開リポジトリのパスやローカルのパス）は、誰でも読めるこのコレクションに保存しない
    const doc: Record<string, unknown> = toDoc(entry);
    if (current) delete doc.ready;

    // 並び順は管理画面と同じく、カテゴリの末尾に足す。登録済みで同じカテゴリなら今の位置を保つ
    if (!current || current.category !== entry.category) {
        const snap = await fb.db.collection(collections.portfolioItems).orderBy("order").get();
        const orders = snap.docs.filter((d) => d.data().category === entry.category).map((d) => d.data().order ?? 0);
        doc.order = orders.length === 0 ? 0 : Math.max(...orders) + 1;
    }
    if (!current) doc.coverUrl = null;
    const cover = plan.coverData && plan.coverChanged ? await uploadCover(fb, entry.id, plan.coverData, entry.cover!) : null;
    if (cover) doc.coverUrl = cover.url;

    await ref.set(doc, { merge: true });
    await cover?.dropOldTokens().catch(() => console.log("注意：古いカバー画像の URL を無効にできませんでした（表示には影響しません）"));
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

    // 打ち間違えたフラグ（--emulater など）を黙って無視すると、本番に書き込んでしまうので止める
    const unknown = Array.from(flags).filter((f) => !KNOWN_FLAGS.includes(f));
    if (unknown.length > 0) {
        console.error(`知らないフラグです：${unknown.join(" ")}（使えるのは ${KNOWN_FLAGS.join(" / ")}）`);
        process.exitCode = 1;
        return;
    }

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
