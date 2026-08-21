/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                // 作品のカバー画像（Cloud Storage のダウンロードURL）を next/image で扱えるようにする
                protocol: "https",
                hostname: "firebasestorage.googleapis.com",
                pathname: "/v0/b/**",
            },
        ],
    },
};

export default nextConfig;
