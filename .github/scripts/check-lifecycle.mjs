// .github/scripts/check-lifecycle.mjs
//
// サポート期限が近いもの・切れたものを確かめる（lifecycle.yml から毎週動かす）。
//
//   - Cloud Functions の Node のランタイム（portfolio/package.json の engines.node）
//     期限は firebase-tools の対応表（deprecationDate / decommissionDate）から読む。
//     最新版の表で期限を見て、deploy.yml で固定している版の表にその Node が入っているかも見る。
//     2026-10-30 に Node 20 の提供が終わってデプロイが止まったことがあり、その再発を防ぐため
//   - Node.js そのもののサポート期限（endoflife.date）
//   - Next.js のサポート期限と、同じ系列の新しいパッチ（endoflife.date）
//   - deploy.yml で固定している firebase-tools の版が、最新からメジャーで遅れていないか
//
// 対応が必要なものがあれば、ラベル lifecycle の Issue を1つ作る。開いていれば本文を書き換え、
// 状態が変わったもの（新しく出た・重くなった）があるときはコメントも付けて通知が届くようにする。
// 対応が必要なものが無くなったら閉じる。DRY_RUN=1 のときは結果を出すだけで Issue は触らない（PR で動かすとき）。
//
// 外から取ってきたコード（firebase-tools）は実行せず、テキストとして読む。
// 情報を読めなかったときも黙って止まらず、「読めなかった」を要対応として Issue に出す。

import { execFile } from "node:child_process";
import { appendFileSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

/** これより先の期限は「まだ大丈夫」とみなす。半年あれば、ゆとりを持って移行できる */
const WARN_DAYS = 180;
const ISSUE_TITLE = "サポート期限の確認：対応が必要なものがあります";
const ISSUE_LABEL = "lifecycle";
const DRY_RUN = process.env.DRY_RUN === "1";

const run = async (cmd, args, opts = {}) => (await promisify(execFile)(cmd, args, { encoding: "utf8", ...opts })).stdout.trim();

const today = new Date();
const daysUntil = (date) => Math.ceil((new Date(date).getTime() - today.getTime()) / 86_400_000);
const when = (date) => (date ? `${date}（${daysUntil(date) > 0 ? `あと ${daysUntil(date)} 日` : `${-daysUntil(date)} 日前に終了`}）` : "未定");

/** YYYY-MM-DD の形で、暦にある日か（2028-13-31 などを弾く） */
const isValidDate = (date) =>
    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;

/** 期限の近さで、要対応（error）・注意（warn）・問題なし（ok）に分ける。読めない日付は「問題なし」に倒さず注意にする */
const levelFor = (date) => {
    if (!date) return "ok";
    if (!isValidDate(date)) return "warn";
    const days = daysUntil(date);
    if (days <= 0) return "error";
    return days <= WARN_DAYS ? "warn" : "ok";
};

/** endoflife.date の eol は日付か true / false。true は「終了済みで日付なし」 */
const eolLevel = (eol) => (eol === true ? "error" : typeof eol === "string" ? levelFor(eol) : "ok");
const eolText = (eol) => (eol === true ? "終了済み" : typeof eol === "string" ? when(eol) : "未定");

/** 1.2.3 どうしを数で比べる（a が新しければ正）。区切りの数が違っても、すべての桁を見る */
const compareVersions = (a, b) => {
    const [x, y] = [a, b].map((v) => v.split(".").map(Number));
    for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0);
    return 0;
};

/** @type {{ level: "error" | "warn" | "ok"; name: string; detail: string; action?: string }[]} */
const findings = [];
const unreadable = (name, err) =>
    findings.push({
        level: "error",
        name,
        detail: `情報を読めなかった：${String(err?.message ?? err).split("\n")[0]}`,
        action: "ワークフローのログを確かめる（取得先の形が変わったなど）",
    });

// ---- このリポジトリの今の状態 ----

const pkg = JSON.parse(readFileSync("portfolio/package.json", "utf8"));
const lock = JSON.parse(readFileSync("portfolio/package-lock.json", "utf8"));
const nodeMajor = String(pkg.engines?.node ?? "").match(/\d+/)?.[0];
const nextVersion = lock.packages?.["node_modules/next"]?.version;
const pinnedFirebaseTools = readFileSync(".github/workflows/deploy.yml", "utf8").match(/firebase-tools@(\d+\.\d+\.\d+)/)?.[1];

// ---- 外の情報 ----

/**
 * firebase-tools の指定の版を取ってきて、Cloud Functions のランタイムの表を読む。
 * 中身のコードは実行せず（同じプロセスに GitHub のトークンがあるため）、テキストから nodejsNN と日付を取り出す
 */
const readRuntimeTable = async (spec) => {
    const dir = mkdtempSync(join(tmpdir(), "firebase-tools-"));
    // Windows の npm は .cmd なので shell を通す（引数に空白は無い）
    // npm が応答しないままジョブの制限時間まで待つと、「読めなかった」を Issue に出す前に止まるので、2分で打ち切る
    const packed = JSON.parse(
        await run("npm", ["pack", spec, "--json", "--pack-destination", dir], { shell: process.platform === "win32", timeout: 120_000 })
    )[0];
    // 絶対パスを渡すと、Windows の GNU tar が「C:」を接続先のホスト名と読むので、その場所で相対パスで展開する
    await run("tar", ["-xzf", packed.filename], { cwd: dir, timeout: 60_000 });
    const source = readFileSync(join(dir, "package", "lib", "deploy", "functions", "runtimes", "supported", "types.js"), "utf8");
    const runtimes = {};
    for (const [, name, body] of source.matchAll(/\b(nodejs\d+):\s*\{([^}]*)\}/g)) {
        runtimes[name] = {
            deprecationDate: body.match(/deprecationDate:\s*"([\d-]+)"/)?.[1],
            decommissionDate: body.match(/decommissionDate:\s*"([\d-]+)"/)?.[1],
        };
    }
    if (Object.keys(runtimes).length === 0) throw new Error(`firebase-tools ${packed.version} の対応表から Node の版を読めませんでした`);
    return { version: packed.version, runtimes };
};

/**
 * endoflife.date の系列の一覧を読む。形が想定と違えば例外にして、「読めなかった」として出す
 * （eol や latest が欠けたまま判定すると、黙って「問題なし」になったり、パッチの知らせが出なくなったりするため）
 */
const getCycles = async (url) => {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`${url} を読めませんでした（HTTP ${res.status}）`);
    const cycles = await res.json();
    if (!Array.isArray(cycles) || cycles.length === 0) throw new Error(`${url} の応答が系列の一覧ではありませんでした`);
    for (const c of cycles) {
        const ok =
            (typeof c?.cycle === "string" || typeof c?.cycle === "number") &&
            (typeof c.eol === "boolean" || isValidDate(c.eol)) &&
            typeof c.latest === "string" &&
            /^\d+(\.\d+)*$/.test(c.latest);
        if (!ok) throw new Error(`${url} の系列 ${c?.cycle ?? "?"} の形が想定と違いました`);
    }
    return cycles;
};

const settle = async (fn) => {
    try {
        return { value: await fn() };
    } catch (error) {
        return { error };
    }
};
// 順番に読む（npm pack の待ち時間で、fetch のタイムアウトを使い切らないように）
const latestTable = await settle(() => readRuntimeTable("firebase-tools@latest"));
const pinnedTable = pinnedFirebaseTools ? await settle(() => readRuntimeTable(`firebase-tools@${pinnedFirebaseTools}`)) : null;
const nodeCycles = await settle(() => getCycles("https://endoflife.date/api/nodejs.json"));
const nextCycles = await settle(() => getCycles("https://endoflife.date/api/nextjs.json"));

// ---- 確かめる ----

// Cloud Functions の Node のランタイム
const runtimeName = `Cloud Functions の Node ${nodeMajor ?? "?"}`;
if (!nodeMajor) {
    findings.push({ level: "error", name: runtimeName, detail: "portfolio/package.json に engines.node が無い", action: "engines.node を書く" });
} else if (latestTable.error) {
    unreadable(runtimeName, latestTable.error);
} else {
    const runtime = latestTable.value.runtimes[`nodejs${nodeMajor}`];
    if (!runtime) {
        findings.push({
            level: "error",
            name: runtimeName,
            detail: `firebase-tools ${latestTable.value.version} の対応表に nodejs${nodeMajor} が無い`,
            action: "engines.node を Cloud Functions が対応している版にする",
        });
    } else if (!isValidDate(runtime.deprecationDate) || !isValidDate(runtime.decommissionDate)) {
        // 日付を読めない・暦に無い日だと期限の判定が狂うので、読めなかったものとして出す
        unreadable(runtimeName, new Error(`firebase-tools ${latestTable.value.version} の対応表から nodejs${nodeMajor} の期限を読めませんでした`));
    } else {
        // 提供終了の日を過ぎたら要対応。非推奨の期間に入ったか、提供終了が近ければ注意
        const decommission = levelFor(runtime.decommissionDate);
        const deprecation = levelFor(runtime.deprecationDate);
        const level = decommission === "error" ? "error" : decommission === "warn" || deprecation !== "ok" ? "warn" : "ok";
        findings.push({
            level,
            name: runtimeName,
            detail: `非推奨 ${when(runtime.deprecationDate)}・提供終了 ${when(runtime.decommissionDate)}。提供終了の日を過ぎるとデプロイが止まる`,
            action:
                level === "ok" ? undefined : "portfolio/package.json の engines.node を新しい版に上げる（deploy.yml・e2e.yml もここから版を読む）",
        });
    }
}

// deploy.yml の firebase-tools
const pinnedName = `firebase-tools ${pinnedFirebaseTools ?? "?"}（deploy.yml）`;
if (!pinnedFirebaseTools) {
    findings.push({ level: "warn", name: pinnedName, detail: "deploy.yml から firebase-tools の版を読めない", action: "deploy.yml の書き方を確かめる" });
} else if (pinnedTable.error) {
    unreadable(pinnedName, pinnedTable.error);
} else if (nodeMajor && !pinnedTable.value.runtimes[`nodejs${nodeMajor}`]) {
    // 固定している版が engines.node の Node を知らないと、デプロイで失敗する
    findings.push({
        level: "error",
        name: pinnedName,
        detail: `この版の対応表に nodejs${nodeMajor} が無い（engines.node の版でデプロイできない）`,
        action: "deploy.yml の firebase-tools の版を上げる",
    });
} else if (!latestTable.error) {
    const behind = Number(latestTable.value.version.split(".")[0]) - Number(pinnedFirebaseTools.split(".")[0]);
    findings.push({
        level: behind >= 1 ? "warn" : "ok",
        name: pinnedName,
        detail: `最新は ${latestTable.value.version}`,
        action: behind >= 1 ? "deploy.yml の firebase-tools の版を上げる（Dependabot は run の中の版を更新しない）" : undefined,
    });
}

// Node.js そのもの
if (nodeMajor) {
    if (nodeCycles.error) {
        unreadable(`Node.js ${nodeMajor}`, nodeCycles.error);
    } else {
        const cycle = nodeCycles.value.find((c) => String(c.cycle) === nodeMajor);
        if (!cycle) {
            findings.push({ level: "warn", name: `Node.js ${nodeMajor}`, detail: "endoflife.date にこの系列が無い", action: "取得先の形が変わっていないか確かめる" });
        } else {
            // 実行環境の期限は Cloud Functions の行で見ているので、こちらは注意までにする
            const level = eolLevel(cycle.eol) === "ok" ? "ok" : "warn";
            findings.push({
                level,
                name: `Node.js ${nodeMajor}`,
                detail: `セキュリティ修正の終了 ${eolText(cycle.eol)}`,
                action: level === "ok" ? undefined : "engines.node を次の LTS に上げる準備をする",
            });
        }
    }
}

// Next.js
if (!nextVersion) {
    findings.push({ level: "warn", name: "Next.js", detail: "portfolio/package-lock.json に next が無い", action: "lock を確かめる" });
} else if (nextCycles.error) {
    unreadable(`Next.js ${nextVersion}`, nextCycles.error);
} else {
    const major = nextVersion.split(".")[0];
    const cycles = nextCycles.value;
    const cycle = cycles.find((c) => String(c.cycle) === major);
    const newest = cycles.find((c) => c.eol === false)?.cycle ?? cycles[0]?.cycle;
    if (!cycle) {
        findings.push({ level: "warn", name: `Next.js ${major}`, detail: "endoflife.date にこの系列が無い", action: "取得先の形が変わっていないか確かめる" });
    } else {
        const level = eolLevel(cycle.eol) === "ok" ? "ok" : "warn";
        findings.push({
            level,
            name: `Next.js ${major}`,
            detail: `サポート終了 ${eolText(cycle.eol)}。最新のメジャーは ${newest}`,
            action: level === "ok" ? undefined : `Next.js ${newest} への移行を計画する`,
        });
        if (cycle.latest && compareVersions(cycle.latest, nextVersion) > 0) {
            findings.push({
                level: "warn",
                name: `Next.js ${nextVersion}`,
                detail: `同じ ${major} 系に ${cycle.latest} が出ている（不具合・セキュリティの修正を含むことがある）`,
                action: `next と eslint-config-next を ${cycle.latest} に上げる（Dependabot の PR があればそれをマージ）`,
            });
        }
    }
}

// ---- 出力 ----

const MARK = { error: "🔴 要対応", warn: "🟡 注意", ok: "🟢 問題なし" };
const ORDER = { error: 0, warn: 1, ok: 2 };
findings.sort((a, b) => ORDER[a.level] - ORDER[b.level]);

/** 表の中で | があると列がずれるので、外から読んだ値も含めて置き換える */
const cell = (s) => String(s ?? "—").replace(/\|/g, "／").replace(/\n/g, " ");
const state = Object.fromEntries(findings.map((f) => [f.name, f.level]));
const report = [
    `${today.toISOString().slice(0, 10)}（UTC）の確認結果。期限まで ${WARN_DAYS} 日を切ったものを「注意」にしている。`,
    "",
    "| 状態 | 対象 | 内容 | すること |",
    "|---|---|---|---|",
    ...findings.map((f) => `| ${MARK[f.level]} | ${cell(f.name)} | ${cell(f.detail)} | ${cell(f.action)} |`),
    "",
    "このIssueは `.github/workflows/lifecycle.yml` が毎週月曜に更新する。状態が変わったものがあるときはコメントで知らせ、対応が必要なものが無くなると閉じる。",
    `<!-- lifecycle-state: ${JSON.stringify(state)} -->`,
].join("\n");

console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);

const needsAction = findings.some((f) => f.level !== "ok");

if (DRY_RUN) {
    console.log(`\n（DRY_RUN のため Issue は触らない。対応が必要なもの：${needsAction ? "あり" : "なし"}）`);
} else {
    // タイトルの全文検索は日本語で外れることがあるので、ラベルで探してタイトルを手元で比べる
    await run("gh", ["label", "create", ISSUE_LABEL, "--force", "--color", "d4c5f9", "--description", "サポート期限の確認（lifecycle.yml）"]);
    const open = JSON.parse(await run("gh", ["issue", "list", "--state", "open", "--label", ISSUE_LABEL, "--json", "number,title,body"])).find(
        (i) => i.title === ISSUE_TITLE
    );
    const tmp = mkdtempSync(join(tmpdir(), "lifecycle-"));
    const bodyFile = join(tmp, "body.md");
    writeFileSync(bodyFile, report);

    if (needsAction && open) {
        await run("gh", ["issue", "edit", String(open.number), "--body-file", bodyFile]);
        // 本文の書き換えだけでは通知が届かないので、前回より重くなったもの・新しく出たものがあればコメントする
        const previous = JSON.parse(open.body.match(/<!-- lifecycle-state: (.*) -->/)?.[1] ?? "{}");
        const changed = findings.filter((f) => f.level !== "ok" && previous[f.name] !== f.level);
        if (changed.length > 0) {
            const commentFile = join(tmp, "comment.md");
            writeFileSync(
                commentFile,
                ["前回の確認から変わったものがあります。", "", ...changed.map((f) => `- ${MARK[f.level]} ${f.name}：${f.detail}`)].join("\n")
            );
            await run("gh", ["issue", "comment", String(open.number), "--body-file", commentFile]);
        }
        console.log(`Issue #${open.number} を更新した（変わったもの ${changed.length} 件）`);
    } else if (needsAction) {
        console.log(await run("gh", ["issue", "create", "--title", ISSUE_TITLE, "--label", ISSUE_LABEL, "--body-file", bodyFile]));
    } else if (open) {
        // 閉じる前に、問題が無くなった週の結果を本文に残す
        await run("gh", ["issue", "edit", String(open.number), "--body-file", bodyFile]);
        await run("gh", ["issue", "close", String(open.number), "--comment", "対応が必要なものは無くなりました。"]);
        console.log(`Issue #${open.number} を閉じた`);
    }
}
