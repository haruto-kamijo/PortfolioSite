"use client";

import { Canvas } from "@react-three/fiber";
import { SceneRoot } from "./SceneRoot";

export default function SpaceCanvas() {
    return (
        <div className="absolute inset-0">
            <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
                <SceneRoot />
            </Canvas>
        </div>
    );
}
