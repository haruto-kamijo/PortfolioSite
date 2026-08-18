// src/components/space/SpaceSceneProvider.tsx
"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

/**
 * 背景の星空シーンの状態。
 * スタート画面のワープ演出と、通常ページの落ち着いた表示を1つのCanvasで共有するため、
 * 「どのページを見ているか」ではなく「シーンがどの状態か」で管理する。
 */
export type ScenePhase =
    | "idle" // スタート画面・待機
    | "spinup" // 加速中
    | "flash" // 発光
    | "warp" // ワープ
    | "cruise"; // 通常ページ表示中

type SpaceSceneContextValue = {
    phase: ScenePhase;
    setPhase: React.Dispatch<React.SetStateAction<ScenePhase>>;
};

const SpaceSceneContext = createContext<SpaceSceneContextValue | null>(null);

export const SpaceSceneProvider = ({ children }: { children: React.ReactNode }) => {
    const [phase, setPhase] = useState<ScenePhase>("idle");
    const value = useMemo(() => ({ phase, setPhase }), [phase]);

    return <SpaceSceneContext.Provider value={value}>{children}</SpaceSceneContext.Provider>;
};

export const useSpaceScene = () => {
    const ctx = useContext(SpaceSceneContext);
    if (!ctx) {
        throw new Error("useSpaceScene は <SpaceSceneProvider> の内側で呼び出してください");
    }
    return ctx;
};
