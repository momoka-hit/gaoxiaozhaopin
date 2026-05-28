import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // 静态导出，适合 Cloudflare Pages
  images: { unoptimized: true },
  // 禁用 Next.js 内置的 image optimization（需要服务端）
  trailingSlash: true,
};

export default nextConfig;
