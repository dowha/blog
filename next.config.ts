import { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/feed",
        destination: "/api/rss",
        permanent: true, // 301 리디렉트 (영구 이동)
      },
      {
        source: "/posts",
        destination: "/writings",
        permanent: true, // 301 리디렉트 (영구 이동)
      },
    ];
  },
  async headers() {
    return [
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
