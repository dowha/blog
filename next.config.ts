import { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // @uiw/react-md-editor(및 미리보기 의존성)는 ESM에서 CSS를 import하는데,
  // Pages Router는 node_modules 내부 글로벌 CSS import를 막으므로 직접 트랜스파일하게 한다.
  transpilePackages: ['@uiw/react-md-editor', '@uiw/react-markdown-preview'],
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
        // 글쓰기 표기 지침: /desk/style → /style → /style-guide 순으로 옮김
        source: '/desk/style',
        destination: '/style-guide',
        permanent: true,
      },
      {
        source: '/style',
        destination: '/style-guide',
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
        // 보안 헤더: HTTPS 고정(하위 도메인 제외), MIME 추측 금지, 다른 사이트의 iframe 삽입 차단
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
        ],
      },
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
