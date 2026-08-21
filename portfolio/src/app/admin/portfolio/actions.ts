"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin/session";
import { getAdminBucket, getAdminDb } from "@/lib/firebase/admin";
import { PORTFOLIO_CATEGORIES, PortfolioCategory, collections } from "@/lib/content/types";

/**
 * /portfolio の作品(portfolioItems)管理（Server Action）。
 *
 * admin/works/actions.ts と同じ方針：各アクション内で権限を再確認し、
 * 検証エラーは throw せず結果として返す。
 * home の WORKS カードと違い、並び替えは「同じカテゴリ内」でしか行わない
 * （カテゴリをまたいだ順序に意味がないため）。
 */

const LIMITS = { title: 100, caption: 300, href: 500 } as const;

export type SaveResult = { ok: true } | { ok: false; error: string };

const requireAdmin = async () => {
    const user = await getAdminUser();
    if (!user) throw new Error("権限がありません");
};

const assertDocId = (id: string) => {
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new Error("IDが不正です");
};

const assertCategory = (category: string): category is PortfolioCategory => {
    if (!PORTFOLIO_CATEGORIES.includes(category as PortfolioCategory)) {
        throw new Error("カテゴリが不正です");
    }
    return true;
};

const coverPath = (id: string) => `portfolioItems/${id}/cover`;

type ItemFields = { title: string; caption: string; href: string; ready: boolean };

/** href は空欄も許す（写真などリンクの無い作品があるため） */
const validateFields = ({ title, caption, href }: ItemFields): string | null => {
    if (!title.trim()) return "タイトルを入力してください";
    if (title.length > LIMITS.title) return "タイトルが長すぎます";
    if (caption.length > LIMITS.caption) return "説明文が長すぎます";
    if (href.length > LIMITS.href) return "リンク先が長すぎます";
    if (href.trim() && !/^https?:\/\//.test(href.trim())) {
        return "リンク先は http:// か https:// から始めてください";
    }
    return null;
};

export async function createPortfolioItem(
    category: string,
    input: ItemFields
): Promise<SaveResult> {
    await requireAdmin();
    assertCategory(category);

    const fields = {
        title: input.title.trim(),
        caption: input.caption.trim(),
        href: input.href.trim(),
        ready: input.ready,
    };
    const error = validateFields(fields);
    if (error) return { ok: false, error };

    const db = getAdminDb();
    if (!db) return { ok: false, error: "データベースに接続できません" };

    try {
        // where + orderBy(別フィールド) は複合インデックスが要るため、
        // 全件を order だけで取得してカテゴリ内の最大値を JS 側で探す
        // （個人サイトの作品数なら十分な速さで、インデックス追加のデプロイも不要になる）
        const snap = await db.collection(collections.portfolioItems).orderBy("order").get();
        const sameCategory = snap.docs.filter((d) => d.data().category === category);
        const nextOrder =
            sameCategory.length === 0
                ? 0
                : Math.max(...sameCategory.map((d) => d.data().order ?? 0)) + 1;

        await db.collection(collections.portfolioItems).add({
            ...fields,
            href: fields.href || null,
            category,
            order: nextOrder,
            coverUrl: null,
        });
    } catch (err) {
        console.error("[admin] 作品の作成に失敗しました:", err);
        return { ok: false, error: "作成に失敗しました" };
    }

    revalidatePath("/admin/portfolio");
    revalidatePath("/portfolio");
    return { ok: true };
}

export async function updatePortfolioItem(id: string, input: ItemFields): Promise<SaveResult> {
    await requireAdmin();
    assertDocId(id);

    const fields = {
        title: input.title.trim(),
        caption: input.caption.trim(),
        href: input.href.trim(),
        ready: input.ready,
    };
    const error = validateFields(fields);
    if (error) return { ok: false, error };

    const db = getAdminDb();
    if (!db) return { ok: false, error: "データベースに接続できません" };

    try {
        await db
            .collection(collections.portfolioItems)
            .doc(id)
            .update({ ...fields, href: fields.href || null });
    } catch (err) {
        console.error("[admin] 作品の更新に失敗しました:", err);
        return { ok: false, error: "更新に失敗しました" };
    }

    revalidatePath("/admin/portfolio");
    revalidatePath("/portfolio");
    return { ok: true };
}

export async function deletePortfolioItem(id: string): Promise<SaveResult> {
    await requireAdmin();
    assertDocId(id);

    const db = getAdminDb();
    if (!db) return { ok: false, error: "データベースに接続できません" };

    try {
        await db.collection(collections.portfolioItems).doc(id).delete();
    } catch (err) {
        console.error("[admin] 作品の削除に失敗しました:", err);
        return { ok: false, error: "削除に失敗しました" };
    }

    const bucket = getAdminBucket();
    if (bucket) {
        await bucket
            .file(coverPath(id))
            .delete({ ignoreNotFound: true })
            .catch((err: unknown) => {
                console.warn("[admin] カバー画像の削除に失敗しました:", err);
            });
    }

    revalidatePath("/admin/portfolio");
    revalidatePath("/portfolio");
    return { ok: true };
}

/** 同じカテゴリ内でだけ上/下に入れ替える */
export async function movePortfolioItem(id: string, direction: "up" | "down"): Promise<SaveResult> {
    await requireAdmin();
    assertDocId(id);

    const db = getAdminDb();
    if (!db) return { ok: false, error: "データベースに接続できません" };

    try {
        const target = await db.collection(collections.portfolioItems).doc(id).get();
        if (!target.exists) return { ok: false, error: "見つかりませんでした" };
        const category = target.data()?.category;

        // where + orderBy(別フィールド) の複合インデックスを避けるため、
        // 全件を order だけで取得してから同じカテゴリだけに絞る
        const snap = await db.collection(collections.portfolioItems).orderBy("order").get();
        const docs = snap.docs.filter((d) => d.data().category === category);
        const index = docs.findIndex((d) => d.id === id);
        if (index < 0) return { ok: false, error: "見つかりませんでした" };

        const swapIndex = direction === "up" ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= docs.length) return { ok: true };

        const a = docs[index];
        const b = docs[swapIndex];
        const batch = db.batch();
        batch.update(a.ref, { order: b.data().order });
        batch.update(b.ref, { order: a.data().order });
        await batch.commit();
    } catch (err) {
        console.error("[admin] 並び替えに失敗しました:", err);
        return { ok: false, error: "並び替えに失敗しました" };
    }

    revalidatePath("/admin/portfolio");
    revalidatePath("/portfolio");
    return { ok: true };
}

export async function setPortfolioItemCover(id: string, url: string): Promise<SaveResult> {
    await requireAdmin();
    assertDocId(id);

    if (
        typeof url !== "string" ||
        url.length > 2000 ||
        !url.startsWith("https://firebasestorage.googleapis.com/")
    ) {
        return { ok: false, error: "画像のURLが不正です" };
    }

    const db = getAdminDb();
    if (!db) return { ok: false, error: "データベースに接続できません" };

    try {
        await db.collection(collections.portfolioItems).doc(id).update({ coverUrl: url });
    } catch (err) {
        console.error("[admin] カバー画像の保存に失敗しました:", err);
        return { ok: false, error: "保存に失敗しました" };
    }

    revalidatePath("/admin/portfolio");
    revalidatePath("/portfolio");
    return { ok: true };
}

export async function clearPortfolioItemCover(id: string): Promise<SaveResult> {
    await requireAdmin();
    assertDocId(id);

    const db = getAdminDb();
    if (!db) return { ok: false, error: "データベースに接続できません" };

    try {
        await db.collection(collections.portfolioItems).doc(id).update({ coverUrl: null });
    } catch (err) {
        console.error("[admin] カバー画像の削除に失敗しました:", err);
        return { ok: false, error: "削除に失敗しました" };
    }

    const bucket = getAdminBucket();
    if (bucket) {
        await bucket
            .file(coverPath(id))
            .delete({ ignoreNotFound: true })
            .catch((err: unknown) => {
                console.warn("[admin] Storage 上のカバー画像の削除に失敗しました:", err);
            });
    }

    revalidatePath("/admin/portfolio");
    revalidatePath("/portfolio");
    return { ok: true };
}
