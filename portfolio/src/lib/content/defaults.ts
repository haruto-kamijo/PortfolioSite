// src/lib/content/defaults.ts

import { profile, site, skills, works } from "@/lib/site";
import { SiteContent } from "./types";

/** 表示テキストを ID 化する（Firestore のドキュメントIDと突き合わせるため） */
const toId = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

/**
 * Firestore が空・未設定・接続不可のときに使う既定コンテンツ。
 * これがあるおかげで、CMS を作り込む前でもサイトは今のまま動く。
 */
export const defaultContent: SiteContent = {
    profile: {
        name: site.name,
        nameJa: site.nameJa,
        role: site.role,
        tagline: site.tagline,
        description: site.description,
        school: profile.school,
        schoolShort: profile.schoolShort,
        program: profile.program,
        programJa: profile.programJa,
        gradeOverride: null,
        hobbies: [...profile.hobbies],
        languages: [...profile.languages],
    },
    skillGroups: skills.map((group, index) => ({
        id: toId(group.field),
        field: group.field,
        items: [...group.items],
        order: index,
    })),
    works: works.map((work, index) => ({
        id: toId(work.title),
        title: work.title,
        caption: work.caption,
        href: work.href,
        external: work.external ?? false,
        ready: work.ready,
        order: index,
        coverUrl: null,
    })),
    source: "defaults",
};
