/** @type {import('next').NextConfig} */
const nextConfig = {
    // remotePatterns は置かない。作品のカバー画像（Cloud Storage）は next/image の unoptimized で表示しているので不要で、
    // 置くと外部の誰でも /_next/image に他人のバケットの画像を処理させられる（Next 14 の画像最適化には未修正の脆弱性がある）
};

export default nextConfig;
