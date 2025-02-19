import { NextConfig } from "next";

const nextConfig: NextConfig = {
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
