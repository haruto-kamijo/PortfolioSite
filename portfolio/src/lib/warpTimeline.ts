// src/lib/warpTimeline.ts

/**
 * スタート画面 → /home のワープ演出のタイムライン。
 * リング演出（ContentRings）と遷移タイマーが同じ値を参照するよう、ここに集約している。
 */
export const SPINUP_MS = 5000; // リング加速にかける時間
export const FLASH_AT_MS = SPINUP_MS; // 白フラッシュ開始
export const WARP_AT_MS = SPINUP_MS + 120; // 暗転開始
export const NAVIGATE_AT_MS = SPINUP_MS + 600; // ルーティング実行

/** 無操作でも自動的にワープを開始するまでの待ち時間 */
export const AUTO_START_MS = 8000;

/** /home 側の入場フェード（暗転からの復帰）にかける時間 */
export const ENTER_FADE_MS = 900;
