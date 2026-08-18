// src/components/space/SpaceBackground.tsx
"use client";

import dynamic from "next/dynamic";
import { ScenePhase, useSpaceScene } from "./SpaceSceneProvider";
import { SPINUP_MS } from "@/lib/warpTimeline";

// WebGL は SSR できないため、Canvas はクライアントのみで読み込む
const SpaceCanvas = dynamic(() => import("../three/SpaceCanvas"), { ssr: false });

const PHASE_TRANSFORM: Record<ScenePhase, string> = {
    idle: "scale-100 brightness-100",
    spinup: "scale-[1.12] brightness-110",
    flash: "scale-[1.18] brightness-125",
    warp: "scale-[1.30] brightness-120",
    cruise: "scale-[1.04] brightness-75",
};

/**
 * 全ページ共通の星空背景。
 * ルートレイアウトに1つだけ配置し、ページ遷移でも WebGL コンテキストを作り直さないことで
 * スタート画面から下層ページまで地続きの世界観を保つ。
 */
export const SpaceBackground = () => {
    const { phase } = useSpaceScene();

    return (
        <>
            <div
                aria-hidden
                className={[
                    "fixed inset-0 -z-10 will-change-transform",
                    "transition-[transform,filter] ease-out",
                    PHASE_TRANSFORM[phase],
                ].join(" ")}
                // Tailwind の任意値クラスは動的生成できないため duration は inline で指定する
                style={{ transitionDuration: phase === "spinup" ? `${SPINUP_MS}ms` : "900ms" }}
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
