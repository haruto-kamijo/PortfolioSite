// src/components/three/StarFieldStable.tsx
"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";

type Props = { count?: number; radius?: number; useSprite?: boolean };

export const StarFieldStable: React.FC<Props> = ({
                                                     count = 3200,
                                                     radius = 70,
                                                     useSprite = false,
                                                 }) => {
    const pointsRef = useRef<THREE.Points | null>(null);

    // 任意：public/textures/star.png を置くと星が丸く綺麗になる
    const sprite = useSprite ? useLoader(TextureLoader, "/textures/star.png") : null;

    const geometry = useMemo(() => {
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            // 天球：外側に多めに配置
            const r = radius * (0.75 + 0.25 * Math.random());
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = r * Math.cos(phi);
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        return geo;
    }, [count, radius]);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        if (pointsRef.current) {
            // 天球回転：ゆっくり
            pointsRef.current.rotation.y = t * 0.01;
            pointsRef.current.rotation.x = t * 0.002;
        }
    });

    return (
        <points ref={pointsRef} geometry={geometry}>
            <pointsMaterial
                // --- 見えやすさの要 ---
                size={useSprite ? 4.0 : 1.2}         // 小さすぎるならまずここを上げる
                // ----------------------

                color="#ffffff"
                transparent
                opacity={0.9}
                depthWrite={false}
                blending={THREE.AdditiveBlending}

                // spriteを使う場合（任意）
                map={sprite ?? undefined}
                alphaMap={sprite ?? undefined}
            />
        </points>
    );
};
