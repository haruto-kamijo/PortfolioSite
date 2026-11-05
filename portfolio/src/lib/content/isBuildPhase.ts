// src/lib/content/isBuildPhase.ts

import { PHASE_PRODUCTION_BUILD } from "next/constants";

/**
 * next build でページを作っているところか。
 * ISR のページでは、読み込みに失敗したとき、ビルド中は空で作り（ビルドを止めない）、
 * それ以外は例外を投げて、直前に作れたページを出し続けてもらう（getCareer・getClaudeUsage）
 */
export const isBuildPhase = () => process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;
