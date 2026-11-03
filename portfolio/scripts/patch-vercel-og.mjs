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
// 直せないとき（Next を上げて書き方や場所が変わった、ファイルを読み書きできない）は、知らせるだけにする（npm install は止めない）。

import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

if (process.platform !== "win32") process.exit(0);

const warn = (message) => console.warn(`patch-vercel-og: ${message}。scripts/patch-vercel-og.mjs を見直してください`);

try {
    const next = dirname(createRequire(import.meta.url).resolve("next/package.json"));
    const file = join(next, "dist/compiled/@vercel/og/index.node.js");

    const pattern = /fileURLToPath\(join\(import\.meta\.url, "\.\.\/([^"]+)"\)\)/g;
    const source = readFileSync(file, "utf8");
    const patched = source.replace(pattern, 'fileURLToPath(new URL("./$1", import.meta.url))');

    if (patched !== source) {
        writeFileSync(file, patched);
        console.log("patch-vercel-og: @vercel/og のファイルの場所の組み立てを、Windows で動く形に直しました");
    }
    // 3つとも直った形になっていることを確かめる（一部だけ書き方が変わったときに、直ったように見せない）
    const missing = ["noto-sans-v27-latin-regular.ttf", "yoga.wasm", "resvg.wasm"].filter(
        (name) => !patched.includes(`fileURLToPath(new URL("./${name}", import.meta.url))`),
    );
    if (missing.length > 0 || patched.includes("join(import.meta.url")) {
        warn(`@vercel/og の書き方が変わっていて直せませんでした（${missing.join("・") || "join(import.meta.url が残っている"}）`);
    }
} catch (error) {
    warn(`@vercel/og を直せませんでした（${error.message}）`);
}
