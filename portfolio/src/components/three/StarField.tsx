// src/components/three/StarField.tsx
"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { starfieldVertexShader, starfieldFragmentShader } from "@/lib/three/shaders/starfieldShader";

type Props = { count?: number; radius?: number };

export const StarField: React.FC<Props> = ({ count = 3200, radius = 70 }) => {
    const pointsRef = useRef<THREE.Points | null>(null);
    const matRef = useRef<THREE.ShaderMaterial | null>(null);

    const { positions, phases } = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const phases = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            // 天球っぽく外側多め
            const r = radius * (0.75 + 0.25 * Math.random());
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = r * Math.cos(phi);

            phases[i] = Math.random() * Math.PI * 2;
        }

        return { positions, phases };
    }, [count, radius]);

    const geometry = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        g.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
        return g;
    }, [positions, phases]);

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uColor: { value: new THREE.Color("#ffffff") },
        }),
        []
    );

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();

        if (matRef.current) matRef.current.uniforms.uTime.value = t;

        if (pointsRef.current) {
            // 天球の回転：かなりゆっくり
            pointsRef.current.rotation.y = t * 0.01;
            pointsRef.current.rotation.x = t * 0.002;
        }
    });

    return (
        <points ref={pointsRef} geometry={geometry}>
            <shaderMaterial
                ref={matRef}
                vertexShader={starfieldVertexShader}
                fragmentShader={starfieldFragmentShader}
                uniforms={uniforms}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
};
