// src/components/ui/AcademicStatusLine.tsx
"use client";

import { useEffect, useState } from "react";
import { AcademicStatus, academicStatusAt } from "@/lib/academicYear";

/**
 * 学年を表示する。
 *
 * 既定は年度からの自動計算で、管理画面(CMS)で gradeOverride を設定した場合はそちらを優先する。
 * 静的ビルドでは HTML がビルド時点の年度で固まるため、初期値はサーバー側で計算した値を props で受け取り、
 * ハイドレーション後にブラウザの時計で再計算する。これで再デプロイなしでも4月の年度替わりに追従する。
 */
export const AcademicStatusLine = ({
                                       initial,
                                       schoolShort,
                                       program,
                                       gradeOverride,
                                   }: {
    initial: AcademicStatus;
    schoolShort: string;
    program: string;
    gradeOverride: string | null;
}) => {
    const [status, setStatus] = useState(initial);

    useEffect(() => {
        setStatus(academicStatusAt(new Date()));
    }, []);

    const grade = gradeOverride ?? (status.graduated ? "OB" : status.grade);

    return (
        <p className="mt-4 text-xs tracking-[0.14em] text-cyan-100/60">
            {schoolShort} {grade}
            <span className="mx-2 text-white/20">/</span>
            {program}
        </p>
    );
};
