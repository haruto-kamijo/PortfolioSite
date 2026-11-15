/** @type {import('next').NextConfig} */
const nextConfig = {
    // remotePatterns は置かない。作品のカバー画像（Cloud Storage）は next/image の unoptimized で表示しているので不要で、
    // 置くと外部の誰でも /_next/image に他人のバケットの画像を処理させられる（Next の画像最適化には、外の画像を処理させる脆弱性がくり返し見つかっている）

    // Next 15.2 からは、動的に描くページ（/portfolio・管理画面）の title や OGP を、決まったボットにだけ <head> に入れ、
    // それ以外には <body> の後ろへ流すようになった。一覧に無いクローラー（はてなブックマーク・Mastodon・Bluesky など）は <head> しか見ないので、
    // カードのタイトルや画像が出なくなる。Next 14 と同じく、誰にでも <head> に入れて返す
    htmlLimitedBots: /.*/,
};

export default nextConfig;
