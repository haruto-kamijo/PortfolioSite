"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin/session";
import { revalidatePublicPages } from "@/lib/admin/revalidatePublic";
import { getAdminDb } from "@/lib/firebase/admin";
import { writeLocalized } from "@/lib/content/fields";
import { PROFILE_DOC_ID, collections } from "@/lib/content/types";
import { LOCALES, Locale, Localized, LocalizedList } from "@/lib/i18n";

/**
 * プロフィール編集の保存処理（Server Action）。
 *
 * Server Actions は実質「公開されたエンドポイント」なので、
 * 画面に入れたかどうかとは別に、必ずここで権限を再確認する。
 *
 * 検証エラーは throw せず { ok: false, error } を返している。
 * Server Action から throw した Error は本番ビルドで文言が握りつぶされることがあり、
 * バリデーションメッセージを利用者に伝えられなくなるため。
 */

const LIMITS = { short: 100, medium: 300, long: 2000, listItem: 60, listMax: 20 } as const;

/** 日英で入力する文章の項目。日本語は必須、英語は空なら公開ページで日本語を代わりに出す */
const PROFILE_TEXT_KEYS = [
    "name",
    "role",
    "tagline",
    "description",
    "school",
    "schoolShort",
    "program",
] as const;
type ProfileTextKey = (typeof PROFILE_TEXT_KEYS)[number];

export type ProfileInput = Record<ProfileTextKey, Localized> & {
    /** 空文字は「上書きなし」として保存する */
    gradeOverride: string;
    hobbies: LocalizedList;
    languages: string[];
};

const TEXT_LIMITS: Record<ProfileTextKey, [label: string, max: number]> = {
    name: ["名前", LIMITS.short],
    role: ["肩書き", LIMITS.medium],
    tagline: ["キャッチコピー", LIMITS.medium],
    description: ["紹介文", LIMITS.long],
    school: ["学校名", LIMITS.medium],
    schoolShort: ["学校名（略称）", LIMITS.short],
    program: ["専攻", LIMITS.medium],
};

const LANG_LABEL: Record<Locale, string> = { ja: "日本語", en: "英語" };

export type SaveResult = { ok: true } | { ok: false; error: string };

const requireAdmin = async () => {
    const user = await getAdminUser();
    if (!user) throw new Error("権限がありません");
};

const cleanList = (items: string[]) =>
    items
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, LIMITS.listMax);

export async function saveProfile(input: ProfileInput): Promise<SaveResult> {
    await requireAdmin();

    const texts = {} as Record<ProfileTextKey, Localized>;
    for (const key of PROFILE_TEXT_KEYS) {
        const [label, max] = TEXT_LIMITS[key];
        const value = { ja: input[key].ja.trim(), en: input[key].en.trim() };
        if (!value.ja) return { ok: false, error: `${label}（日本語）を入力してください` };
        for (const lang of LOCALES) {
            if (value[lang].length > max) {
                return { ok: false, error: `${label}（${LANG_LABEL[lang]}）が長すぎます` };
            }
        }
        texts[key] = value;
    }

    const gradeOverride = input.gradeOverride.trim();
    if (gradeOverride.length > LIMITS.short) return { ok: false, error: "学年の上書きが長すぎます" };

    const hobbies = { ja: cleanList(input.hobbies.ja), en: cleanList(input.hobbies.en) };
    const languages = cleanList(input.languages);
    for (const item of [...hobbies.ja, ...hobbies.en, ...languages]) {
        if (item.length > LIMITS.listItem) return { ok: false, error: "リストの項目が長すぎます" };
    }

    const db = getAdminDb();
    if (!db) return { ok: false, error: "データベースに接続できません" };

    try {
        await db
            .collection(collections.profile)
            .doc(PROFILE_DOC_ID)
            .set({
                ...Object.assign({}, ...PROFILE_TEXT_KEYS.map((key) => writeLocalized(key, texts[key]))),
                gradeOverride: gradeOverride || null,
                ...writeLocalized("hobbies", hobbies),
                languages,
            });
    } catch (err) {
        console.error("[admin] プロフィールの保存に失敗しました:", err);
        return { ok: false, error: "保存に失敗しました" };
    }

    // 公開ページ側の ISR キャッシュを更新
    revalidatePublicPages();
    revalidatePath("/admin");
    revalidatePath("/admin/profile");

    return { ok: true };
}
