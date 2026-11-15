/** @type {import('next').NextConfig} */
const nextConfig = {
    // remotePatterns は置かない。作品のカバー画像（Cloud Storage）は next/image の unoptimized で表示しているので不要で、
    // 置くと外部の誰でも /_next/image に他人のバケットの画像を処理させられる（Next の画像最適化には、外の画像を処理させる脆弱性がくり返し見つかっている）
};

export default nextConfig;
