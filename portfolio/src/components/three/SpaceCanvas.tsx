// src/components/three/SpaceCanvas.tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { SceneRoot } from "./SceneRoot";

export default function SpaceCanvas() {
    return (
        // 背景専用なのでクリックを一切奪わない
        <div className="pointer-events-none absolute inset-0">
            <Canvas
                camera={{ position: [0, 0, 8], fov: 60 }}
                // 高DPI端末で解像度が上がりすぎて重くなるのを防ぐ
                dpr={[1, 1.5]}
                gl={{ antialias: false, powerPreference: "high-performance" }}
            >
                <SceneRoot />
            </Canvas>
        </div>
    );
}
