// src/components/three/SceneRoot.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { StarField } from "./StarField";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useReducedMotion } from "@/lib/useReducedMotion";

// ※ ガス雲（NebulaBackground / nebulaShader）は調整中のため未使用。
//    仕上がったらここに <NebulaBackground /> を差し込む。

/**
 * マウス位置に合わせてカメラをゆっくり寄せる視差演出。
 * Canvas は pointer-events-none で背面にあり r3f の pointer が更新されないため、
 * window のイベントから直接カーソル位置を取る。
 */
const CameraRig: React.FC = () => {
    const pointerRef = useRef({ x: 0, y: 0 });
    const reducedMotion = useReducedMotion();

    useEffect(() => {
        if (reducedMotion) return;

        const onMove = (e: PointerEvent) => {
            pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            pointerRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
        };

        window.addEventListener("pointermove", onMove, { passive: true });
        return () => window.removeEventListener("pointermove", onMove);
    }, [reducedMotion]);

    useFrame(({ camera }) => {
        const tx = reducedMotion ? 0 : pointerRef.current.x * 0.8;
        const ty = reducedMotion ? 0 : pointerRef.current.y * 0.5;

        camera.position.x = THREE.MathUtils.lerp(camera.position.x, tx, 0.06);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, ty, 0.06);
        camera.position.z = 8;

        camera.lookAt(0, 0, 0);
    });

    return null;
};

export const SceneRoot: React.FC = () => {
    return (
        <>
            <color attach="background" args={["#000000"]} />

            {/* 星（天球回転＋レア消灯） */}
            <StarField count={3200} radius={70} />

            <CameraRig />
        </>
    );
};
