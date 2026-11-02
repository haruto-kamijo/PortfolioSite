// .github/scripts/check-lifecycle.mjs
//
// サポート期限が近いもの・切れたものを確かめる（lifecycle.yml から毎週動かす）。
//
//   - Cloud Functions の Node のランタイム（portfolio/package.json の engines.node）
//     期限は firebase-tools の最新版が持つ表（deprecationDate / decommissionDate）から読む。
//     2026-10-30 に Node 20 の提供が終わってデプロイが止まったことがあり、その再発を防ぐため
//   - Node.js そのもののサポート期限（endoflife.date）
//   - Next.js のサポート期限と、同じ系列の新しいパッチ（endoflife.date）
//   - deploy.yml で固定している firebase-tools の版が、最新からメジャーで遅れていないか
//
// 対応が要るものがあれば Issue を1つ作り（あれば本文を書き換え）、無くなったら閉じる。
// DRY_RUN=1 のときは結果を出すだけで Issue は触らない（PR で動かすとき）。

import { execFileSync } from "node:child_process";
import { appendFileSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** これより先の期限は「まだ大丈夫」とみなす。半年あれば、ゆとりを持って移行できる */
const WARN_DAYS = 180;
const ISSUE_TITLE = "サポート期限の確認：対応が必要なものがあります";
const DRY_RUN = process.env.DRY_RUN === "1";

const today = new Date();
const daysUntil = (date) => Math.ceil((new Date(date).getTime() - today.getTime()) / 86_400_000);

/** 期限の近さで、要対応（error）・注意（warn）・問題なし（ok）に分ける */
const levelFor = (date) => {
    if (!date) return "ok";
    const days = daysUntil(date);
    if (days <= 0) return "error";
    return days <= WARN_DAYS ? "warn" : "ok";
};

const getJson = async (url) => {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`${url} を読めませんでした（HTTP ${res.status}）`);
    return res.json();
};

const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: "utf8", ...opts }).trim();

// ---- このリポジトリの今の状態 ----

const pkg = JSON.parse(readFileSync("portfolio/package.json", "utf8"));
const lock = JSON.parse(readFileSync("portfolio/package-lock.json", "utf8"));
const nodeMajor = String(pkg.engines?.node ?? "").match(/\d+/)?.[0];
if (!nodeMajor) throw new Error("portfolio/package.json に engines.node がありません");
const nextVersion = lock.packages?.["node_modules/next"]?.version;
if (!nextVersion) throw new Error("portfolio/package-lock.json に next がありません");
const pinnedFirebaseTools = readFileSync(".github/workflows/deploy.yml", "utf8").match(/firebase-tools@(\d+\.\d+\.\d+)/)?.[1];

// ---- 外の情報 ----

/** firebase-tools の最新版を取ってきて、Cloud Functions のランタイムの表を読む */
const loadFunctionsRuntimes = () => {
    const dir = mkdtempSync(join(tmpdir(), "firebase-tools-"));
    const file = sh("npm", ["pack", "firebase-tools@latest", "--silent", "--pack-destination", dir], {
        shell: process.platform === "win32",
    })
        .split("\n")
        .pop();
    // 絶対パスを渡すと、Windows の GNU tar が「C:」を接続先のホスト名と読むので、その場所で相対パスで展開する
    sh("tar", ["-xzf", file], { cwd: dir });
    const version = JSON.parse(readFileSync(join(dir, "package", "package.json"), "utf8")).version;
    const require = createRequire(join(dir, "package", "package.json"));
    const { RUNTIMES } = require("./lib/deploy/functions/runtimes/supported/types.js");
    return { version, runtimes: RUNTIMES };
};

const [{ version: latestFirebaseTools, runtimes }, nodeCycles, nextCycles] = await Promise.all([
    Promise.resolve().then(loadFunctionsRuntimes),
    getJson("https://endoflife.date/api/nodejs.json"),
    getJson("https://endoflife.date/api/nextjs.json"),
]);

// ---- 確かめる ----

/** @type {{ level: "error" | "warn" | "ok"; name: string; detail: string; action?: string }[]} */
const findings = [];
const when = (date) => (date ? `${date}（${daysUntil(date) > 0 ? `あと ${daysUntil(date)} 日` : `${-daysUntil(date)} 日前に終了`}）` : "未定");

// Cloud Functions の Node のランタイム
const runtime = runtimes[`nodejs${nodeMajor}`];
if (!runtime) {
    findings.push({
        level: "error",
        name: `Cloud Functions の Node ${nodeMajor}`,
        detail: `firebase-tools ${latestFirebaseTools} の対応表に nodejs${nodeMajor} がありません`,
        action: "engines.node を Cloud Functions が対応している版にする",
    });
} else {
    // 提供終了の日を過ぎたら要対応。非推奨の期間に入ったか、提供終了が近ければ注意
    const decommission = levelFor(runtime.decommissionDate);
    const deprecation = levelFor(runtime.deprecationDate);
    const level = decommission === "error" ? "error" : decommission === "warn" || deprecation !== "ok" ? "warn" : "ok";
    findings.push({
        level,
        name: `Cloud Functions の Node ${nodeMajor}`,
        detail: `非推奨 ${when(runtime.deprecationDate)}・提供終了 ${when(runtime.decommissionDate)}。提供終了の日を過ぎるとデプロイが止まる`,
        action: level === "ok" ? undefined : "portfolio/package.json の engines.node を新しい版に上げる（deploy.yml・e2e.yml もここから版を読む）",
    });
}

// Node.js そのもの
const nodeCycle = nodeCycles.find((c) => c.cycle === nodeMajor);
if (nodeCycle && typeof nodeCycle.eol === "string") {
    const level = levelFor(nodeCycle.eol);
    findings.push({
        level: level === "error" ? "warn" : level,
        name: `Node.js ${nodeMajor}`,
        detail: `セキュリティ修正の終了 ${when(nodeCycle.eol)}`,
        action: level === "ok" ? undefined : "engines.node を次の LTS に上げる準備をする",
    });
}

// Next.js
const nextMajor = nextVersion.split(".")[0];
const nextCycle = nextCycles.find((c) => c.cycle === nextMajor);
if (nextCycle) {
    const eol = typeof nextCycle.eol === "string" ? nextCycle.eol : null;
    const level = levelFor(eol);
    findings.push({
        level: level === "error" ? "warn" : level,
        name: `Next.js ${nextMajor}`,
        detail: `サポート終了 ${when(eol)}。最新のメジャーは ${nextCycles[0].cycle}`,
        action: level === "ok" ? undefined : `Next.js ${nextCycles.find((c) => c.eol === false)?.cycle ?? nextCycles[0].cycle} への移行を計画する`,
    });
    if (nextCycle.latest && nextCycle.latest !== nextVersion) {
        findings.push({
            level: "warn",
            name: `Next.js ${nextVersion}`,
            detail: `同じ ${nextMajor} 系に ${nextCycle.latest} が出ている（不具合・セキュリティの修正を含むことがある）`,
            action: `next と eslint-config-next を ${nextCycle.latest} に上げる（Dependabot の PR があればそれをマージ）`,
        });
    }
}

// deploy.yml の firebase-tools
if (pinnedFirebaseTools) {
    const behind = Number(latestFirebaseTools.split(".")[0]) - Number(pinnedFirebaseTools.split(".")[0]);
    findings.push({
        level: behind >= 1 ? "warn" : "ok",
        name: `firebase-tools ${pinnedFirebaseTools}（deploy.yml）`,
        detail: `最新は ${latestFirebaseTools}`,
        action: behind >= 1 ? "deploy.yml の firebase-tools の版を上げる（Dependabot は run の中の版を更新しない）" : undefined,
    });
}

// ---- 出力 ----

const MARK = { error: "🔴 要対応", warn: "🟡 注意", ok: "🟢 問題なし" };
const order = { error: 0, warn: 1, ok: 2 };
findings.sort((a, b) => order[a.level] - order[b.level]);

const table = [
    "| 状態 | 対象 | 内容 | すること |",
    "|---|---|---|---|",
    ...findings.map((f) => `| ${MARK[f.level]} | ${f.name} | ${f.detail} | ${f.action ?? "—"} |`),
].join("\n");
const report = [
    `${today.toISOString().slice(0, 10)} の確認結果（期限まで ${WARN_DAYS} 日を切ったものを「注意」にしている）。`,
    "",
    table,
    "",
    "このIssueは `.github/workflows/lifecycle.yml` が毎週月曜に更新し、対応が必要なものが無くなると閉じる。",
].join("\n");

console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);

const needsAction = findings.some((f) => f.level === "error" || f.level === "warn");

if (DRY_RUN) {
    console.log(`\n（DRY_RUN のため Issue は触らない。対応が必要なもの：${needsAction ? "あり" : "なし"}）`);
} else {
    const open = JSON.parse(
        sh("gh", ["issue", "list", "--state", "open", "--search", `in:title "${ISSUE_TITLE}"`, "--json", "number,title"])
    ).find((i) => i.title === ISSUE_TITLE);
    const bodyFile = join(mkdtempSync(join(tmpdir(), "lifecycle-")), "body.md");
    writeFileSync(bodyFile, report);

    if (needsAction && open) {
        sh("gh", ["issue", "edit", String(open.number), "--body-file", bodyFile]);
        console.log(`Issue #${open.number} を更新した`);
    } else if (needsAction) {
        console.log(sh("gh", ["issue", "create", "--title", ISSUE_TITLE, "--body-file", bodyFile]));
    } else if (open) {
        sh("gh", ["issue", "close", String(open.number), "--comment", "対応が必要なものは無くなりました。"]);
        console.log(`Issue #${open.number} を閉じた`);
    }
}

