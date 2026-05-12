// src/components/three/NebulaBackground.tsx
"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { nebulaVertexShader, nebulaFragmentShader } from "@/lib/three/shaders/nebulaShader";

export const NebulaBackground: React.FC = () => {
    const matRef = useRef<THREE.ShaderMaterial | null>(null);
    const { size } = useThree();

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uResolution: { value: new THREE.Vector2(size.width, size.height) },
            // ガスを光らせたいならここを上げる
            uIntensity: { value: 1.5 },
            uColorA: { value: new THREE.Color("#000000") },
            uColorB: { value: new THREE.Color("#e5e7eb") }, // アイスグレー
            uColorC: { value: new THREE.Color("#c7d2fe") }, // 薄い青紫
        }),
        [size.width, size.height]
    );

    useFrame(({ clock }) => {
        if (!matRef.current) return;
        matRef.current.uniforms.uTime.value = clock.getElapsedTime();
        matRef.current.uniforms.uResolution.value.set(size.width, size.height);
    });

    return (
        <mesh scale={40}>
            <sphereGeometry args={[1, 64, 64]} />
            <shaderMaterial
                ref={matRef}
                vertexShader={nebulaVertexShader}
                fragmentShader={nebulaFragmentShader}
                uniforms={uniforms}
                side={THREE.BackSide}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </mesh>
    );
};
