// src/lib/content/defaults.ts

import { profile, site, skills, works } from "@/lib/site";
import { SiteContent } from "./types";

/**
 * Firestore が空・未設定・接続不可のときに使う既定コンテンツ。
 * これがあるおかげで、CMS を作り込む前でもサイトは今のまま動く。
 */
export const defaultContent: SiteContent = {
    profile: {
        name: { ja: site.nameJa, en: site.name },
        role: { ...site.role },
        tagline: { ...site.tagline },
        description: { ...site.description },
        school: { ...profile.school },
        schoolShort: { ...profile.schoolShort },
        program: { ...profile.program },
        gradeOverride: null,
        hobbies: { ja: [...profile.hobbies.ja], en: [...profile.hobbies.en] },
        languages: [...profile.languages],
    },
    skillGroups: skills.map((group, index) => ({
        id: group.id,
        field: { ...group.field },
        items: { ja: [...group.items.ja], en: [...group.items.en] },
        order: index,
    })),
    works: works.map((work, index) => ({
        id: work.id,
        title: { ...work.title },
        caption: { ...work.caption },
        href: work.href,
        external: work.external ?? false,
        ready: work.ready,
        order: index,
        coverUrl: null,
    })),
    source: "defaults",
};
