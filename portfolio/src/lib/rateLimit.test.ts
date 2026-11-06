// src/lib/rateLimit.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { createRateLimiter } from "./rateLimit";

/** 簡易レート制限。`npm test` で動かす */

test("max 回までは通し、超えたら断る。時間がたてばまた通す", () => {
    const isLimited = createRateLimiter(60_000, 3);
    assert.deepEqual([0, 1, 2, 3].map((t) => isLimited("a", t)), [false, false, false, true]);
    assert.equal(isLimited("b", 4), false);
    assert.equal(isLimited("a", 60_003), false);
});

test("countRejected: false なら断った分は数えず、古いものが期限切れになればすぐ通す", () => {
    const isLimited = createRateLimiter(1000, 2, { countRejected: false });
    assert.deepEqual([0, 100].map((t) => isLimited("all", t)), [false, false]);
    for (let t = 200; t < 1000; t += 100) assert.equal(isLimited("all", t), true, `t=${t}`);
    // 0 の分が期限切れになったので、1 回だけ通る
    assert.equal(isLimited("all", 1000), false);
    assert.equal(isLimited("all", 1050), true);
});

test("断っているあいだも送られ続けたら、断り続ける（断った分も数える）", () => {
    const isLimited = createRateLimiter(1000, 2);
    for (let t = 0; t < 5000; t += 100) {
        if (t >= 200) assert.equal(isLimited("a", t), true, `t=${t}`);
        else isLimited("a", t);
    }
});
