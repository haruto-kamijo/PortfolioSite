// src/lib/content/getSiteContent.ts

import { getAdminDb } from "@/lib/firebase/admin";
import { defaultContent } from "./defaults";
import type { Localized } from "@/lib/i18n";
import { readLocalized, readLocalizedList, str, strList } from "./fields";
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

        // 接続できただけでは "firestore" にしない。
        // ドキュメントが1つも無ければ実質すべて既定値なので、その状態は "defaults" として扱う
        // （でないと管理画面の「まだ何も保存されていません」という案内が一生出せなくなる）。
        const hasRealContent = profileSnap.exists || !skillsSnap.empty || !worksSnap.empty;

        return {
            profile: mergeProfile(profileSnap.data()),
            skillGroups: skillsSnap.empty
                ? defaultContent.skillGroups
                : skillsSnap.docs.map(toSkillGroup),
            works: worksSnap.empty ? defaultContent.works : worksSnap.docs.map(toWork),
            source: hasRealContent ? "firestore" : "defaults",
        };
    } catch (err) {
        console.warn("[content] Firestore から読めなかったため既定値を使います:", err);
        return defaultContent;
    }
};

/**
 * 日英対応より前に保存したプロフィールは、name / program に英語、nameJa / programJa に日本語を
 * 入れていた。nameEn が無いドキュメントはその形式とみなして読み替える。
 */
const readLegacyLocalized = (data: Record<string, unknown>, key: string, fallback: Localized): Localized =>
    data[`${key}En`] === undefined
        ? readLocalized({ [key]: data[`${key}Ja`], [`${key}En`]: data[key] }, key, fallback)
        : readLocalized(data, key, fallback);

/** 項目ごとに、日英どちらも保存されていなければ既定値を使う */
const mergeProfile = (data: Record<string, unknown> | undefined): ProfileContent => {
    const base = defaultContent.profile;
    if (!data) return base;

    return {
        name: readLegacyLocalized(data, "name", base.name),
        role: readLocalized(data, "role", base.role),
        tagline: readLocalized(data, "tagline", base.tagline),
        description: readLocalized(data, "description", base.description),
        school: readLocalized(data, "school", base.school),
        schoolShort: readLocalized(data, "schoolShort", base.schoolShort),
        program: readLegacyLocalized(data, "program", base.program),
        // 空文字は「上書きなし」として扱い、年度からの自動計算に任せる
        gradeOverride: typeof data.gradeOverride === "string" && data.gradeOverride
            ? data.gradeOverride
            : null,
        hobbies: readLocalizedList(data, "hobbies", base.hobbies),
        languages: strList(data.languages, base.languages),
    };
};

type Doc = { id: string; data: () => Record<string, unknown> };

const toSkillGroup = (doc: Doc, index: number): SkillGroupContent => {
    const data = doc.data();
    return {
        id: doc.id,
        field: readLocalized(data, "field", { ja: doc.id, en: "" }),
        items: readLocalizedList(data, "items"),
        order: typeof data.order === "number" ? data.order : index,
    };
};

const toWork = (doc: Doc, index: number): WorkContent => {
    const data = doc.data();
    return {
        id: doc.id,
        title: readLocalized(data, "title", { ja: doc.id, en: "" }),
        caption: readLocalized(data, "caption"),
        href: str(data.href, "#"),
        external: data.external === true,
        ready: data.ready === true,
        order: typeof data.order === "number" ? data.order : index,
        coverUrl: typeof data.coverUrl === "string" && data.coverUrl ? data.coverUrl : null,
    };
};
