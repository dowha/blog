/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/feed",
        destination: "/api/rss",
        permanent: true, // 301 리디렉트 (영구 이동)
      },
    ];
  },
};

module.exports = nextConfig;
