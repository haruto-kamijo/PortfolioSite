"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { PROFILE_DOC_ID, collections } from "@/lib/content/types";

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

export type ProfileInput = {
    name: string;
    nameJa: string;
    role: string;
    tagline: string;
    description: string;
    school: string;
    schoolShort: string;
    program: string;
    programJa: string;
    /** 空文字は「上書きなし」として保存する */
    gradeOverride: string;
    hobbies: string[];
    languages: string[];
};

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

    const name = input.name.trim();
    const nameJa = input.nameJa.trim();
    const role = input.role.trim();
    const tagline = input.tagline.trim();
    const description = input.description.trim();
    const school = input.school.trim();
    const schoolShort = input.schoolShort.trim();
    const program = input.program.trim();
    const programJa = input.programJa.trim();
    const gradeOverride = input.gradeOverride.trim();

    if (
        !name ||
        !nameJa ||
        !role ||
        !tagline ||
        !description ||
        !school ||
        !schoolShort ||
        !program ||
        !programJa
    ) {
        return { ok: false, error: "未入力の項目があります" };
    }

    const fields: Array<[string, string, number]> = [
        ["名前", name, LIMITS.short],
        ["名前（日本語）", nameJa, LIMITS.short],
        ["肩書き", role, LIMITS.medium],
        ["キャッチコピー", tagline, LIMITS.medium],
        ["紹介文", description, LIMITS.long],
        ["学校名", school, LIMITS.medium],
        ["学校名（略称）", schoolShort, LIMITS.short],
        ["専攻", program, LIMITS.medium],
        ["専攻（日本語）", programJa, LIMITS.medium],
        ["学年の上書き", gradeOverride, LIMITS.short],
    ];
    for (const [label, value, max] of fields) {
        if (value.length > max) return { ok: false, error: `${label}が長すぎます` };
    }

    const hobbies = cleanList(input.hobbies);
    const languages = cleanList(input.languages);
    for (const item of [...hobbies, ...languages]) {
        if (item.length > LIMITS.listItem) return { ok: false, error: "リストの項目が長すぎます" };
    }

    const db = getAdminDb();
    if (!db) return { ok: false, error: "データベースに接続できません" };

    try {
        await db
            .collection(collections.profile)
            .doc(PROFILE_DOC_ID)
            .set({
                name,
                nameJa,
                role,
                tagline,
                description,
                school,
                schoolShort,
                program,
                programJa,
                gradeOverride: gradeOverride || null,
                hobbies,
                languages,
            });
    } catch (err) {
        console.error("[admin] プロフィールの保存に失敗しました:", err);
        return { ok: false, error: "保存に失敗しました" };
    }

    // 公開ページ側の ISR キャッシュを更新
    revalidatePath("/home");
    revalidatePath("/admin");
    revalidatePath("/admin/profile");

    return { ok: true };
}
