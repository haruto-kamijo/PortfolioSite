// src/lib/readLimited.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { readLimited } from "./readLimited";

/** 本文を上限まで読む。`npm test` で動かす */

/** Content-Length を付けずに、分けて送られてくる本文（chunked） */
const chunked = (...parts: string[]) =>
    new Request("http://localhost/", {
        method: "POST",
        body: new ReadableStream<Uint8Array>({
            start(controller) {
                for (const part of parts) controller.enqueue(new TextEncoder().encode(part));
                controller.close();
            },
        }),
        // @ts-expect-error Node の fetch で本文をストリームで渡すときに要る（lib.dom の型には無い）
        duplex: "half",
    });

test("上限までの本文は、分けて送られてきてもつなげて読む", async () => {
    const req = chunked('{"type":', '"tag"}');
    assert.equal(req.headers.get("content-length"), null);
    assert.equal(await readLimited(req, 1024), '{"type":"tag"}');
});

test("Content-Length が無くても、読んだバイト数が上限を超えたら null", async () => {
    assert.equal(await readLimited(chunked("x".repeat(600), "x".repeat(600)), 1024), null);
    // 文字数では 400 でも、UTF-8 では 1200 バイト
    assert.equal(await readLimited(chunked("あ".repeat(400)), 1024), null);
});

test("本文が無ければ空の文字列", async () => {
    assert.equal(await readLimited(new Request("http://localhost/"), 1024), "");
});
