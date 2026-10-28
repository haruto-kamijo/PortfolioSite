// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin/cookieName";
import { DEFAULT_LOCALE } from "@/lib/i18n";

/**
 * 公開ページの言語の振り分けと、/admin の目隠しを行う。
 *
 * ■ 言語
 * 日本語が既定で、URL に接頭辞を付けない（/home）。英語は /en/home。
 * ページの実体は app/[lang] 配下にあるため、接頭辞の無い URL は /ja/home に rewrite して描画する。
 * /ja/home のように直接アクセスされた場合は、同じ内容の URL が2つにならないよう /home へ転送する。
 *
 * ■ /admin
 * Cookie が無いリクエストは、存在しないパスへ rewrite して通常の 404 を返す。
 * こうすると「存在しないURL」と応答が完全に一致するため、
 * /admin に何かがあると推測できなくなる。
 * （レイアウトから notFound() を投げると Next 内部のエラー用シェルが返り、
 *   通常の 404 と HTML 構造が変わってしまう）
 *
 * ここでは Cookie の有無しか見ない。middleware は Edge ランタイムで動き
 * firebase-admin が使えないため、署名の検証はできない。
 * 実際の検証は app/admin/layout.tsx がサーバー側で行う。
 * つまりこれは目隠しであって、認可の実体ではない。
 */
export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
        if (!req.cookies.has(ADMIN_SESSION_COOKIE)) {
            // ここでrewriteすると app/admin/layout.tsx 自体が呼ばれなくなるため、
            // その後段のログ（getAdminUser側）には何も残らない。
            // Cookie自体が届いていないのか、届いた上で検証に失敗しているのかを
            // 切り分けられるよう、ここにも記録しておく。
            console.warn(`[admin] middleware: セッションCookieが無いため404にrewriteします (${pathname})`);
            // 存在しない公開ページ（/__not_found__ → /ja/__not_found__）と同じ経路で 404 にする
            return NextResponse.rewrite(new URL(`/${DEFAULT_LOCALE}/__not_found__`, req.url));
        }
        return NextResponse.next();
    }

    // 既定言語の接頭辞付き URL は、接頭辞なしに寄せる（/ja/home → /home）
    if (pathname === `/${DEFAULT_LOCALE}` || pathname.startsWith(`/${DEFAULT_LOCALE}/`)) {
        const url = req.nextUrl.clone();
        url.pathname = pathname.slice(DEFAULT_LOCALE.length + 1) || "/";
        return NextResponse.redirect(url, 308);
    }

    // 英語のページはそのまま app/[lang] で描画する
    if (pathname === "/en" || pathname.startsWith("/en/")) {
        return NextResponse.next();
    }

    // それ以外は日本語として描画する（/home → /ja/home）
    const url = req.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
}

export const config = {
    // API・ログイン・Next の内部ファイル・拡張子付きのファイル（画像や robots.txt）は対象外
    matcher: ["/((?!api/|_next/|login(?:/|$)|.*\\.[^/]+$).*)"],
};
