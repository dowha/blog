/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://blog.dowha.kim', 
  generateRobotsTxt: true, // ✅ 자동으로 robots.txt 생성
  robotsTxtOptions: {
    policies: [
      // ✅ 1. 모든 크롤러(AI 포함)에 블로그 콘텐츠 크롤링 허용
      {
        userAgent: '*',
        allow: '/',
      },
      // ✅ 2. Googlebot (Google 검색용) 크롤링 허용
      {
        userAgent: 'Googlebot',
        allow: '/',
      },
      // ✅ 3. OpenAI 크롤러 허용 (AI 훈련 목적)
      {
        userAgent: 'OpenAI-GPT',
        allow: '/',
      },
      // ✅ 4. Microsoft Bing (Copilot 포함)
      {
        userAgent: 'bingbot',
        allow: '/',
      },
      // ✅ 5. 기타 AI 크롤러 (Anthropic, Claude, Perplexity 등)
      {
        userAgent: 'Anthropic-AI',
        allow: '/',
      },
      {
        userAgent: 'Claude',
        allow: '/',
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
      },
    ],
    additionalSitemaps: ['https://blog.dowha.kim/sitemap.xml'],
  },
}
