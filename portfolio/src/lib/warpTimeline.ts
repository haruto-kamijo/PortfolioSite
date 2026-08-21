// src/lib/warpTimeline.ts

/**
 * スタート画面 → /home のワープ演出のタイムライン。
 * リング演出（ContentRings）と遷移タイマーが同じ値を参照するよう、ここに集約している。
 *
 * 全体を「1本の連続した動き」として設計している：
 *   リングが加速して輪になる → 短く静止 → 白く発光 → 黒へクロスフェード
 *   → 遷移の瞬間にちょうど完全な黒になる → /home 側が同じ黒からフェードインする
 * 各区間の長さは、前後の区間とぴったり繋がるように算出している値が多いので、
 * 単体で変更すると継ぎ目が見えるようになる点に注意。
 */
export const SPINUP_MS = 3500; // リング加速にかける時間
export const FLASH_AT_MS = SPINUP_MS; // 白フラッシュ開始
export const WARP_AT_MS = SPINUP_MS + 100; // 暗転開始
// router.push呼び出しから実際に/homeへ到達するまで実測で約200ms余分にかかるため、
// クリックからの合計が4000msを切るよう少し手前で呼び出す
export const NAVIGATE_AT_MS = SPINUP_MS + 250; // ルーティング実行（クリックからここまでで3750ms）

/**
 * 白フラッシュが 0→1 に立ち上がる時間。ちょうど WARP_AT_MS の瞬間に真っ白になるよう、
 * FLASH_AT_MS〜WARP_AT_MS の長さに一致させている。
 */
export const FLASH_FADE_IN_MS = WARP_AT_MS - FLASH_AT_MS;

/**
 * 白フラッシュが 1→0 に消えるのと、暗転が 0→1 になるのを同じ長さにして、
 * ちょうど NAVIGATE_AT_MS の瞬間に「完全な黒」になるようクロスフェードさせる。
 * これにより、ページ遷移した瞬間に /home 側の入場ベール（同じ黒）へ継ぎ目なく引き継げる。
 */
export const WARP_FADE_MS = NAVIGATE_AT_MS - WARP_AT_MS;

/**
 * リングが伸び切ってから白フラッシュ（FLASH_AT_MS地点）までの保持時間。
 * ContentRings の growEnd 計算で使う。
 *
 * 以前は1400ms（全体の40%）保持しており、「輪になる→(長い静止)→光る→ワープ」と
 * 動作が完全に途切れて見える原因になっていたため、短い「タメ」程度に縮めている。
 */
export const RING_HOLD_MS = 400;

/** 無操作でも自動的にワープを開始するまでの待ち時間 */
export const AUTO_START_MS = 8000;

/**
 * /home 側の入場フェード（暗転からの復帰）にかける時間。
 * スタート画面側の暗転(WARP_FADE_MS)と足並みが違っても違和感は出にくいが、
 * 「暗転からの復帰」という役割自体はスタート画面側の暗転と対になっている。
 */
export const ENTER_FADE_MS = 900;
