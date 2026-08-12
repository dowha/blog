/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://blog.dowha.kim',
  generateRobotsTxt: true, // ✅ 자동으로 robots.txt 생성
  changefreq: 'daily', // 페이지 주소 변경 빈도
  sitemapSize: 50000, // 사이트맵 파일
  generateIndexSitemap: false, // 인덱스 파일 비활성화 → sitemap-0.xml 방지
  priority: 0.7, // 기본 우선순위 (기본값, 다른 페이지에 적용)
  transform: async (config, path) => {
    if (path.includes('[slug]') || path.startsWith('/desk')) {
      return null // null을 반환하면 사이트맵에서 제거됨 (/desk 관리자 페이지 제외)
    }

    return {
      loc: path,
      changefreq: 'weekly',
      priority:
        path === '/'
          ? 1.0
          : path.startsWith('/posts') || path.startsWith('/books')
          ? 0.5
          : 0.7,
    }
  },
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/desk', '/series/[slug]', '/posts/[slug]', '/books/[slug]'],
      },
      // 명명된 봇은 각자 그룹만 적용되므로 /desk 차단을 개별로 명시해야 실제로 막힘
      { userAgent: 'Googlebot', allow: '/', disallow: ['/desk'] },
      { userAgent: 'OpenAI-GPT', allow: '/', disallow: ['/desk'] },
      { userAgent: 'bingbot', allow: '/', disallow: ['/desk'] },
      { userAgent: 'Anthropic-AI', allow: '/', disallow: ['/desk'] },
      { userAgent: 'Claude', allow: '/', disallow: ['/desk'] },
      { userAgent: 'PerplexityBot', allow: '/', disallow: ['/desk'] },
    ],
    additionalSitemaps: [
      'https://blog.dowha.kim/api/rss', // ✅ RSS 사이트맵 추가
    ],
  },
}
