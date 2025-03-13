/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://blog.dowha.kim',
  generateRobotsTxt: true, // ✅ 자동으로 robots.txt 생성
  changefreq: 'daily', // 페이지 주소 변경 빈도
  sitemapSize: 50000, // 사이트맵 파일
  generateIndexSitemap: false, // 인덱스 파일 비활성화 → sitemap-0.xml 방지
  priority: 0.7, // 기본 우선순위 (기본값, 다른 페이지에 적용)
  transform: async (config, path) => {
    if (path.includes('[slug]')) {
      return null // null을 반환하면 사이트맵에서 제거됨
    }

    return {
      loc: path,
      changefreq: 'weekly',
      priority: path === '/' ? 1.0 : path.startsWith('/posts') ? 0.5 : 0.7,
    }
  },
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/series/[slug]', '/posts/[slug]'] }, // 동적 경로 차단
      { userAgent: 'Googlebot', allow: '/' },
      { userAgent: 'OpenAI-GPT', allow: '/' },
      { userAgent: 'bingbot', allow: '/' },
      { userAgent: 'Anthropic-AI', allow: '/' },
      { userAgent: 'Claude', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
    ],
    additionalSitemaps: [
      'https://blog.dowha.kim/api/rss', // ✅ RSS 사이트맵 추가
    ],
  },
}
