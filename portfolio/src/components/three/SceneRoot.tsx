// src/components/three/SceneRoot.tsx
"use client";

import React from "react";
import { NebulaBackground } from "./NebulaBackground";
import { StarField } from "./StarField";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const CameraRig: React.FC = () => {
    const { camera, pointer } = useThree();

    useFrame(() => {
        // マウス位置にカメラがゆっくり寄る（クリック不要）
        const tx = pointer.x * 0.8;
        const ty = pointer.y * 0.5;

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

            {/* ガス雲（透明＋発光） */}
            {/*<NebulaBackground />*/}

            {/* 星（天球回転＋レア消灯） */}
            <StarField count={3200} radius={70} />

            <CameraRig />
        </>
    );
};
