import { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    domains: ['thumbnail.dowha.kim', 'images.dowha.kim'], // ✅ 두 개의 도메인 추가
  },
  async redirects() {
    return [
      {
        source: '/feed',
        destination: '/api/rss',
        permanent: true,
      },
      {
        source: '/posts',
        destination: '/writings',
        permanent: true,
      },
      {
        source: '/posts/fifty-people-2016',
        destination: '/books/fifty-people-2016',
        permanent: true, // ✅ 301 영구 리다이렉트
      },
      {
        source: '/posts/mori-in-progress-2017',
        destination: '/books/mori-in-progress-2017',
        permanent: true, // ✅ 301 영구 리다이렉트
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/api/rss',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/rss+xml',
          },
        ],
      },
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/xml',
          },
        ],
      },
    ]
  },
}

export default nextConfig
