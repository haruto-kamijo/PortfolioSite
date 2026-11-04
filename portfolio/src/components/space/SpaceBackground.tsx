// src/components/space/SpaceBackground.tsx
"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useSpaceScene } from "./SpaceSceneProvider";
import { isCatalogFramePath } from "@/lib/catalog/widths";
import { NAVIGATE_AT_MS } from "@/lib/warpTimeline";

// WebGL は SSR できないため、Canvas はクライアントのみで読み込む
const SpaceCanvas = dynamic(() => import("../three/SpaceCanvas"), { ssr: false });

/**
 * 背景の拡大・増光。
 *
 * 以前は idle/spinup/flash/warp 4段階それぞれに別の目標値と duration を持たせており、
 * flash(100ms)・warp(150ms)のように短い区間に切り替わるたびにCSSトランジションが
 * retarget され、ズームが完了しないまま何度も向き先を変えて継ぎ目が見えていた。
 *
 * spinup/flash/warp の3段階は「同じ最終ズーム値へ、クリックから遷移までの全時間をかけて
 * 一気にイーズする」1本のトランジションにまとめている。クラス・durationが変わらない限り
 * Reactの再レンダーではCSSトランジションは再スタートしないため、途中でphaseが
 * flash→warpと変わっても、ズーム自体はそのまま連続する。
 */
const WARPING_TRANSFORM = "scale-[1.30] brightness-120";

export const SpaceBackground = () => {
    const { phase } = useSpaceScene();
    const pathname = usePathname();

    const isWarping = phase === "spinup" || phase === "flash" || phase === "warp";
    const transformClass =
        phase === "idle" ? "scale-100 brightness-100"
            : phase === "cruise" ? "scale-[1.04] brightness-75"
                : WARPING_TRANSFORM;

    // デザインカタログの iframe に入れる見本だけのページでは、星空を描かない（iframe ごとに WebGL を作らないように）
    if (isCatalogFramePath(pathname)) return null;

    return (
        <>
            <div
                aria-hidden
                className={[
                    "fixed inset-0 -z-10 will-change-transform",
                    "transition-[transform,filter] ease-out",
                    transformClass,
                ].join(" ")}
                // Tailwind の任意値クラスは動的生成できないため duration は inline で指定する
                style={{ transitionDuration: isWarping ? `${NAVIGATE_AT_MS}ms` : "900ms" }}
            >
                <SpaceCanvas />
            </div>

            {/* 中央を少し落として文字の可読性を上げるビネット */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.35),transparent_60%)]"
            />
        </>
    );
};
