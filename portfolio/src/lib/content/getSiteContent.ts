// src/lib/content/getSiteContent.ts

import { getAdminDb } from "@/lib/firebase/admin";
import { defaultContent } from "./defaults";
import {
    PROFILE_DOC_ID,
    ProfileContent,
    SiteContent,
    SkillGroupContent,
    WorkContent,
    collections,
} from "./types";

/**
 * 公開ページに出すコンテンツを取得する（サーバー専用）。
 *
 * Firestore が未設定・空・接続不可のときは静的な既定値を返すため、
 * CMS が未完成でもページは壊れない。ドキュメントが部分的にしか埋まっていない場合も
 * 項目ごとに既定値へフォールバックする。
 */
export const getSiteContent = async (): Promise<SiteContent> => {
    const db = getAdminDb();
    if (!db) return defaultContent;

    try {
        const [profileSnap, skillsSnap, worksSnap] = await Promise.all([
            db.collection(collections.profile).doc(PROFILE_DOC_ID).get(),
            db.collection(collections.skillGroups).orderBy("order").get(),
            db.collection(collections.works).orderBy("order").get(),
        ]);

        return {
            profile: mergeProfile(profileSnap.data()),
            skillGroups: skillsSnap.empty
                ? defaultContent.skillGroups
                : skillsSnap.docs.map(toSkillGroup),
            works: worksSnap.empty ? defaultContent.works : worksSnap.docs.map(toWork),
            source: "firestore",
        };
    } catch (err) {
        console.warn("[content] Firestore から読めなかったため既定値を使います:", err);
        return defaultContent;
    }
};

const str = (value: unknown, fallback: string) =>
    typeof value === "string" && value.length > 0 ? value : fallback;

const strList = (value: unknown, fallback: string[]) =>
    Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : fallback;

const mergeProfile = (data: Record<string, unknown> | undefined): ProfileContent => {
    const base = defaultContent.profile;
    if (!data) return base;

    return {
        name: str(data.name, base.name),
        nameJa: str(data.nameJa, base.nameJa),
        role: str(data.role, base.role),
        tagline: str(data.tagline, base.tagline),
        description: str(data.description, base.description),
        school: str(data.school, base.school),
        schoolShort: str(data.schoolShort, base.schoolShort),
        program: str(data.program, base.program),
        programJa: str(data.programJa, base.programJa),
        // 空文字は「上書きなし」として扱い、年度からの自動計算に任せる
        gradeOverride: typeof data.gradeOverride === "string" && data.gradeOverride
            ? data.gradeOverride
            : null,
        hobbies: strList(data.hobbies, base.hobbies),
        languages: strList(data.languages, base.languages),
    };
};

type Doc = { id: string; data: () => Record<string, unknown> };

const toSkillGroup = (doc: Doc, index: number): SkillGroupContent => {
    const data = doc.data();
    return {
        id: doc.id,
        field: str(data.field, doc.id),
        items: strList(data.items, []),
        order: typeof data.order === "number" ? data.order : index,
    };
};

const toWork = (doc: Doc, index: number): WorkContent => {
    const data = doc.data();
    return {
        id: doc.id,
        title: str(data.title, doc.id),
        caption: str(data.caption, ""),
        href: str(data.href, "#"),
        external: data.external === true,
        ready: data.ready === true,
        order: typeof data.order === "number" ? data.order : index,
        coverUrl: typeof data.coverUrl === "string" && data.coverUrl ? data.coverUrl : null,
    };
};
