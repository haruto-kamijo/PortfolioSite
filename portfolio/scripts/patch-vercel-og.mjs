// scripts/patch-vercel-og.mjs
//
// Windows の手元で next build・next dev が OG 画像（/og.png・/catalog-cover.png）を作れない問題を、npm install のあとに直す。
//
// Next 14 に同梱の @vercel/og は、フォントと wasm の場所を path.join(import.meta.url, "../…") で組み立てている。
// Windows の新しい Node（22.23 など）は、path.join が "file:" で始まる部分の前に ".\" を付けるので、
// fileURLToPath が Invalid URL で失敗する。URL のまま new URL("./…", import.meta.url) で組み立てるように書き換える
// （path.join はファイル名をフォルダとして数えるので "../" で同じフォルダを指す。URL では "./" が同じフォルダ）。
//
// Linux（CI・本番）では今の書き方で動くので、Windows のときだけ書き換える。
// Next を上げて書き方が変わったら、何もせずに知らせるだけにする（npm install は止めない）。

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

if (process.platform !== "win32") process.exit(0);

const file = fileURLToPath(new URL("../node_modules/next/dist/compiled/@vercel/og/index.node.js", import.meta.url));
if (!existsSync(file)) process.exit(0);

const pattern = /fileURLToPath\(join\(import\.meta\.url, "\.\.\/([^"]+)"\)\)/g;
const source = readFileSync(file, "utf8");
const patched = source.replace(pattern, 'fileURLToPath(new URL("./$1", import.meta.url))');

if (patched !== source) {
    writeFileSync(file, patched);
    console.log("patch-vercel-og: @vercel/og のファイルの場所の組み立てを、Windows で動く形に直しました");
} else if (!source.includes('new URL("./yoga.wasm", import.meta.url)')) {
    console.warn("patch-vercel-og: @vercel/og の書き方が変わっていて直せませんでした。scripts/patch-vercel-og.mjs を見直してください");
}
