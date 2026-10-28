// src/lib/admin/revalidatePublic.ts

import { revalidatePath } from "next/cache";

/**
 * 公開ページのキャッシュ（ISR）を日英まとめて捨てる。管理画面で保存したあとに呼ぶ。
 *
 * 公開ページの実体は app/[lang] 配下にあり、/home や /en/home は middleware の rewrite を経て
 * /ja/home・/en/home として描画・キャッシュされる。個々の URL ではなく
 * [lang] のレイアウトごと無効にすれば、言語やページの追加に関係なくすべてが更新される。
 */
export const revalidatePublicPages = () => revalidatePath("/[lang]", "layout");
