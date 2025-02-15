/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://blog.dowha.kim',
  generateRobotsTxt: true, // ✅ 자동으로 robots.txt 생성
  changefreq: 'daily', // 페이지 주소 변경 빈도
  sitemapSize: 50000, // 사이트맵 파일
  generateIndexSitemap: false, // 인덱스 파일 비활성화 → sitemap-0.xml 방지
  priority: 0.7, // 기본 우선순위 (기본값, 다른 페이지에 적용)
  transform: async (config, path) => {
    return {
      loc: path,
      changefreq: 'weekly',
      priority: path === '/' ? 1.0 : path.startsWith('/posts') ? 0.5 : 0.7, // ✅ 홈은 1.0, posts/*는 0.5, 그 외 0.7
    };
  },
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: 'Googlebot', allow: '/' },
      { userAgent: 'OpenAI-GPT', allow: '/' },
      { userAgent: 'bingbot', allow: '/' },
      { userAgent: 'Anthropic-AI', allow: '/' },
      { userAgent: 'Claude', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
    ],
  },
};
