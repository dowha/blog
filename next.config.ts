import { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["thumbnail.dowha.kim", "images.dowha.kim"], // ✅ 두 개의 도메인 추가
  },
  async redirects() {
    return [
      {
        source: "/feed",
        destination: "/api/rss",
        permanent: true,
      },
      {
        source: "/posts",
        destination: "/writings",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/rss",
        headers: [
          {
            key: "Content-Type",
            value: "application/rss+xml",
          },
        ],
      },
      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Content-Type",
            value: "application/xml",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
